import { expect, test } from '@playwright/test'
import { notFoundRoute, routes } from '../src/routes'
import { overflow } from './support/layout'

const widths = [320, 390, 767, 768, 1024, 1199, 1200, 1440]
const themes = ['light', 'dark'] as const
const paths = [...routes.map((route) => `.${route.path}`), `.${notFoundRoute.path}`]

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
