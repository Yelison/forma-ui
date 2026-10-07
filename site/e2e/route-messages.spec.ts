import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test, type Page } from '@playwright/test'
import { catalogNames } from '../src/i18n/catalogNames'
import { liveRegionOf } from './support/switcher'
import { recordShifts, totalShift } from './support/shift'

// The messages of a page are chunks of their own: a direct link preloads the ones of its route in the language the
// first-paint script resolved, a client-side navigation fetches the ones of the page it reaches, and choosing the other
// language fetches those of the page on screen before anything changes. These specs hold that, and that none of it can
// be seen: no English or ids on the first frame in Spanish, no blank or lost focus when the language changes, no shift.

/** The catalogues the page asks for, as `<name>.<language>` (`docs.button.es`), from its first request on. */
function recordCatalogues(page: Page) {
  const asked: string[] = []
  page.on('request', (made) => {
    const catalogue = /\/assets\/([\w.]+?\.(?:en|es))-[\w-]+\.js$/.exec(new URL(made.url()).pathname)?.[1]
    if (catalogue !== undefined) asked.push(catalogue)
  })
  return asked
}

const sorted = (names: readonly string[]) => [...names].sort()

/** Holds every Spanish catalogue back until `release` is called: a slow network, without a timer to wait out. */
async function holdSpanishCatalogues(page: Page) {
  let release = () => {}
  const gate = new Promise<void>((resolve) => (release = resolve))
  await page.route('**/assets/*.es-*.js', async (route) => {
    await gate
    await route.continue()
  })
  return release
}

const trigger = (page: Page) => page.getByRole('button', { name: /^(Language|Idioma): / })

test.describe('the catalogues a page fetches', () => {
  test('are the ones of its route in the language in use, and none of the other language', async ({ page }) => {
    const asked = recordCatalogues(page)

    await page.goto('./')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await page.waitForLoadState('networkidle')

    expect(sorted(asked)).toEqual(['common.en', 'home.en'])
  })

  test.describe('of a reference page, in Spanish', () => {
    test.use({ locale: 'es-ES' })

    test('are the ones of that component only, each fetched once: the preload and the import are the same request', async ({
      page,
    }) => {
      const asked = recordCatalogues(page)

      await page.goto('./docs/components/button/')
      await expect(page.getByRole('heading', { level: 1, name: 'Button' })).toBeVisible()
      await page.waitForLoadState('networkidle')

      expect(sorted(asked)).toEqual(['common.es', 'detail.es', 'docs.button.es', 'specimens.es'])
    })
  })

  test.describe('of the page that a client-side navigation reaches, in Spanish', () => {
    test.use({ locale: 'es-ES', viewport: { width: 390, height: 800 } })

    test('are fetched for that page', async ({ page }) => {
      await page.goto('./docs/getting-started/')
      await expect(page.getByRole('heading', { level: 1, name: 'Primeros pasos' })).toBeVisible()
      const asked = recordCatalogues(page)

      await page.getByRole('button', { name: 'Abrir menú' }).click()
      await page.getByRole('dialog', { name: 'Menú' }).getByRole('link', { name: 'Componentes' }).click()

      await expect(page.getByRole('heading', { level: 1, name: 'Componentes' })).toBeVisible()
      expect(sorted(asked)).toEqual(['catalog.es', 'specimens.es'])
    })
  })

  test.describe('of a page that loads on demand, reached by a client-side navigation', () => {
    test.use({ locale: 'es-ES', viewport: { width: 390, height: 800 } })

    test('are asked for together with its chunk, not after it or before it, and move nothing', async ({ page }) => {
      await recordShifts(page)
      await page.goto('./docs/getting-started/')
      await expect(page.getByRole('heading', { level: 1, name: 'Primeros pasos' })).toBeVisible()
      const asked: string[] = []
      page.on('request', (made) => asked.push(new URL(made.url()).pathname))
      let release = () => {}
      const gate = new Promise<void>((resolve) => (release = resolve))
      await page.route(/\/assets\/(catalog\.es|specimens\.es|CatalogPage)-.*\.js$/, async (route) => {
        await gate
        await route.continue()
      })

      await page.getByRole('button', { name: 'Abrir menú' }).click()
      await page.getByRole('dialog', { name: 'Menú' }).getByRole('link', { name: 'Componentes' }).click()

      // Everything is held, so what has been asked for by now was asked for without waiting for anything else.
      await expect
        .poll(() =>
          ['catalog.es-', 'specimens.es-', 'CatalogPage-'].map((name) => asked.some((path) => path.includes(name))),
        )
        .toEqual([true, true, true])
      // A layout shift within half a second of an input is not counted: hold the page past that, as a slow network does.
      await page.waitForTimeout(600)
      release()
      await expect(page.getByRole('heading', { level: 1, name: 'Componentes' })).toBeVisible()
      expect(await totalShift(page)).toBe(0)
    })
  })

  test('are those of the page on screen, in the new language, when the language changes', async ({ page }) => {
    await page.goto('./docs/foundations/')
    await expect(page.getByRole('heading', { level: 1, name: 'Foundations' })).toBeVisible()
    const asked = recordCatalogues(page)

    await trigger(page).click()
    await page.getByRole('button', { name: 'Español', exact: true }).click()

    await expect(page.getByRole('heading', { level: 1, name: 'Fundamentos' })).toBeVisible()
    expect(sorted(asked)).toEqual(['common.es', 'foundations.es'])
  })

  // A page that was visited and left is not on screen: the change of language neither fetches its messages nor waits
  // for them.
  test.describe('when the language changes after a navigation away from a page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('./docs/foundations/')
      await expect(page.getByRole('heading', { level: 1, name: 'Foundations' })).toBeVisible()
      await page.getByRole('link', { name: 'Documentation', exact: true }).click()
      await expect(page.getByRole('heading', { level: 1, name: 'Getting started' })).toBeVisible()
    })

    test('are only those of the page that is on screen', async ({ page }) => {
      const asked = recordCatalogues(page)

      await trigger(page).click()
      await page.getByRole('button', { name: 'Español', exact: true }).click()

      await expect(page.getByRole('heading', { level: 1, name: 'Primeros pasos' })).toBeVisible()
      expect(sorted(asked)).toEqual(['common.es'])
    })

    test('the change applies even if the messages of the page that was left cannot be fetched', async ({ page }) => {
      await page.route('**/assets/foundations.es-*.js', (route) => route.abort())

      await trigger(page).click()
      await page.getByRole('button', { name: 'Español', exact: true }).click()

      await expect(page.getByRole('heading', { level: 1, name: 'Primeros pasos' })).toBeVisible()
      await expect(page.locator('html')).toHaveAttribute('lang', 'es')
    })
  })
})

test.describe('when the messages of the other language cannot be fetched', () => {
  test('the page stays in its language, remembers nothing, and the switcher says so', async ({ page }) => {
    await page.goto('./docs/foundations/')
    await expect(page.getByRole('heading', { level: 1, name: 'Foundations' })).toBeVisible()
    await page.route('**/assets/*.es-*.js', (route) => route.abort())

    await trigger(page).click()
    await page.getByRole('button', { name: 'Español', exact: true }).click()

    await expect(liveRegionOf(trigger(page))).toHaveText('The language could not be loaded. The page stays in English.')
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    await expect(page.getByRole('heading', { level: 1, name: 'Foundations' })).toBeVisible()
    await expect(trigger(page)).toBeFocused()
    expect(await page.evaluate(() => localStorage.getItem('forma-ui-locale'))).toBeNull()
  })
})

// What the page looked like at each moment its text changed on a first load: its visible text, its accessible names and
// its title. Nothing in them may be English, or an id, on a Spanish visitor's way to the page.
const englishChrome = /\b(Skip to content|Documentation|Getting started|Foundations|Components|Search|Language|Theme)\b/
const messageIds = new Set(
  catalogNames.flatMap((name) =>
    Object.keys(
      JSON.parse(readFileSync(join(import.meta.dirname, `../src/i18n/catalogs/${name}.en.json`), 'utf8')) as object,
    ),
  ),
)

async function recordText(page: Page) {
  await page.addInitScript(() => {
    const seen: string[] = []
    Object.assign(window, { seen })
    const snapshot = () =>
      [
        document.title,
        document.body?.innerText ?? '',
        ...[...(document.body?.querySelectorAll('[aria-label]') ?? [])].map((element) => element.ariaLabel),
      ].join('\n')
    new MutationObserver(() => {
      // Before <body> there is nothing to see, and the title is still the one of the HTML until the head script runs.
      if (document.body === null) return
      const now = snapshot()
      if (seen.at(-1) !== now) seen.push(now)
    }).observe(document, { childList: true, subtree: true, characterData: true, attributes: true })
  })
}

test.describe('a direct link in Spanish, with its JS and its messages held back', () => {
  test.use({ locale: 'es-ES', viewport: { width: 390, height: 800 } })

  for (const [path, heading, chunk] of [
    ['./', 'Diseña con intención. Construye con confianza.', null],
    ['./docs/foundations/', 'Fundamentos', 'Foundations'],
    ['./docs/components/', 'Componentes', 'CatalogPage'],
    ['./docs/components/button/', 'Button', 'ComponentDetail'],
  ] as const) {
    test(`shows no English and no message id on the way to ${path}, and does not move the layout`, async ({ page }) => {
      await recordText(page)
      await recordShifts(page)
      const releaseMessages = await holdSpanishCatalogues(page)
      let releasePage = () => {}
      const pageGate = new Promise<void>((resolve) => (releasePage = resolve))
      await page.route('**/assets/*.js', async (route) => {
        // The app is late too, and so is the chunk of the page: the messages are not the only thing that is on its way.
        if (chunk !== null && route.request().url().includes(`/${chunk}-`)) await pageGate
        else await new Promise((resolve) => setTimeout(resolve, 300))
        await route.fallback()
      })

      await page.goto(path, { waitUntil: 'commit' })
      // The chrome has to be Spanish before it is on screen at all: nothing renders until its messages are here.
      await page.waitForTimeout(800)
      await expect(page.getByRole('banner')).toHaveCount(0)

      releaseMessages()
      await expect(page.getByRole('link', { name: 'Saltar al contenido' })).toBeAttached()
      releasePage()
      await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible()

      const seen = await page.evaluate(() => (window as unknown as { seen: string[] }).seen)
      expect(seen.length).toBeGreaterThan(0)
      for (const text of seen) {
        expect(text).not.toMatch(englishChrome)
        expect([...messageIds].filter((id) => text.includes(id))).toEqual([])
      }
      expect(await totalShift(page)).toBe(0)
    })
  }
})

// A language change on every kind of page: the page that is open does not blank while the other language is on its
// way, and keeps the focus of the person who asked. Its text does reflow when it changes language (the words have other
// lengths), so unlike a load or a navigation it is not held to a shift of zero.
test.describe('changing the language with the messages of the other language held back', () => {
  test.use({ viewport: { width: 1024, height: 800 } })

  // The path, and a sentence of the page in each language.
  for (const [path, english, spanish] of [
    ['./', 'Design with intent. Build with confidence.', 'Diseña con intención. Construye con confianza.'],
    ['./docs/getting-started/', 'Getting started', 'Primeros pasos'],
    ['./docs/foundations/', 'Foundations', 'Fundamentos'],
    ['./docs/components/', 'Components', 'Componentes'],
    ['./docs/components/dialog/', 'A modal dialog with a title', 'Un diálogo modal con título'],
  ] as const) {
    test(`keeps ${path} on screen until it can change, and then changes all of it`, async ({ page }) => {
      await page.goto(path)
      const heading = page.getByRole('heading', { level: 1 })
      const said = (text: string) => page.getByRole('main').getByText(text).first()
      await expect(said(english)).toBeVisible()
      const release = await holdSpanishCatalogues(page)
      // Any moment without a heading, once the page is up, is a blank page.
      await page.evaluate(() => {
        const blanks: number[] = []
        Object.assign(window, { blanks })
        new MutationObserver(() => {
          if (document.querySelector('h1') === null) blanks.push(performance.now())
        }).observe(document.body, { childList: true, subtree: true })
      })

      await trigger(page).click()
      await page.getByRole('button', { name: 'Español', exact: true }).click()
      await page.waitForTimeout(400)

      // Still English, still there, and the focus is where the person left it.
      await expect(page.locator('html')).toHaveAttribute('lang', 'en')
      await expect(trigger(page)).toHaveAccessibleName('Language: English')
      await expect(heading).toBeVisible()
      await expect(said(english)).toBeVisible()
      await expect(trigger(page)).toBeFocused()

      release()
      await expect(page.locator('html')).toHaveAttribute('lang', 'es')
      await expect(trigger(page)).toHaveAccessibleName('Idioma: español')
      await expect(said(spanish)).toBeVisible()
      await expect(said(english)).toBeHidden()
      await expect(trigger(page)).toBeFocused()
      await expect(liveRegionOf(trigger(page))).toHaveText('Idioma cambiado a español')
      expect(await page.evaluate(() => (window as unknown as { blanks: number[] }).blanks)).toEqual([])
    })
  }
})
