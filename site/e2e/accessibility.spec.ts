import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { notFoundRoute, routes } from '../src/routes'

const themes = ['light', 'dark'] as const

// The page is painted with the theme stored by the first-paint script: this is what the visitor who chose it sees.
const useTheme = (page: Page, theme: (typeof themes)[number]) =>
  page.addInitScript((value) => localStorage.setItem('forma-ui-theme', value), theme)

async function violations(page: Page) {
  const { violations } = await new AxeBuilder({ page }).analyze()
  return violations.map(({ id, nodes }) => ({ id, targets: nodes.map((node) => node.target) }))
}

for (const theme of themes) {
  test.describe(`in the ${theme} theme`, () => {
    for (const route of [...routes, notFoundRoute]) {
      test(`${route.path} has no axe violations`, async ({ page }) => {
        await useTheme(page, theme)
        await page.goto(`.${route.path}`)
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
        // Make sure the theme under test is the one painted, or a pass would say nothing about it.
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme)

        expect(await violations(page)).toEqual([])
      })
    }

    test('the open language list has no axe violations', async ({ page }) => {
      await useTheme(page, theme)
      await page.goto('./docs/components/')
      // The catalog loads on demand: until it arrives the page has the placeholder and no heading, which axe reports.
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await page.getByRole('button', { name: 'Language: English' }).click()
      // Make sure the list is the thing under test: a closed popover is not in the page for axe.
      await expect(page.getByRole('button', { name: 'Español', exact: true })).toBeVisible()

      expect(await violations(page)).toEqual([])
    })

    test('the open theme list has no axe violations', async ({ page }) => {
      await useTheme(page, theme)
      await page.goto('./docs/components/')
      // The catalog loads on demand: until it arrives the page has the placeholder and no heading, which axe reports.
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await page.getByRole('button', { name: 'Theme: ' + theme }).click()
      // Make sure the list is the thing under test: a closed popover is not in the page for axe.
      await expect(page.getByRole('button', { name: 'System', exact: true })).toBeVisible()

      expect(await violations(page)).toEqual([])
    })

    test('the open drawer has no axe violations', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 800 })
      await useTheme(page, theme)
      await page.goto('./docs/components/')
      await page.getByRole('button', { name: 'Open menu' }).click()
      await expect(page.getByRole('dialog', { name: 'Menu' })).toBeVisible()

      expect(await violations(page)).toEqual([])
    })

    test('the open drawer with the language list open has no axe violations', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 800 })
      await useTheme(page, theme)
      await page.goto('./docs/components/')
      await page.getByRole('button', { name: 'Open menu' }).click()
      await page.getByRole('button', { name: 'Language: English' }).click()
      await expect(page.getByRole('button', { name: 'Español', exact: true })).toBeVisible()

      expect(await violations(page)).toEqual([])
    })

    test('the open drawer with the theme list open has no axe violations', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 800 })
      await useTheme(page, theme)
      await page.goto('./docs/components/')
      await page.getByRole('button', { name: 'Open menu' }).click()
      await page.getByRole('button', { name: 'Theme: ' + theme }).click()
      await expect(page.getByRole('button', { name: 'System', exact: true })).toBeVisible()

      expect(await violations(page)).toEqual([])
    })
  })
}
