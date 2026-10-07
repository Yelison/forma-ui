import { expect, test, type Page } from '@playwright/test'
import { liveRegionOf } from './support/switcher'

const trigger = (page: Page) => page.getByRole('button', { name: /^(Language|Idioma): / })
// A closed popover is out of the accessibility tree, so these are only found while the list is open.
const english = (page: Page) => page.getByRole('button', { name: 'English', exact: true })
const spanish = (page: Page) => page.getByRole('button', { name: 'Español', exact: true })

test.describe('the language switcher in the top bar', () => {
  test.use({ viewport: { width: 1024, height: 800 } })

  test.beforeEach(async ({ page }) => {
    await page.goto('./docs/foundations/')
  })

  test('is a labelled button that names the language in use, and opens a list of languages in their own names', async ({
    page,
  }) => {
    await expect(trigger(page)).toHaveAccessibleName('Language: English')
    await expect(spanish(page)).toBeHidden()

    await trigger(page).click()

    await expect(trigger(page)).toHaveAttribute('aria-expanded', 'true')
    await expect(english(page)).toHaveAttribute('lang', 'en')
    await expect(english(page)).toHaveAttribute('aria-current', 'true')
    await expect(spanish(page)).toHaveAttribute('lang', 'es')
  })

  test('changes the page at once: <html lang>, heading, title and description, with the URL unchanged', async ({
    page,
  }) => {
    await trigger(page).click()
    await spanish(page).click()

    await expect(page.locator('html')).toHaveAttribute('lang', 'es')
    await expect(page.getByRole('heading', { level: 1, name: 'Fundamentos' })).toBeVisible()
    await expect(page).toHaveTitle('Fundamentos · Forma UI')
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /^Roles de color/)
    await expect(trigger(page)).toHaveAccessibleName('Idioma: español')
    await expect(page).toHaveURL(/\/docs\/foundations\/$/)
  })

  test('says the change in a live region, in the new language', async ({ page }) => {
    await expect(liveRegionOf(trigger(page))).toBeEmpty()

    await trigger(page).click()
    await spanish(page).click()

    await expect(liveRegionOf(trigger(page))).toHaveText('Idioma cambiado a español')
  })

  test('remembers the choice: a reload opens in the language chosen, whatever the browser says', async ({ page }) => {
    await trigger(page).click()
    await spanish(page).click()
    expect(await page.evaluate(() => localStorage.getItem('forma-ui-locale'))).toBe('es')

    await page.reload()

    await expect(page.locator('html')).toHaveAttribute('lang', 'es')
    await expect(page.getByRole('heading', { level: 1, name: 'Fundamentos' })).toBeVisible()
  })

  test('opens from the keyboard onto the language in use, and a choice with Enter gives focus back to the button', async ({
    page,
  }) => {
    await trigger(page).focus()
    await page.keyboard.press('Enter')
    await expect(english(page)).toBeFocused()

    await page.keyboard.press('Tab')
    await expect(spanish(page)).toBeFocused()
    await page.keyboard.press('Enter')

    await expect(page.locator('html')).toHaveAttribute('lang', 'es')
    await expect(spanish(page)).toBeHidden()
    await expect(trigger(page)).toBeFocused()
  })

  test('closes on Escape and gives focus back to the button', async ({ page }) => {
    await trigger(page).click()
    await expect(english(page)).toBeVisible()

    await page.keyboard.press('Escape')

    await expect(english(page)).toBeHidden()
    await expect(trigger(page)).toBeFocused()
    await expect(trigger(page)).toHaveAttribute('aria-expanded', 'false')
  })

  test('closes on a click outside it', async ({ page }) => {
    await trigger(page).click()
    await page.mouse.click(40, 500)

    await expect(english(page)).toBeHidden()
  })

  test('does not stay open over the page when Tab leaves the list', async ({ page }) => {
    await trigger(page).focus()
    await page.keyboard.press('Enter')
    await expect(english(page)).toBeFocused()
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')

    await expect(english(page)).toBeHidden()
  })

  // Page 07 sets the text controls of this part of the bar in the caption type, like «GitHub ↗».
  test('has the type of its neighbour in the bar, GitHub, and is as muted', async ({ page }) => {
    const github = page.getByRole('link', { name: /GitHub/ })

    for (const property of ['font-size', 'font-weight', 'line-height', 'color']) {
      const expected = await github.evaluate((link, name) => getComputedStyle(link).getPropertyValue(name), property)
      await expect(trigger(page), property).toHaveCSS(property, expected)
    }
  })

  // A press that starts on an option and is let go outside the switcher sends no pointer up to it.
  test('closes on Tab even after a press that started on an option and ended outside the list', async ({ page }) => {
    await trigger(page).focus()
    await page.keyboard.press('Enter')
    await expect(english(page)).toBeFocused()

    const option = await spanish(page).boundingBox()
    await page.mouse.move((option?.x ?? 0) + 10, (option?.y ?? 0) + 10)
    await page.mouse.down()
    await page.mouse.move(40, 500)
    await page.mouse.up()
    await expect(english(page)).toBeVisible()
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')

    await expect(english(page)).toBeHidden()
  })

  test('opens below the button and inside the window, at the end edge of the bar', async ({ page }) => {
    await trigger(page).click()

    const button = await trigger(page).boundingBox()
    const list = await page.getByRole('list', { name: 'Language' }).boundingBox()
    expect(list?.y).toBeGreaterThanOrEqual((button?.y ?? 0) + (button?.height ?? 0))
    expect((list?.x ?? 0) + (list?.width ?? 0)).toBeLessThanOrEqual(1024)
    expect(list?.x).toBeGreaterThanOrEqual(0)
  })
})

test.describe('the language switcher in the drawer', () => {
  test.use({ viewport: { width: 390, height: 800 } })

  test.beforeEach(async ({ page }) => {
    await page.goto('./docs/foundations/')
    await page.getByRole('button', { name: 'Open menu' }).click()
    await expect(page.getByRole('dialog', { name: 'Menu' })).toBeVisible()
  })

  test('keeps the type of the links of the drawer, which is larger than the one of the bar', async ({ page }) => {
    const link = page.getByRole('dialog').getByRole('link', { name: 'Foundations' })

    for (const property of ['font-size', 'font-weight', 'line-height']) {
      const expected = await link.evaluate(
        (element, name) => getComputedStyle(element).getPropertyValue(name),
        property,
      )
      await expect(trigger(page), property).toHaveCSS(property, expected)
    }
  })

  test('is not in the bar below 768 px, only in the drawer', async ({ page }) => {
    await page.keyboard.press('Escape')

    await expect(trigger(page)).toBeHidden()
  })

  test('changes the language while the drawer stays open, and says so from inside it', async ({ page }) => {
    await trigger(page).click()
    await spanish(page).click()

    await expect(page.getByRole('dialog', { name: 'Menú' })).toBeVisible()
    await expect(page.locator('html')).toHaveAttribute('lang', 'es')
    await expect(liveRegionOf(trigger(page))).toHaveText('Idioma cambiado a español')
    await expect(trigger(page)).toBeFocused()
  })

  test('has targets of at least 44 px: the button and each language', async ({ page }) => {
    await trigger(page).click()

    for (const target of [trigger(page), english(page), spanish(page)]) {
      const box = await target.boundingBox()
      expect(box?.height, await target.innerText()).toBeGreaterThanOrEqual(44)
    }
  })

  test('opens its list inside the window, below the button', async ({ page }) => {
    await trigger(page).click()

    const button = await trigger(page).boundingBox()
    const list = await page.getByRole('list', { name: 'Language' }).boundingBox()
    expect(list?.y).toBeGreaterThanOrEqual((button?.y ?? 0) + (button?.height ?? 0))
    expect(list?.x).toBeGreaterThanOrEqual(0)
    expect((list?.x ?? 0) + (list?.width ?? 0)).toBeLessThanOrEqual(390)
  })

  test('opens its list above the button, and not over it, where the window is too short to open below', async ({
    page,
  }) => {
    await page.keyboard.press('Escape')
    await page.setViewportSize({ width: 390, height: 520 })
    await page.getByRole('button', { name: 'Open menu' }).click()
    await trigger(page).click()

    const button = await trigger(page).boundingBox()
    const list = await page.getByRole('list', { name: 'Language' }).boundingBox()
    expect((list?.y ?? 0) + (list?.height ?? 0)).toBeLessThanOrEqual(button?.y ?? 0)
  })

  // The list is a popover inside a modal dialog: Escape closes what is on top, one layer at a time.
  test('closes the list on the first Escape, and the drawer on the second, with focus where it came from', async ({
    page,
  }) => {
    await trigger(page).click()
    await expect(english(page)).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(english(page)).toBeHidden()
    await expect(page.getByRole('dialog', { name: 'Menu' })).toBeVisible()
    await expect(trigger(page)).toBeFocused()

    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog', { name: 'Menu' })).toBeHidden()
    await expect(page.getByRole('button', { name: 'Open menu' })).toBeFocused()
  })
})
