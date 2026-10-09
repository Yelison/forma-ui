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
    slug: 'tooltip',
    name: 'Tooltip',
    open: async (page) => {
      await page.getByRole('region', { name: 'States' }).getByRole('button', { name: 'More info' }).first().focus()
      await expect(page.getByRole('tooltip')).toBeVisible()
    },
  },
  {
    slug: 'dialog',
    name: 'Dialog',
    open: async (page) => {
      await page.getByRole('region', { name: 'States' }).getByRole('button', { name: 'Confirm changes' }).click()
      await settled(page.getByRole('dialog', { name: 'Confirm changes' }))
    },
  },
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

/** Waits for the dialog to be visible and for its entrance to end: axe and a measure read it half way through. */
async function settled(dialog: Locator) {
  await expect(dialog).toBeVisible()
  await dialog.evaluate((node) => Promise.all(node.getAnimations().map((animation) => animation.finished)))
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

    if (reference.name === 'Dialog') {
      test('keeps the focus inside while it is open and gives it back to its button on Escape', async ({ page }) => {
        await openReference(page, reference)
        const opener = page.getByRole('region', { name: 'States' }).getByRole('button', { name: 'Confirm changes' })
        await opener.click()
        const dialog = page.getByRole('dialog', { name: 'Confirm changes' })
        await settled(dialog)
        await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeFocused()

        // More presses than the dialog has controls: the focus goes round inside it and never reaches the page behind. The
        // browser takes it out of the page for one press, to its own controls, where it is on `body`: that stop is not the
        // page's, and the next press has to bring it back in.
        let onBodyBefore = false
        for (let press = 0; press < 5; press++) {
          await page.keyboard.press('Tab')
          const where = await dialog.evaluate((node) =>
            node.contains(document.activeElement)
              ? 'dialog'
              : document.activeElement === document.body
                ? 'body'
                : 'page',
          )
          expect(where, `press ${press + 1}`).not.toBe('page')
          if (where === 'body') expect(onBodyBefore, `press ${press + 1} after a stop on body`).toBe(false)
          onBodyBefore = where === 'body'
        }
        await page.keyboard.press('Escape')

        await expect(dialog).toBeHidden()
        await expect(opener).toBeFocused()
      })

      for (const width of [320, 1440]) {
        test(`opens the wide dialog within the window and wider than the default one at ${width} px`, async ({
          page,
        }) => {
          await page.setViewportSize({ width, height: 800 })
          await openReference(page, reference)
          const sizes = page.getByRole('region', { name: 'Sizes' })
          const widthOfDialogOpenedBy = async (index: number) => {
            await sizes.getByRole('button').nth(index).click()
            const dialog = page.getByRole('dialog')
            await settled(dialog)
            const box = await dialog.boundingBox()
            expect(await overflow(page), `${width} px`).toEqual({ scroll: 0, outside: [], clipped: [] })
            await page.keyboard.press('Escape')
            await expect(dialog).toBeHidden()
            return box!.width
          }

          const regular = await widthOfDialogOpenedBy(0)
          const wide = await widthOfDialogOpenedBy(1)

          expect(regular).toBeLessThanOrEqual(width)
          expect(wide).toBeLessThanOrEqual(width)
          if (width === 1440) expect([regular, wide]).toEqual([440, 640])
          // On a phone both are as wide as the window leaves room for: the margin is a gutter on each side.
          else expect(wide).toBe(regular)
        })
      }
    }

    if (reference.name === 'Dialog') {
      test('fits in the pseudo-locale with the wide dialog open at 320 px', async ({ page }) => {
        await page.setViewportSize({ width: 320, height: 800 })
        await openReference(page, reference, './__pseudo__')
        // The section is found by its id, which is English in every language: its name is not, in the pseudo-locale.
        await page.locator('#sizes').getByRole('button').nth(1).click()
        const dialog = page.getByRole('dialog')
        await settled(dialog)

        expect(await overflow(page)).toEqual({ scroll: 0, outside: [], clipped: [] })
        expect(await smallTargets(dialog)).toEqual([])
      })
    }

    if (reference.name === 'Tooltip') {
      test('closes the tooltip with the first Escape and the dialog with the second, and gives back the focus', async ({
        page,
      }) => {
        await openReference(page, reference)
        const opener = page.getByRole('button', { name: 'Open the dialog' })
        await opener.click()
        const dialog = page.getByRole('dialog', { name: 'Save the name' })
        await expect(dialog.getByRole('textbox', { name: 'Full name' })).toBeFocused()

        await page.keyboard.press('Tab') // Cancel
        await page.keyboard.press('Tab') // Save: its tooltip opens with the focus
        await expect(page.getByRole('tooltip')).toBeVisible()
        await page.keyboard.press('Escape')
        await expect(page.getByRole('tooltip')).toBeHidden()
        await expect(dialog).toBeVisible()
        await expect(dialog.getByRole('button', { name: 'Save' })).toBeFocused()

        await page.keyboard.press('Escape')
        await expect(dialog).toBeHidden()
        await expect(opener).toBeFocused()
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
          const card = badge.locator('..')
          const ownBackground = (locator: Locator) => locator.evaluate((node) => getComputedStyle(node).backgroundColor)
          // What shows behind an element is the background of the nearest ancestor that paints one.
          const backgroundBehind = (locator: Locator) =>
            locator.evaluate((node) => {
              for (let behind: Element | null = node; behind !== null; behind = behind.parentElement) {
                const { backgroundColor } = getComputedStyle(behind)
                if (backgroundColor !== 'rgba(0, 0, 0, 0)') return backgroundColor
              }
              return ''
            })

          expect(await ownBackground(badge)).not.toBe(await backgroundBehind(card))
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

// The reference of Input shows an error specimen twice; opening the page must not announce either of them.
for (const locale of ['en', 'es'] as const) {
  test(`the reference of Input announces nothing on load, in ${locale}`, async ({ page }) => {
    await page.addInitScript((value) => localStorage.setItem('forma-ui-locale', value), locale)
    await openReference(page, { slug: 'input', name: 'Input' })

    await expect(page.locator('input[aria-invalid="true"]')).toHaveCount(2)
    await expect(page.getByRole('alert')).toHaveCount(0)
  })
}
