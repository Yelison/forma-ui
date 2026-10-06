import { expect, test, type Page } from '@playwright/test'
import { notFoundRoute, routes } from '../src/routes'

const widths = [320, 390, 767, 768, 1024, 1199, 1200, 1440]
const themes = ['light', 'dark'] as const
const paths = [...routes.map((route) => `.${route.path}`), `.${notFoundRoute.path}`]

async function overflow(page: Page) {
  return page.evaluate(() => {
    const viewport = document.documentElement.clientWidth
    const page = document.documentElement
    // An element that reaches past the viewport, or text that a box clips, both read as a layout that does not fit.
    const outside = [...document.body.querySelectorAll('*')]
      .filter((element) => element.getBoundingClientRect().right > viewport + 0.5)
      // The drawer's off-canvas parts and the visually hidden text are out of sight on purpose.
      .filter((element) => !element.closest('dialog:not([open])') && !element.closest('.forma-visually-hidden'))
      .map((element) => element.tagName.toLowerCase() + '.' + element.className)
    // A box that is narrower than its text clips it, or lets it spill out; an inline element has no box of its own.
    const clipped = [...document.body.querySelectorAll('h1, a, button, p, li, span')]
      .filter((element) => getComputedStyle(element).display !== 'inline' && !element.closest('.forma-visually-hidden'))
      .filter((element) => element.scrollWidth > element.clientWidth + 1)
      .map((element) => element.textContent)
    return { scroll: page.scrollWidth - viewport, outside, clipped }
  })
}

for (const theme of themes) {
  test.describe(`${theme} theme`, () => {
    test.use({ colorScheme: theme })

    for (const width of widths) {
      test(`has no horizontal scroll and nothing clipped at ${width} px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 800 })
        for (const path of paths) {
          await page.goto(path)
          await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

          expect(await overflow(page), path).toEqual({ scroll: 0, outside: [], clipped: [] })
        }
      })
    }
  })
}
