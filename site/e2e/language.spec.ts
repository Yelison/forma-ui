import { expect, test, type Page } from '@playwright/test'

// What the page looked like at one moment of its first load.
interface Moment {
  lang: string
  title: string
  description: string | null
  skipLink: string | null
}

interface FirstLoad {
  /** The moment the parser inserted <body>: only what the HTML and the scripts of <head> have done by then. */
  body?: Moment
  /** The moment the first <h1> appeared, after React's first commit and its layout effects. */
  heading?: Moment & { text: string | null }
}

declare global {
  interface Window {
    firstLoad: FirstLoad
  }
}

/**
 * Records the page at two moments of its first load, from before any script of the page runs. A retrying assertion
 * on the final state cannot tell a page that was right from the first frame from one that fixed itself a moment
 * later; these two snapshots can. A mutation observer calls back in a microtask after the code that changed the page
 * has finished, so the snapshot of the heading is what the browser could paint: it includes the layout effects of
 * React's first commit, and not its passive effects, which run after a paint.
 */
async function recordFirstLoad(page: Page) {
  await page.addInitScript(() => {
    const snapshot = () => ({
      lang: document.documentElement.lang,
      title: document.title,
      description: document.querySelector('meta[name="description"]')?.getAttribute('content') ?? null,
      skipLink: document.querySelector('a[href="#main"]')?.textContent ?? null,
    })
    window.firstLoad = {}
    const observer = new MutationObserver(() => {
      if (window.firstLoad.body === undefined && document.body !== null) window.firstLoad.body = snapshot()
      const heading = document.querySelector('h1')
      if (window.firstLoad.heading === undefined && heading !== null) {
        window.firstLoad.heading = { ...snapshot(), text: heading.textContent }
        observer.disconnect()
      }
    })
    observer.observe(document, { childList: true, subtree: true })
  })
}

async function firstLoadOf(page: Page, path: string): Promise<Required<FirstLoad>> {
  await recordFirstLoad(page)
  await page.goto(path)
  await page.waitForFunction(() => window.firstLoad.heading !== undefined)
  const firstLoad = await page.evaluate(() => window.firstLoad)
  if (firstLoad.body === undefined || firstLoad.heading === undefined)
    throw new Error('the first load was not recorded')
  return { body: firstLoad.body, heading: firstLoad.heading }
}

/**
 * The page as a visitor has it before the JS of the app arrives, which a slow network holds back: the scripts of
 * <head> have run, and the app has not (there is no <h1> yet). This is what the tab and a screen reader have meanwhile.
 */
async function beforeTheApp(page: Page, path: string): Promise<Moment> {
  await page.route('**/assets/*.js', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 2000))
    await route.continue()
  })
  await recordFirstLoad(page)
  await page.goto(path, { waitUntil: 'commit' })
  await page.waitForFunction(() => window.firstLoad.body !== undefined)
  const { body, heading } = await page.evaluate(() => window.firstLoad)
  expect(heading, 'the app has not rendered yet').toBeUndefined()
  if (body === undefined) throw new Error('the page was not recorded')
  return body
}

// With no stored choice the page opens in the first language of the browser that the site speaks; paths do not change.
test.describe('with a Spanish browser', () => {
  test.use({ locale: 'es-ES' })

  test('has <html lang> in Spanish before the body exists: the inline script, not React, sets it', async ({ page }) => {
    const { body } = await firstLoadOf(page, './docs/components/button/')

    expect(body.lang).toBe('es')
  })

  // The title and the description are the ones the tab and a crawler that runs scripts read: Spanish before the JS.
  test.describe('before the JS of the app arrives', () => {
    test('has the title and the description of a deep link in Spanish', async ({ page }) => {
      expect(await beforeTheApp(page, './docs/foundations/')).toMatchObject({
        lang: 'es',
        title: 'Fundamentos · Forma UI',
        description: expect.stringMatching(/^Roles de color/),
      })
    })

    test('has the title and the description of the homepage in Spanish', async ({ page }) => {
      expect(await beforeTheApp(page, './')).toMatchObject({
        lang: 'es',
        title: 'Forma UI · Un sistema de diseño compartido',
        description: expect.stringMatching(/^Forma UI es un sistema de diseño compartido/),
      })
    })

    test('keeps the English head where the stored choice is English', async ({ page }) => {
      await page.addInitScript(() => localStorage.setItem('forma-ui-locale', 'en'))

      expect(await beforeTheApp(page, './docs/foundations/')).toMatchObject({
        lang: 'en',
        title: 'Foundations · Forma UI',
        description: expect.stringMatching(/^Color roles/),
      })
    })
  })

  test('paints a deep link in Spanish from its first frame, with no English in between', async ({ page }) => {
    const { heading } = await firstLoadOf(page, './docs/foundations/')

    expect(heading).toEqual({
      lang: 'es',
      text: 'Fundamentos',
      title: 'Fundamentos · Forma UI',
      description: expect.stringMatching(/^Roles de color/),
      skipLink: 'Saltar al contenido',
    })
    await expect(page).toHaveURL(/\/docs\/foundations\/$/)
  })

  test('describes a component page in Spanish from its first frame, though its title is the same in both', async ({
    page,
  }) => {
    const { heading } = await firstLoadOf(page, './docs/components/button/')

    expect(heading).toMatchObject({
      lang: 'es',
      text: 'Button',
      title: 'Button · Forma UI',
      description: 'Referencia del componente Button: variantes, estados, API y accesibilidad.',
    })
  })

  test('lets the stored choice win, from the first frame', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('forma-ui-locale', 'en'))
    const { body, heading } = await firstLoadOf(page, './docs/foundations/')

    expect(body.lang).toBe('en')
    expect(heading).toMatchObject({ lang: 'en', text: 'Foundations', title: 'Foundations · Forma UI' })
  })

  test('names the chrome in Spanish', async ({ page }) => {
    await page.goto('./')

    await expect(page.getByRole('navigation', { name: 'Principal' })).toBeVisible()
    await expect(page.getByRole('contentinfo')).toHaveText('Forma UI · Construido con cuidado')
  })
})

test.describe('with a French browser', () => {
  test.use({ locale: 'fr-FR' })

  test('has the English head before the JS of the app arrives', async ({ page }) => {
    expect(await beforeTheApp(page, './docs/foundations/')).toMatchObject({
      lang: 'en',
      title: 'Foundations · Forma UI',
      description: expect.stringMatching(/^Color roles/),
    })
  })

  test('falls back to English from the first frame', async ({ page }) => {
    const { body, heading } = await firstLoadOf(page, './docs/foundations/')

    expect(body.lang).toBe('en')
    expect(heading).toMatchObject({ lang: 'en', text: 'Foundations', title: 'Foundations · Forma UI' })
  })
})

// What the browser is sent, before it runs anything. The encoding has to be declared in the first 1024 bytes it reads
// for it, and the scripts that stop a flash have to come before the stylesheet that paints.
test.describe('the HTML of a page', () => {
  for (const path of ['./', './docs/foundations/', './docs/components/button/']) {
    test(`declares its encoding early and runs the first-paint scripts before the stylesheet: ${path}`, async ({
      request,
    }) => {
      const html = await (await request.get(path)).text()

      expect(html.indexOf('<meta charset')).toBeGreaterThanOrEqual(0)
      expect(html.indexOf('<meta charset')).toBeLessThan(1024)
      const stylesheet = html.indexOf('<link rel="stylesheet"')
      expect(stylesheet).toBeGreaterThan(0)
      for (const script of ['getItem("forma-ui-theme")', 'getItem("forma-ui-locale")', 'document.title=']) {
        const position = html.indexOf(script)
        expect(position, script).toBeGreaterThan(0)
        expect(position, script).toBeLessThan(stylesheet)
      }
    })
  }
})
