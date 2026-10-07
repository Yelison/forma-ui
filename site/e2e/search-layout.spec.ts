import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { overflow } from './support/layout'

const themes = ['light', 'dark'] as const

async function violations(page: Page) {
  const { violations } = await new AxeBuilder({ page }).analyze()
  return violations.map(({ id, nodes }) => ({ id, targets: nodes.map((node) => node.target) }))
}

// The dialog enters with a 200 ms movement and fade, and a contrast check made halfway through reads a mixed color.
async function openSearch(page: Page) {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.keyboard.press('Control+K')
  await expect(page.getByRole('dialog')).toBeVisible()
}

const states = {
  'with everything listed': async () => {},
  'with the results narrowed': async (page: Page) => {
    await page.getByRole('combobox').fill('dialog')
    await expect(page.getByRole('option')).toHaveCount(1)
  },
  'with nothing found': async (page: Page) => {
    await page.getByRole('combobox').fill('zzz')
    await expect(page.getByText('No results for “zzz”. Try another word.')).toBeVisible()
  },
} as const

for (const theme of themes) {
  test.describe(`axe on the search in the ${theme} theme`, () => {
    for (const [name, arrange] of Object.entries(states)) {
      test(`finds no violation ${name}`, async ({ page }) => {
        await page.addInitScript((value) => localStorage.setItem('forma-ui-theme', value), theme)
        await page.goto('./docs/foundations/')
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
        await openSearch(page)
        await arrange(page)

        expect(await violations(page)).toEqual([])
      })
    }
  })
}

test.describe('the search at 390 px', () => {
  test.use({ viewport: { width: 390, height: 800 } })

  test('has results that are targets of at least 44 px, and stays inside the window', async ({ page }) => {
    await page.goto('./docs/foundations/')
    await page.getByRole('button', { name: 'Open menu' }).click()
    await page.getByRole('dialog', { name: 'Menu' }).getByRole('button', { name: 'Search…' }).click()
    await expect(page.getByRole('dialog', { name: 'Search the documentation' })).toBeVisible()

    for (const option of await page.getByRole('option').all()) {
      expect((await option.boundingBox())?.height).toBeGreaterThanOrEqual(44)
    }
    expect(await overflow(page)).toEqual({ scroll: 0, outside: [], clipped: [] })
  })
})

test('does not change the size of the dialog while the person types', async ({ page }) => {
  await page.goto('./docs/foundations/')
  await openSearch(page)
  const dialog = page.getByRole('dialog')
  const everything = await dialog.boundingBox()

  await page.getByRole('combobox').fill('dialog')
  await expect(page.getByRole('option')).toHaveCount(1)
  expect(await dialog.boundingBox()).toEqual(everything)

  await page.getByRole('combobox').fill('zzz')
  await expect(page.getByRole('option')).toHaveCount(0)
  expect(await dialog.boundingBox()).toEqual(everything)
})

// The pseudo-locale build has accented, longer text in place of every message: the results, with the descriptions of
// the pages, and the empty message with the words typed, are the longest text the search shows.
for (const locale of ['en', 'es'] as const) {
  for (const width of [320, 767, 768]) {
    test.describe(`the pseudo-locale search in ${locale} at ${width} px`, () => {
      test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width, height: 800 })
        await page.addInitScript((value) => localStorage.setItem('forma-ui-locale', value), locale)
        await page.goto('./__pseudo__/docs/foundations/')
        await expect(page.getByRole('heading', { level: 1 })).toHaveText(/^\[.+\]$/)
        await openSearch(page)
      })

      test('fits with the results listed', async ({ page }) => {
        await expect(page.getByRole('option').first()).toHaveText(/\[/)
        expect(await overflow(page)).toEqual({ scroll: 0, outside: [], clipped: [] })
      })

      test('fits with nothing found, and a long word typed', async ({ page }) => {
        await page.getByRole('combobox').fill('zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz')
        await expect(page.getByRole('option')).toHaveCount(0)

        expect(await overflow(page)).toEqual({ scroll: 0, outside: [], clipped: [] })
      })

      // Below 768 px a finger presses the results.
      if (width < 768) {
        test('has results that are targets of 44 px', async ({ page }) => {
          const results = await page.getByRole('option').all()
          expect(results.length).toBeGreaterThan(0)
          for (const result of results) expect((await result.boundingBox())?.height).toBeGreaterThanOrEqual(44)
        })
      }
    })
  }
}
