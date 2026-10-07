import { expect, test, type Page } from '@playwright/test'
import { routes } from '../src/routes'

// Foundations loads on demand. These specs hold the two promises that make that safe: a direct link fetches the page
// beside the app, and neither a direct link nor a client-side navigation moves the layout while the page is on its way.
const widths = [390, 1440]

/** Holds the chunk of the page back until `release` is called: a slow network, without a timer to wait out. */
async function holdChunk(page: Page) {
  let release = () => {}
  const gate = new Promise<void>((resolve) => (release = resolve))
  await page.route('**/assets/Foundations-*.js', async (route) => {
    await gate
    await route.continue()
  })
  return release
}

/** Records every layout shift that no input caused, from the first paint on. */
const recordShifts = (page: Page) =>
  page.addInitScript(() => {
    const shifts: number[] = []
    Object.assign(window, { shifts })
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as (PerformanceEntry & { value: number; hadRecentInput: boolean })[]) {
        if (!entry.hadRecentInput) shifts.push(entry.value)
      }
    }).observe({ type: 'layout-shift', buffered: true })
  })

const totalShift = (page: Page) =>
  page.evaluate(async () => {
    await new Promise((resolve) => setTimeout(resolve, 300))
    return (window as unknown as { shifts: number[] }).shifts.reduce((sum, value) => sum + value, 0)
  })

test.describe('a direct link to a page that loads on demand', () => {
  test('is answered with HTML that preloads the page chunk and its stylesheet', async ({ request }) => {
    const html = await (await request.get('./docs/foundations/')).text()

    expect(html).toMatch(/<link rel="modulepreload" crossorigin href="\/forma-ui\/assets\/Foundations-[\w-]+\.js"/)
    expect(html).toMatch(/<link rel="stylesheet" crossorigin href="\/forma-ui\/assets\/Foundations-[\w-]+\.css"/)
  })

  test('does not preload anything on a page that does not load on demand', async ({ request }) => {
    const html = await (await request.get('./docs/getting-started/')).text()

    expect(html).not.toContain('modulepreload')
  })

  for (const width of widths) {
    test(`does not move the layout while the page arrives, at ${width} px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 })
      await recordShifts(page)
      const release = await holdChunk(page)
      await page.goto('./docs/foundations/', { waitUntil: 'commit' })

      // While the chunk is held the content area is already as tall as a screen, so the footer is out of sight.
      await expect
        .poll(() => page.locator('main').evaluate((main) => main.getBoundingClientRect().height))
        .toBeGreaterThanOrEqual(800)
      release()
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

      expect(await totalShift(page)).toBe(0)
    })
  }
})

test.describe('a client-side navigation to a page that loads on demand', () => {
  test.use({ viewport: { width: 390, height: 800 } })

  test('keeps the page as tall as a screen and focus on the menu button until the page arrives, then focuses its heading', async ({
    page,
  }) => {
    await recordShifts(page)
    await page.goto('./docs/components/')
    const release = await holdChunk(page)

    await page.getByRole('button', { name: 'Open menu' }).click()
    await page.getByRole('dialog', { name: 'Menu' }).getByRole('link', { name: 'Foundations' }).click()

    await expect(page).toHaveURL(/\/docs\/foundations\/$/)
    await expect
      .poll(() => page.locator('main').evaluate((main) => main.getBoundingClientRect().height))
      .toBeGreaterThanOrEqual(800)
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Open menu' })).toBeFocused()

    release()
    await expect(page.getByRole('heading', { level: 1, name: 'Foundations' })).toBeFocused()
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

// A page that loads on demand has to be preloaded by the HTML of its route. Whatever chunk a page asks for once it has
// loaded, its own HTML already names: this holds for every route, so a page that is lazy in App.tsx and missing from the
// list in scripts/emit-route-html.ts (or the other way round) fails here, not only in a slow network.
test.describe('every route', () => {
  const bases = ['./', './__pseudo__/']

  for (const base of bases) {
    for (const route of routes) {
      test(`under ${base} asks for no script or stylesheet that its HTML did not name: ${route.path}`, async ({
        page,
        request,
      }) => {
        const url = `${base}${route.path.slice(1)}`
        const html = await (await request.get(url)).text()
        const named = new Set([...html.matchAll(/(?:href|src)="([^"]*\/assets\/[^"]+)"/g)].map((match) => match[1]))

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
    }
  }
})
