import { expect, test, type Page } from '@playwright/test'
import { routes } from '../src/routes'
import { recordShifts, totalShift } from './support/shift'

// Foundations and the catalog load on demand. These specs hold the two promises that make that safe: a direct link
// fetches the page beside the app, and neither a direct link nor a client-side navigation moves the layout while the
// page is on its way.
const widths = [390, 1440]

// The pages that load on demand: the name of their chunk, their path, their heading, and where to start a navigation to
// them from (a page that is not itself lazy, so the navigation is the one that waits for the chunk).
const lazyPages = [
  { chunk: 'GettingStarted', path: './docs/getting-started/', heading: 'Getting started', link: 'Getting started' },
  { chunk: 'Foundations', path: './docs/foundations/', heading: 'Foundations', link: 'Foundations' },
  { chunk: 'CatalogPage', path: './docs/components/', heading: 'Components', link: 'Components' },
  // The drawer has no link to a reference: its client-side navigation starts at the catalog (see the end of the file).
  { chunk: 'ComponentDetail', path: './docs/components/button/', heading: 'Button', link: null },
] as const
type LazyPage = (typeof lazyPages)[number]

/** Holds the chunk of the page back until `release` is called: a slow network, without a timer to wait out. */
async function holdChunk(page: Page, { chunk }: LazyPage) {
  let release = () => {}
  const gate = new Promise<void>((resolve) => (release = resolve))
  await page.route(`**/assets/${chunk}-*.js`, async (route) => {
    await gate
    await route.continue()
  })
  return release
}

test.describe('a direct link to a page that loads on demand', () => {
  for (const lazy of lazyPages) {
    test(`is answered with HTML that preloads the chunk and the stylesheet of ${lazy.chunk}`, async ({ request }) => {
      const html = await (await request.get(lazy.path)).text()

      expect(html).toMatch(
        new RegExp(`<link rel="modulepreload" crossorigin href="/forma-ui/assets/${lazy.chunk}-[\\w-]+\\.js"`),
      )
      expect(html).toMatch(
        new RegExp(`<link rel="stylesheet" crossorigin href="/forma-ui/assets/${lazy.chunk}-[\\w-]+\\.css"`),
      )
    })

    for (const width of widths) {
      test(`does not move the layout while ${lazy.chunk} arrives, at ${width} px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 800 })
        await recordShifts(page)
        const release = await holdChunk(page, lazy)
        await page.goto(lazy.path, { waitUntil: 'commit' })

        // While the chunk is held the content area is already as tall as a screen, so the footer is out of sight.
        await expect
          .poll(() => page.locator('main').evaluate((main) => main.getBoundingClientRect().height))
          .toBeGreaterThanOrEqual(800)
        release()
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

        expect(await totalShift(page)).toBe(0)
      })
    }
  }

  test('does not preload a chunk on a page that does not load on demand', async ({ request }) => {
    const html = await (await request.get('./')).text()

    // Its messages are preloaded by a script of the head, which writes the tags in the language of the visitor.
    expect(html).not.toContain('<link rel="modulepreload"')
  })
})

test.describe('a client-side navigation to a page that loads on demand', () => {
  test.use({ viewport: { width: 390, height: 800 } })

  for (const lazy of lazyPages.filter((page) => page.link !== null)) {
    test(`keeps the page as tall as a screen and focus on the menu button until ${lazy.chunk} arrives, then focuses its heading`, async ({
      page,
    }) => {
      await recordShifts(page)
      // The start is a page that is not lazy, and is not the destination.
      await page.goto('./')
      const release = await holdChunk(page, lazy)

      await page.getByRole('button', { name: 'Open menu' }).click()
      await page.getByRole('dialog', { name: 'Menu' }).getByRole('link', { name: lazy.link! }).click()

      await expect(page).toHaveURL(new RegExp(`${lazy.path.slice(1)}$`))
      await expect
        .poll(() => page.locator('main').evaluate((main) => main.getBoundingClientRect().height))
        .toBeGreaterThanOrEqual(800)
      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(0)
      await expect(page.getByRole('button', { name: 'Open menu' })).toBeFocused()

      release()
      await expect(page.getByRole('heading', { level: 1, name: lazy.heading })).toBeFocused()
      expect(await totalShift(page)).toBe(0)
    })
  }
})

test.describe('a client-side navigation from the catalog to a reference', () => {
  test.use({ viewport: { width: 390, height: 800 } })

  test('keeps the page as tall as a screen until the chunk of the reference arrives, then focuses its heading', async ({
    page,
  }) => {
    const reference = lazyPages.find(({ chunk }) => chunk === 'ComponentDetail')!
    await recordShifts(page)
    await page.goto('./docs/components/')
    await expect(page.getByRole('heading', { level: 1, name: 'Components' })).toBeVisible()
    const release = await holdChunk(page, reference)

    await page.getByRole('link', { name: 'View the Button reference' }).click()

    await expect(page).toHaveURL(/\/docs\/components\/button\/$/)
    await expect
      .poll(() => page.locator('main').evaluate((main) => main.getBoundingClientRect().height))
      .toBeGreaterThanOrEqual(800)
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(0)

    release()
    await expect(page.getByRole('heading', { level: 1, name: 'Button' })).toBeFocused()
    expect(await totalShift(page)).toBe(0)
  })
})

test.describe('the build output', () => {
  // Pages publishes dist/ as it is: the manifest that preloading reads is deleted once it has been used.
  for (const path of ['./.vite/manifest.json', './__pseudo__/.vite/manifest.json']) {
    test(`does not publish ${path}`, async ({ request }) => {
      expect((await request.get(path)).status()).toBe(404)
    })
  }
})

// A page that loads on demand has to be preloaded by the HTML of its route, and so do its messages, in the language the
// visitor reads. Whatever chunk a page asks for once it has loaded, its own HTML already names: this holds for every
// route, so a page that is lazy in App.tsx and missing from the list in scripts/emit-route-html.ts (or the other way
// round), or a page that needs a catalogue its route does not list, fails here, not only in a slow network.
test.describe('every route', () => {
  const bases = ['./', './__pseudo__/']

  for (const locale of ['en-US', 'es-ES']) {
    for (const base of bases) {
      for (const route of routes) {
        test.describe(`in ${locale}`, () => {
          test.use({ locale })

          test(`under ${base} asks for no script or stylesheet that its HTML did not name: ${route.path}`, async ({
            page,
            request,
          }) => {
            const url = `${base}${route.path.slice(1)}`
            const html = await (await request.get(url)).text()
            const language = locale.slice(0, 2)
            // The tags of the page, and the list of the script of the head for the language of the visitor.
            const tagged = [...html.matchAll(/(?:href|src)="([^"]*\/assets\/[^"]+)"/g)].map((match) => match[1])
            const listed = [
              ...(new RegExp(`"${language}":\\[([^\\]]*)\\]`).exec(html)?.[1] ?? '').matchAll(/"([^"]+)"/g),
            ]
            const named = new Set([...tagged, ...listed.map((match) => match[1])])

            const asked = new Set<string>()
            page.on('request', (made) => {
              const { pathname } = new URL(made.url())
              if (/\/assets\/.+\.(js|css)$/.test(pathname)) asked.add(pathname)
            })
            await page.goto(url)
            await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
            await page.waitForLoadState('networkidle')

            expect([...asked].filter((pathname) => !named.has(pathname))).toEqual([])
            expect(asked.size).toBeGreaterThan(0)
          })
        })
      }
    }
  }
})
