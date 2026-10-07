import { expect, test, type Locator, type Page } from '@playwright/test'
import { overflow, smallTargets } from './support/layout'

// The pseudo-locale build (npm run build:pseudo) has every message in accented, longer text, so a layout that only
// holds for the short English words shows here. It is served beside the real site, under /__pseudo__/. Both languages
// are checked: the Spanish messages are the longest the site has, and the pseudo-locale makes them longer.
const locales = ['en', 'es'] as const
// 767 is the widest drawer, 768 the narrowest top bar with its links, and 320 the narrowest window.
const widths = [320, 767, 768]
// Their names are pseudo-localized messages, so they are found by what they do: each opens a list, of themes and of
// languages, in the order of the bar.
const triggers = (page: Page) => page.locator('button[popovertarget][aria-expanded]:visible')

async function openPseudoSite(page: Page, locale: (typeof locales)[number], width: number) {
  await page.setViewportSize({ width, height: 800 })
  await page.addInitScript((value) => localStorage.setItem('forma-ui-locale', value), locale)
  await page.goto('./__pseudo__/docs/foundations/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
}

async function expectToFit(page: Page, scope = page.locator('body')) {
  expect(await overflow(page)).toEqual({ scroll: 0, outside: [], clipped: [] })
  expect(await smallTargets(scope)).toEqual([])
}

// The bar and the drawer each hold the two switchers: every list is opened on its own and has to fit, with targets of
// 44 px, as the whole page does with it open.
async function expectEachListToFit(page: Page, scope?: Locator) {
  const buttons = triggers(page)
  await expect(buttons).toHaveCount(2)
  for (const index of [0, 1]) {
    await buttons.nth(index).click()
    await expect(page.getByRole('list', { name: /^\[/ })).toBeVisible()
    await expectToFit(page, scope)
    await page.keyboard.press('Escape')
    await expect(page.getByRole('list', { name: /^\[/ })).toBeHidden()
  }
}

for (const locale of locales) {
  for (const width of widths) {
    test.describe(`the pseudo-locale in ${locale} at ${width} px`, () => {
      test.beforeEach(async ({ page }) => {
        await openPseudoSite(page, locale, width)
      })

      // Without this, every test below would pass on the English of the real site if the build were not the pseudo one.
      test('is on screen: the heading and the title are pseudo-localized', async ({ page }) => {
        await expect(page.getByRole('heading', { level: 1 })).toHaveText(/^\[.+\]$/)
        expect(await page.title()).toMatch(/^\[.+\]/)
      })

      test('has a top bar that fits, with targets of 44 px', async ({ page }) => {
        await expectToFit(page, page.locator('header'))
      })

      if (width < 768) {
        test('has a drawer that fits, with targets of 44 px, and each of its lists open', async ({ page }) => {
          // Below 768 px the bar has two buttons, the search and the menu, and both have pseudo-localized names. Only the
          // menu reports whether it is expanded.
          await page.getByRole('button', { expanded: false }).click()
          const drawer = page.getByRole('dialog')
          await expect(drawer).toBeVisible()
          await expectToFit(page, drawer)

          await expectEachListToFit(page, drawer)
        })
      } else {
        test('has each list open in the top bar, and it fits', async ({ page }) => {
          await expectEachListToFit(page)
        })
      }
    })
  }
}
