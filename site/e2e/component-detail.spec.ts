import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { overflow, smallTargets } from './support/layout'

const themes = ['light', 'dark'] as const
const path = './docs/components/button/'

async function violations(page: Page) {
  const { violations } = await new AxeBuilder({ page }).analyze()
  return violations.map(({ id, nodes }) => ({ id, targets: nodes.map((node) => node.target) }))
}

async function openButtonPage(page: Page, url = path) {
  await page.goto(url)
  await expect(page.getByRole('heading', { level: 1, name: 'Button' })).toBeVisible()
}

test.describe('the reference of Button', () => {
  test.describe('copying the code', () => {
    test.use({ permissions: ['clipboard-read', 'clipboard-write'] })

    test('puts the JSX on the clipboard and announces it in a live region', async ({ page }) => {
      await openButtonPage(page)
      const variants = page.getByRole('region', { name: 'Variants' })
      await variants.getByRole('button', { name: 'Copy' }).focus()
      await page.keyboard.press('Enter')

      await expect(variants.getByRole('status')).toHaveText('Code copied')
      expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('<Button variant="danger">')
    })

    test('announces in Spanish on the Spanish page', async ({ page }) => {
      await page.addInitScript(() => localStorage.setItem('forma-ui-locale', 'es'))
      await page.goto(path)
      const variants = page.getByRole('region', { name: 'Variantes' })
      await variants.getByRole('button', { name: 'Copiar' }).click()

      await expect(variants.getByRole('status')).toHaveText('Código copiado')
    })
  })

  test('says that the copy failed when the browser has no clipboard to give', async ({ page }) => {
    await page.addInitScript(() => Object.defineProperty(navigator, 'clipboard', { value: undefined }))
    await openButtonPage(page)
    const variants = page.getByRole('region', { name: 'Variants' })
    await variants.getByRole('button', { name: 'Copy' }).click()

    await expect(variants.getByRole('status')).toHaveText('The code could not be copied')
  })

  test('changes between the preview and the code of the usage with the arrow keys', async ({ page }) => {
    await openButtonPage(page)
    const usage = page.getByRole('region', { name: 'Usage' })
    await usage.getByRole('tab', { name: 'Preview' }).focus()

    await page.keyboard.press('ArrowRight')
    await expect(usage.getByRole('tab', { name: 'Code' })).toBeFocused()
    await expect(usage.getByRole('tabpanel', { name: 'Code' })).toContainText(
      `import { Button } from '@yelison/forma-ui'`,
    )
    await page.keyboard.press('Home')
    await expect(usage.getByRole('tabpanel', { name: 'Preview' })).toBeVisible()
  })

  test.describe('the links to its sections', () => {
    test('scroll to the section and leave the focus where the link was, not on the heading', async ({ page }) => {
      await openButtonPage(page)
      const link = page.getByRole('navigation', { name: 'On this page' }).getByRole('link', { name: 'API' })
      await link.click()

      await expect(page).toHaveURL(/#api$/)
      await expect(page.getByRole('heading', { level: 2, name: 'API' })).toBeInViewport()
      await expect(page.getByRole('heading', { level: 1 })).not.toBeFocused()
    })

    test('lead a direct link with an anchor to its section, although the page loads on demand', async ({ page }) => {
      await openButtonPage(page, `${path}#limitations`)

      await expect(page.getByRole('heading', { level: 2, name: 'Limitations' })).toBeInViewport()
    })
  })

  // The code of the usage is wider than a phone: its block has to be focusable to scroll, although it was measured while
  // its tab was hidden. The viewport of the axe specs above is wider than the code.
  for (const width of [320, 390]) {
    test(`makes the code of the usage focusable and passes axe at ${width} px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 })
      await openButtonPage(page)
      const usage = page.getByRole('region', { name: 'Usage' })
      await usage.getByRole('tab', { name: 'Code' }).click()

      const code = usage.getByRole('region', { name: 'JSX · Button' })
      await code.focus()
      await expect(code).toBeFocused()
      expect(await violations(page)).toEqual([])
    })
  }

  test('does not lose the page to an anchor that is not valid percent-encoding', async ({ page }) => {
    await openButtonPage(page, `${path}#100%`)
  })

  for (const theme of themes) {
    test(`has no axe violation with the code of the usage shown, in the ${theme} theme`, async ({ page }) => {
      await page.addInitScript((value) => localStorage.setItem('forma-ui-theme', value), theme)
      await page.addInitScript(() => localStorage.setItem('forma-ui-locale', 'es'))
      await page.goto(path)
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
      await page.getByRole('tab', { name: 'Código' }).click()

      expect(await violations(page)).toEqual([])
    })
  }

  for (const theme of themes) {
    for (const width of [320, 390, 767, 768, 1024, 1199, 1200, 1440]) {
      test(`fits at ${width} px in the ${theme} theme`, async ({ page }) => {
        await page.setViewportSize({ width, height: 800 })
        await page.addInitScript((value) => localStorage.setItem('forma-ui-theme', value), theme)
        await openButtonPage(page)

        expect(await overflow(page)).toEqual({ scroll: 0, outside: [], clipped: [] })
        // The library's own buttons are 42 px high from 768 px, which is theirs to decide.
        if (width < 768) expect(await smallTargets(page.getByRole('main'))).toEqual([])
      })
    }
  }

  for (const locale of ['en', 'es'] as const) {
    for (const width of [320, 767, 768]) {
      test(`fits in the pseudo-locale in ${locale} at ${width} px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 800 })
        await page.addInitScript((value) => localStorage.setItem('forma-ui-locale', value), locale)
        await openButtonPage(page, './__pseudo__/docs/components/button/')
        // The code panel holds a long line, which scrolls inside its block and not the page.
        await page.getByRole('tab').last().click()

        expect(await overflow(page)).toEqual({ scroll: 0, outside: [], clipped: [] })
        if (width < 768) expect(await smallTargets(page.getByRole('main'))).toEqual([])
      })
    }
  }
})
