import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { overflow, smallTargets } from './support/layout'

const themes = ['light', 'dark'] as const

async function violations(page: Page) {
  const { violations } = await new AxeBuilder({ page }).analyze()
  return violations.map(({ id, nodes }) => ({ id, targets: nodes.map((node) => node.target) }))
}

// The filters and the dialog change what the page holds, so each state is a page of its own for axe.
const states = {
  'with a category chosen': async (page: Page) => {
    await page.getByText('Feedback', { exact: true }).click()
    await expect(page.getByRole('heading', { level: 2 })).toHaveCount(2)
  },
  'with nothing matching': async (page: Page) => {
    await page.getByRole('textbox', { name: 'Filter by name' }).fill('zzz')
    await expect(page.getByText('No component matches these filters.')).toBeVisible()
  },
  'with the dialog of a specimen open': async (page: Page) => {
    // The dialog enters with a 200 ms fade, and a contrast check made halfway through reads a mixed color.
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.getByRole('button', { name: 'Delete item' }).click()
    await expect(page.getByRole('dialog', { name: 'Delete this item?' })).toBeVisible()
  },
} as const

for (const theme of themes) {
  test.describe(`axe on the catalog in the ${theme} theme`, () => {
    for (const [name, arrange] of Object.entries(states)) {
      test(`finds no violation ${name}`, async ({ page }) => {
        await page.addInitScript((value) => localStorage.setItem('forma-ui-theme', value), theme)
        await page.goto('./docs/components/')
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
        await arrange(page)

        expect(await violations(page)).toEqual([])
      })
    }
  })
}

test.describe('the catalog at 390 px', () => {
  test.use({ viewport: { width: 390, height: 800 } })

  test('has targets of at least 44 px, the chips of the filter among them', async ({ page }) => {
    await page.goto('./docs/components/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    expect(await smallTargets(page.getByRole('main'))).toEqual([])
    for (const chip of await page.getByRole('radio').all()) {
      const box = await chip.boundingBox()
      expect(box?.height).toBeGreaterThanOrEqual(44)
      expect(box?.width).toBeGreaterThanOrEqual(44)
    }
  })
})

// The pseudo-locale build has accented, longer text in place of every message, so a row that only fits the short
// English words shows here. Both languages are checked, as for the top bar: Spanish is the longer of the two.
for (const locale of ['en', 'es'] as const) {
  for (const width of [320, 767, 768]) {
    test.describe(`the pseudo-locale catalog in ${locale} at ${width} px`, () => {
      test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width, height: 800 })
        await page.addInitScript((value) => localStorage.setItem('forma-ui-locale', value), locale)
        await page.goto('./__pseudo__/docs/components/')
        await expect(page.getByRole('heading', { level: 1 })).toHaveText(/^\[.+\]$/)
      })

      test('fits, with targets of 44 px on a narrow screen', async ({ page }) => {
        expect(await overflow(page)).toEqual({ scroll: 0, outside: [], clipped: [] })
        // From 768 px a Button is 42 px high, as in Resolve, and the target size is the library's to decide.
        if (width < 768) expect(await smallTargets(page.getByRole('main'))).toEqual([])
      })

      test('fits with nothing matching, and with a dialog open', async ({ page }) => {
        await page.getByRole('textbox').first().fill('zzz')
        await expect(page.getByRole('button', { name: /^\[/ }).first()).toBeVisible()
        expect(await overflow(page)).toEqual({ scroll: 0, outside: [], clipped: [] })

        await page.getByRole('textbox').first().fill('')
        // Its entrance scales it for 200 ms, which changes the size of what is measured.
        await page.emulateMedia({ reducedMotion: 'reduce' })
        // The dialog buttons are the only ones that open one: they have aria-haspopup.
        await page.locator('button[aria-haspopup="dialog"]').last().click()
        const dialog = page.getByRole('dialog')
        await expect(dialog).toBeVisible()
        if (width < 768) expect(await smallTargets(dialog)).toEqual([])
        expect(await overflow(page)).toEqual({ scroll: 0, outside: [], clipped: [] })
      })
    })
  }
}
