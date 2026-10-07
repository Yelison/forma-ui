import { expect, test, type Page } from '@playwright/test'
import tokens from '@yelison/forma-ui/tokens.json' with { type: 'json' }
import { overflow } from './support/layout'

const themes = ['light', 'dark'] as const
const locales = ['en', 'es'] as const

const toHex = (rgb: string) =>
  '#' +
  (rgb.match(/\d+/g) ?? [])
    .slice(0, 3)
    .map((channel) => Number(channel).toString(16).padStart(2, '0'))
    .join('')

async function openFoundations(page: Page, path = './docs/foundations/') {
  await page.goto(path)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
}

for (const theme of themes) {
  test.describe(`Foundations in the ${theme} theme`, () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript((value) => localStorage.setItem('forma-ui-theme', value), theme)
      await openFoundations(page)
      // A pass in the other theme would say nothing about this one.
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
    })

    test('paints every swatch with the value that the page prints, and it is the one in tokens.json', async ({
      page,
    }) => {
      const cards = await page
        .getByRole('region', { name: 'Color with meaning' })
        .getByRole('listitem')
        .evaluateAll((items) =>
          items.map((item) => {
            const [token, value] = [...item.querySelectorAll('code')].map((code) => code.textContent)
            const swatch = item.querySelector('[aria-hidden="true"]')!
            return { token, value, painted: getComputedStyle(swatch).backgroundColor }
          }),
        )

      expect(cards.length).toBeGreaterThan(10)
      for (const { token, value, painted } of cards) {
        const expected = (tokens[theme] as Record<string, string>)[token!]
        expect(value, token!).toBe(expected)
        expect(toHex(painted), token!).toBe(expected)
      }
    })

    test('has two contrast tables whose ratios are numbers with their level in words', async ({ page }) => {
      const tables = page.getByRole('table')
      await expect(tables).toHaveCount(2)
      await expect(tables.getByRole('row')).toHaveCount(42)
      const ratios = await tables.locator('tbody tr td:first-of-type').allTextContents()
      expect(ratios).toHaveLength(40)
      for (const ratio of ratios) expect(ratio).toMatch(/^\d+\.\d{2}:1$/)
      await expect(tables.getByText(/^(Passes( AAA?)?|Fails)$/).first()).toBeVisible()
    })
  })
}

// A token name is whole or it is not a name: at the narrowest window none of them breaks across lines.
test('keeps every token name on one line at 320 px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 })
  await openFoundations(page)

  const broken = await page.locator('code').evaluateAll((codes) =>
    codes
      .filter((code) => /^--[\w-]+$/.test(code.textContent ?? ''))
      .filter((code) => code.getClientRects().length > 1)
      .map((code) => code.textContent),
  )
  expect(broken).toEqual([])
})

// The pseudo-locale build has every message in accented, longer text: the page body has to hold at the three widths
// where the layout changes, in the two languages (the Spanish messages are the longest the site has).
for (const locale of locales) {
  for (const width of [320, 767, 768]) {
    test(`the page body fits the pseudo-locale in ${locale} at ${width} px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 })
      await page.addInitScript((value) => localStorage.setItem('forma-ui-locale', value), locale)
      await openFoundations(page, './__pseudo__/docs/foundations/')

      // Without this the fit would be checked on the English of the real site.
      for (const heading of await page.getByRole('heading', { level: 2 }).allTextContents()) {
        expect(heading).toMatch(/^\[.+\]$/)
      }
      expect(await overflow(page)).toEqual({ scroll: 0, outside: [], clipped: [] })
    })
  }
}

// A word of a cell that the box cuts across lines is a number or a level that cannot be read: «14,43:» / «1». Nothing
// overflows then, so the fit checks above cannot see it.
async function brokenWords(page: Page) {
  return page.locator('table').evaluateAll((tables) =>
    tables.flatMap((table) =>
      [...table.querySelectorAll('th, td, caption')].flatMap((cell) => {
        const walker = document.createTreeWalker(cell, NodeFilter.SHOW_TEXT)
        const broken: string[] = []
        for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
          if (node.parentElement?.closest('[aria-hidden="true"]')) continue
          for (const match of (node.textContent ?? '').matchAll(/\S+/g)) {
            const range = document.createRange()
            range.setStart(node, match.index)
            range.setEnd(node, match.index + match[0].length)
            // A word on one line has all its boxes at the same height.
            const lines = new Set([...range.getClientRects()].map((rect) => Math.round(rect.top)))
            if (lines.size > 1) broken.push(match[0])
          }
        }
        return broken
      }),
    ),
  )
}

// 320, 360 and 390 are the phones; 481 is the first width with the three columns; 767 and 1024 are the tablet and the
// laptop, where the table must still be a table of three columns.
for (const locale of locales) {
  for (const width of [320, 360, 390, 481, 767, 1024]) {
    test(`no word of the contrast tables is cut across lines in ${locale} at ${width} px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 })
      await page.addInitScript((value) => localStorage.setItem('forma-ui-locale', value), locale)
      await openFoundations(page)
      await expect(page.getByRole('table')).toHaveCount(2)

      expect(await brokenWords(page)).toEqual([])
    })
  }
}

test('keeps the columns of the contrast tables from 481 px and stacks each row below, as a table either way', async ({
  page,
}) => {
  const header = () => page.getByRole('columnheader', { name: 'Pair' }).first()
  await openFoundations(page, './docs/foundations/')

  for (const width of [481, 767, 1024]) {
    await page.setViewportSize({ width, height: 800 })
    await expect(header()).toBeVisible()
    await expect(page.getByRole('row')).toHaveCount(42)
  }

  await page.setViewportSize({ width: 320, height: 800 })
  // The stacked rows have no visible header, but the semantics hold: still two tables, 42 rows, 40 row headers.
  expect(await header().evaluate((cell) => cell.getBoundingClientRect().width)).toBeLessThanOrEqual(1)
  // Each row is stacked: the numbers are under the pair, not beside it.
  const row = page.getByRole('row').nth(1)
  const pair = await row.getByRole('rowheader').boundingBox()
  const ratio = await row.getByRole('cell').first().boundingBox()
  expect(ratio!.y).toBeGreaterThanOrEqual(pair!.y + pair!.height - 1)
  await expect(page.getByRole('table')).toHaveCount(2)
  await expect(page.getByRole('row')).toHaveCount(42)
  await expect(page.getByRole('rowheader')).toHaveCount(40)
  await expect(page.getByRole('cell')).toHaveCount(80)
})
