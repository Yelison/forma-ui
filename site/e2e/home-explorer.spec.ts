import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { overflow } from './support/layout'

const themes = ['light', 'dark'] as const

const code = (page: Page) => page.getByRole('figure', { name: /^JSX · / })
// The radio itself is out of sight, as in every custom selector: a pointer meets its label.
const choose = (page: Page, component: string) =>
  page
    .locator('label')
    .filter({ has: page.getByRole('radio', { name: component, exact: true }) })
    .click()
const control = (page: Page, name: string) => page.getByRole('combobox', { name, exact: true })

async function openHome(
  page: Page,
  { width = 1440, locale = 'en', theme }: { width?: number; locale?: string; theme?: string } = {},
) {
  await page.setViewportSize({ width, height: 900 })
  await page.addInitScript(
    ([storedLocale, storedTheme]) => {
      localStorage.setItem('forma-ui-locale', storedLocale!)
      if (storedTheme) localStorage.setItem('forma-ui-theme', storedTheme)
    },
    [locale, theme],
  )
  await page.goto('./')
  await expect(code(page)).toBeVisible()
}

test.describe('with the keyboard alone', () => {
  test('every control of Button works, and the code follows each change', async ({ page }) => {
    await openHome(page)
    await page.getByRole('radio', { name: 'Button' }).focus()

    // The specimen is a real button: it is the next stop after the selector.
    await page.keyboard.press('Tab')
    await expect(page.getByRole('button', { name: 'Save changes' })).toBeFocused()

    await page.keyboard.press('Tab')
    await expect(control(page, 'Variant')).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await expect(control(page, 'Variant')).toHaveValue('secondary')
    await expect(code(page)).toContainText('<Button variant="secondary">')

    // The proposed sizes cannot be reached: the arrow keys skip a disabled option.
    await page.keyboard.press('Tab')
    await expect(control(page, 'Size')).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await expect(control(page, 'Size')).toHaveValue('default')

    await page.keyboard.press('Tab')
    await expect(control(page, 'State')).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await expect(control(page, 'State')).toHaveValue('disabled')
    await expect(code(page)).toContainText('disabled')
    await expect(page.getByRole('button', { name: 'Save changes' })).toBeDisabled()

    await page.keyboard.press('ArrowDown')
    await expect(code(page)).toContainText('loadingLabel="Saving…"')
    await expect(page.getByRole('button', { name: 'Saving…' })).toHaveAttribute('aria-busy', 'true')

    await page.keyboard.press('Tab')
    await expect(page.getByRole('button', { name: 'Reset' })).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(control(page, 'Variant')).toHaveValue('primary')
    await expect(control(page, 'State')).toHaveValue('default')
    await expect(code(page)).toContainText('<Button variant="primary">')
    await expect(page.getByRole('button', { name: 'Reset' })).toBeFocused()
  })

  test('the selector moves between components with the arrow keys, and Space on Reset works too', async ({ page }) => {
    await openHome(page)
    await page.getByRole('radio', { name: 'Button' }).focus()

    await page.keyboard.press('ArrowDown')
    await expect(page.getByRole('radio', { name: 'Input' })).toBeChecked()
    await expect(code(page)).toContainText('<Input label="Email" />')

    await page.keyboard.press('ArrowDown')
    await expect(page.getByRole('radio', { name: 'Badge' })).toBeChecked()
    await expect(code(page)).toContainText('<Badge tone="neutral">')

    await page.keyboard.press('Tab')
    await expect(control(page, 'Tone')).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await expect(code(page)).toContainText('<Badge tone="blue">')

    await page.keyboard.press('Tab')
    await page.keyboard.press('Space')
    await expect(code(page)).toContainText('<Badge tone="neutral">')
  })

  test('the code of a narrow screen scrolls, and the keyboard can reach it', async ({ page }) => {
    await openHome(page, { width: 320 })
    await choose(page, 'Input')
    await control(page, 'State').selectOption('error')

    const region = page.getByRole('region', { name: /^JSX · Input/ })
    await expect(region).toBeVisible()
    // After the selector come the specimen, which is a field, and then the code.
    await page.getByRole('radio', { name: 'Input' }).focus()
    await page.keyboard.press('Tab')
    await expect(page.getByRole('textbox', { name: 'Email' })).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(region).toBeFocused()
    expect(await region.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(true)
    expect(await overflow(page)).toEqual({ scroll: 0, outside: [], clipped: [] })
  })

  test('the code region keeps the focus when the window grows and the code stops scrolling', async ({ page }) => {
    await openHome(page, { width: 320 })
    await choose(page, 'Input')
    await control(page, 'State').selectOption('error')
    const region = page.getByRole('region', { name: /^JSX · Input/ })
    await page.getByRole('radio', { name: 'Input' }).focus()
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await expect(region).toBeFocused()

    await page.setViewportSize({ width: 1440, height: 900 })
    // Wait until the code fits and the page has had the frames to react, or the check below would run before the change
    // it is about.
    await page.waitForFunction(() => {
      const code = document.querySelector('figure pre')
      return code !== null && code.scrollWidth <= code.clientWidth
    })
    await page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))))

    // It fits now, but taking away the region that has the focus would leave the focus on the page.
    await expect(region).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(control(page, 'State')).toBeFocused()
    // Once the focus is elsewhere the region goes, since there is nothing left to scroll.
    await expect(page.getByRole('region', { name: /^JSX · Input/ })).toHaveCount(0)
  })
})

test.describe('the proposed Button sizes', () => {
  test('are listed as disabled options marked as proposed, and the current height is chosen', async ({ page }) => {
    await openHome(page)

    await expect(control(page, 'Size')).toHaveValue('default')
    for (const size of ['32', '40', '48']) {
      await expect(page.getByRole('option', { name: `${size} px · Proposed` })).toBeDisabled()
    }
    await expect(code(page)).not.toContainText('size')
  })
})

test.describe('the language', () => {
  test('is the one of the page in the specimen and in the code that shows it', async ({ page }) => {
    await openHome(page, { locale: 'es' })

    await expect(page.getByRole('button', { name: 'Guardar cambios' })).toBeVisible()
    await expect(code(page)).toContainText('Guardar cambios')
    await control(page, 'Estado').selectOption('loading')
    await expect(code(page)).toContainText('loadingLabel="Guardando…"')
    await expect(page.getByRole('button', { name: 'Reset' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Restablecer' })).toBeVisible()
  })
})

test.describe('the layout', () => {
  for (const width of [1440, 1024, 768]) {
    test(`puts the specimen and its code side by side at ${width} px`, async ({ page }) => {
      await openHome(page, { width })
      const stage = await page.getByRole('group', { name: 'Preview of Button' }).boundingBox()
      const block = await code(page).boundingBox()

      expect(stage!.x + stage!.width).toBeLessThanOrEqual(block!.x + 1)
      expect(stage!.y).toBeCloseTo(block!.y, 0)
      expect(block!.width).toBeLessThan(stage!.width)
    })
  }

  for (const width of [767, 390, 320]) {
    test(`stacks the specimen over its code at ${width} px`, async ({ page }) => {
      await openHome(page, { width })
      const stage = await page.getByRole('group', { name: 'Preview of Button' }).boundingBox()
      const block = await code(page).boundingBox()

      expect(stage!.y + stage!.height).toBeLessThanOrEqual(block!.y + 1)
      expect(stage!.x).toBeCloseTo(block!.x, 0)
    })
  }

  for (const width of [1440, 390]) {
    test(`does not move the controls when a change makes the code or the specimen longer at ${width} px`, async ({
      page,
    }) => {
      await openHome(page, { width })
      const properties = page.getByRole('group', { name: 'Properties' })
      const top = async () => (await properties.boundingBox())!.y

      for (const component of ['Button', 'Input', 'Badge']) {
        await choose(page, component)
        const resting = await top()
        const select = page.getByRole('combobox').last()
        for (const option of await select
          .locator('option:not([disabled])')
          .evaluateAll((all) => all.map((one) => (one as HTMLOptionElement).value))) {
          await select.selectOption(option)
          expect(await top(), `${component} ${option}`).toBe(resting)
        }
      }
    })
  }
})

for (const theme of themes) {
  test.describe(`in the ${theme} theme`, () => {
    const states: [string, string, string, string][] = [
      ['Button', 'Variant', 'secondary', 'Button secondary'],
      ['Button', 'Variant', 'ghost', 'Button ghost'],
      ['Button', 'Variant', 'danger', 'Button danger'],
      ['Button', 'State', 'disabled', 'Button disabled'],
      ['Button', 'State', 'loading', 'Button loading'],
      ['Input', 'State', 'error', 'Input with an error'],
      ['Input', 'State', 'disabled', 'Input disabled'],
      ['Input', 'State', 'readOnly', 'Input read-only'],
      ['Badge', 'Tone', 'blue', 'Badge blue'],
      ['Badge', 'Tone', 'green', 'Badge green'],
      ['Badge', 'Tone', 'amber', 'Badge amber'],
      ['Badge', 'Tone', 'red', 'Badge red'],
    ]

    test('the explorer on load has no axe violations', async ({ page }) => {
      await openHome(page, { theme })
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme)

      const { violations } = await new AxeBuilder({ page }).analyze()
      expect(violations.map(({ id, nodes }) => ({ id, targets: nodes.map((node) => node.target) }))).toEqual([])
    })

    for (const [component, name, value, title] of states) {
      test(`${title} has no axe violations`, async ({ page }) => {
        await openHome(page, { theme })
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
        await choose(page, component)
        await control(page, name).selectOption(value)

        const { violations } = await new AxeBuilder({ page }).analyze()
        expect(violations.map(({ id, nodes }) => ({ id, targets: nodes.map((node) => node.target) }))).toEqual([])
      })
    }
  })
}
