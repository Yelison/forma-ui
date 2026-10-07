import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Locator, type Page } from '@playwright/test'
import { overflow, smallTargets } from './support/layout'

// The references of the components other than Button, which component-detail.spec.ts covers on its own: each one is
// checked in the two themes, at the widths of the design and in the pseudo-locale, with what it shows only while it is
// used (an open tooltip, an open dialog) as well as at rest. The static pages are also in accessibility.spec.ts.
const themes = ['light', 'dark'] as const
const widths = [320, 390, 767, 768, 1024, 1199, 1200, 1440]

interface Reference {
  slug: string
  name: string
  /** Puts the page in the state that only use brings about, and waits for it: an open tooltip, an open dialog. */
  open?: (page: Page) => Promise<void>
}

const references: Reference[] = [
  {
    slug: 'icon-button',
    name: 'IconButton',
    open: async (page) => {
      const pairing = page.getByRole('region', { name: 'With a Tooltip' })
      await pairing.getByRole('button', { name: 'Add' }).focus()
      await expect(page.getByRole('tooltip')).toBeVisible()
    },
  },
  { slug: 'badge', name: 'Badge' },
  {
    slug: 'input',
    name: 'Input',
    open: async (page) => {
      const input = page.getByRole('region', { name: 'States' }).getByRole('textbox', { name: 'Full name' }).first()
      await input.focus()
      await expect(input).toBeFocused()
    },
  },
]

/**
 * What axe reports. An open tooltip is the one thing that the `region` rule cannot be asked about: the library places a
 * floating element at the end of the body, outside the landmarks, and the rule asks every piece of content to be inside
 * one. It is a rule of best practice that a floating label cannot satisfy, and the rest (names, roles, contrast) is
 * still checked.
 */
async function violations(page: Page) {
  const tooltipOpen = (await page.getByRole('tooltip').count()) > 0
  const builder = new AxeBuilder({ page })
  const { violations } = await (tooltipOpen ? builder.disableRules('region') : builder).analyze()
  return violations.map(({ id, nodes }) => ({ id, targets: nodes.map((node) => node.target) }))
}

async function openReference(page: Page, { slug, name }: Reference, prefix = '.') {
  await page.goto(`${prefix}/docs/components/${slug}/`)
  await expect(page.getByRole('heading', { level: 1, name })).toBeVisible()
}

for (const reference of references) {
  test.describe(`the reference of ${reference.name}`, () => {
    for (const theme of themes) {
      test(`has no axe violation at rest and in use, in the ${theme} theme`, async ({ page }) => {
        await page.addInitScript((value) => localStorage.setItem('forma-ui-theme', value), theme)
        await openReference(page, reference)
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
        expect(await violations(page)).toEqual([])

        if (reference.open === undefined) return
        await reference.open(page)
        expect(await violations(page)).toEqual([])
      })

      test(`fits at every width in the ${theme} theme`, async ({ page }) => {
        await page.addInitScript((value) => localStorage.setItem('forma-ui-theme', value), theme)
        for (const width of widths) {
          await page.setViewportSize({ width, height: 800 })
          await openReference(page, reference)

          expect(await overflow(page), `${width} px`).toEqual({ scroll: 0, outside: [], clipped: [] })
          // The library's own controls are 42 px high from 768 px, which is theirs to decide.
          if (width < 768) expect(await smallTargets(page.getByRole('main')), `${width} px`).toEqual([])
        }
      })
    }

    if (reference.name === 'Badge') {
      for (const theme of themes) {
        test(`shows the neutral badge on a card that is not the color of its panel, in the ${theme} theme`, async ({
          page,
        }) => {
          await page.addInitScript((value) => localStorage.setItem('forma-ui-theme', value), theme)
          await openReference(page, reference)

          const badge = page
            .getByRole('region', { name: 'Tones' })
            .getByRole('list')
            .getByText('Draft', { exact: true })
          const background = (locator: Locator) => locator.evaluate((node) => getComputedStyle(node).backgroundColor)
          const card = badge.locator('..')
          const panel = card.locator('xpath=ancestor::ul[1]')

          expect(await background(card)).not.toBe(await background(panel))
        })
      }
    }

    for (const locale of ['en', 'es'] as const) {
      test(`fits in the pseudo-locale in ${locale} at 320, 767 and 768 px`, async ({ page }) => {
        await page.addInitScript((value) => localStorage.setItem('forma-ui-locale', value), locale)
        for (const width of [320, 767, 768]) {
          await page.setViewportSize({ width, height: 800 })
          await openReference(page, reference, './__pseudo__')
          // The code panel of the usage holds a long line, which scrolls inside its block and not the page.
          await page.getByRole('tab').last().click()

          expect(await overflow(page), `${width} px`).toEqual({ scroll: 0, outside: [], clipped: [] })
          if (width < 768) expect(await smallTargets(page.getByRole('main')), `${width} px`).toEqual([])
        }
      })
    }
  })
}
