import { expect, test, type Page } from '@playwright/test'
import { overflow, smallTargets } from './support/layout'

// The explorer in the pseudo-locale build (see pseudo-locale.spec.ts): its labels, options and specimen text are
// accented and longer than the real ones, in both languages. Each component is opened in the state with the most
// text, because that is the one that has to fit.
const locales = ['en', 'es'] as const
const widths = [320, 767, 768]
const longest = [
  { component: 'Button', value: 'loading' },
  { component: 'Input', value: 'error' },
  { component: 'Badge', value: 'amber' },
]
// The targets of the explorer: its selector, its selects and its buttons. Below 768 px they are 44 px.
const targets = 'a, button, select, label:has(input)'

async function openPseudoHome(page: Page, locale: (typeof locales)[number], width: number) {
  await page.setViewportSize({ width, height: 800 })
  await page.addInitScript((value) => localStorage.setItem('forma-ui-locale', value), locale)
  await page.goto('./__pseudo__/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
}

for (const locale of locales) {
  for (const width of widths) {
    test.describe(`the explorer in the pseudo-locale in ${locale} at ${width} px`, () => {
      test.beforeEach(async ({ page }) => {
        await openPseudoHome(page, locale, width)
      })

      // Without this, the tests below would pass on the English of the real site if the build were not the pseudo one.
      test('is on screen: its caption and its controls are pseudo-localized', async ({ page }) => {
        await expect(page.getByRole('figure')).toHaveAccessibleName(/^\[.+\]$/)
        await expect(page.getByRole('button', { name: /^\[.+\]$/ }).last()).toBeVisible()
      })

      for (const { component, value } of longest) {
        test(`fits with ${component} in its longest state`, async ({ page }) => {
          await page
            .locator('label')
            .filter({ has: page.getByRole('radio', { name: component, exact: true }) })
            .click()
          await page.getByRole('combobox').last().selectOption(value)
          await expect(page.getByRole('radio', { name: component, exact: true })).toBeChecked()

          expect(await overflow(page)).toEqual({ scroll: 0, outside: [], clipped: [] })
          if (width < 768) expect(await smallTargets(page.locator('main'), 44, targets)).toEqual([])
        })
      }
    })
  }
}
