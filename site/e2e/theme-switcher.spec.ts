import { expect, test, type Page } from '@playwright/test'
import { liveRegionOf } from './support/switcher'

const trigger = (page: Page) => page.getByRole('button', { name: /^(Theme|Tema): / })
// A closed popover is out of the accessibility tree, so these are only found while the list is open.
const option = (page: Page, name: string) => page.getByRole('button', { name, exact: true })

const background = (page: Page) => page.evaluate(() => getComputedStyle(document.body).backgroundColor)

// The two themes paint the page differently: what is painted says which one is in use, beyond the attribute.
async function paintedBackgrounds(page: Page) {
  const light = await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'light')
    return getComputedStyle(document.body).backgroundColor
  })
  const dark = await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'dark')
    return getComputedStyle(document.body).backgroundColor
  })
  await page.evaluate(() => document.documentElement.removeAttribute('data-theme'))
  return { light, dark }
}

test.describe('the theme switcher in the top bar', () => {
  test.use({ viewport: { width: 1024, height: 800 } })

  test.beforeEach(async ({ page }) => {
    await page.goto('./docs/foundations/')
  })

  test('is a labelled button that names the theme in use, and opens a list of the three themes', async ({ page }) => {
    await expect(trigger(page)).toHaveAccessibleName('Theme: system')
    await expect(option(page, 'Dark')).toBeHidden()

    await trigger(page).click()

    await expect(trigger(page)).toHaveAttribute('aria-expanded', 'true')
    await expect(option(page, 'Light')).toBeVisible()
    await expect(option(page, 'Dark')).toBeVisible()
    await expect(option(page, 'System')).toHaveAttribute('aria-current', 'true')
  })

  test('changes the page at once, with no reload, and back', async ({ page }) => {
    const { light, dark } = await paintedBackgrounds(page)
    expect(light).not.toBe(dark)

    await trigger(page).click()
    await option(page, 'Dark').click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    expect(await background(page)).toBe(dark)
    await expect(trigger(page)).toHaveAccessibleName('Theme: dark')

    await trigger(page).click()
    await option(page, 'Light').click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
    expect(await background(page)).toBe(light)
  })

  test('follows the operating system while it is on System, also while the page is open', async ({ page }) => {
    const { light, dark } = await paintedBackgrounds(page)

    await page.emulateMedia({ colorScheme: 'dark' })
    await expect.poll(() => background(page)).toBe(dark)
    await page.emulateMedia({ colorScheme: 'light' })
    await expect.poll(() => background(page)).toBe(light)
  })

  test('ignores the operating system once a theme is chosen', async ({ page }) => {
    const { light } = await paintedBackgrounds(page)
    await trigger(page).click()
    await option(page, 'Light').click()

    await page.emulateMedia({ colorScheme: 'dark' })
    // The store would follow the system on the `change` of the media query, which arrives after the call returns: wait
    // for the page to have seen it and for a frame to be painted, or a store that did follow would not have shown yet.
    await page.evaluate(
      () =>
        new Promise<void>((resolve) => {
          const dark = matchMedia('(prefers-color-scheme: dark)')
          const settle = () => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
          if (dark.matches) settle()
          else dark.addEventListener('change', settle, { once: true })
        }),
    )

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
    expect(await background(page)).toBe(light)
  })

  test('says the change in a live region, in the language of the page', async ({ page }) => {
    await expect(liveRegionOf(trigger(page))).toBeEmpty()

    await trigger(page).click()
    await option(page, 'Dark').click()

    await expect(liveRegionOf(trigger(page))).toHaveText('Theme changed to dark')
  })

  // The page changes language after the theme was announced: the theme did not change again, so it says nothing more.
  test('does not say the theme change again, translated, when the language changes after it', async ({ page }) => {
    const themeRegion = liveRegionOf(trigger(page))
    await trigger(page).click()
    await option(page, 'Dark').click()
    await expect(themeRegion).toHaveText('Theme changed to dark')

    await page.getByRole('button', { name: /^Language: / }).click()
    await option(page, 'Español').click()

    await expect(liveRegionOf(page.getByRole('button', { name: /^Idioma: / }))).toHaveText('Idioma cambiado a español')
    await expect(themeRegion).toBeEmpty()
  })

  test('is named in Spanish on a Spanish page', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('forma-ui-locale', 'es'))
    await page.reload()

    await expect(trigger(page)).toHaveAccessibleName('Tema: sistema')
    await trigger(page).click()
    await option(page, 'Oscuro').click()
    await expect(liveRegionOf(trigger(page))).toHaveText('Tema cambiado a oscuro')
  })

  test('opens from the keyboard onto the theme in use, and a choice with Enter gives focus back to the button', async ({
    page,
  }) => {
    await trigger(page).focus()
    await page.keyboard.press('Enter')
    await expect(option(page, 'System')).toBeFocused()

    await page.keyboard.press('Shift+Tab')
    await expect(option(page, 'Dark')).toBeFocused()
    await page.keyboard.press('Enter')

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    await expect(option(page, 'Dark')).toBeHidden()
    await expect(trigger(page)).toBeFocused()
  })

  test('closes on Escape and gives focus back to the button', async ({ page }) => {
    await trigger(page).click()
    await expect(option(page, 'Dark')).toBeVisible()

    await page.keyboard.press('Escape')

    await expect(option(page, 'Dark')).toBeHidden()
    await expect(trigger(page)).toBeFocused()
  })

  // Page 07 sets the text controls of this part of the bar in the caption type, like «GitHub ↗».
  test('has the type of its neighbour in the bar, GitHub, and is as muted', async ({ page }) => {
    const github = page.getByRole('link', { name: /GitHub/ })

    for (const property of ['font-size', 'font-weight', 'line-height', 'color']) {
      const expected = await github.evaluate((link, name) => getComputedStyle(link).getPropertyValue(name), property)
      await expect(trigger(page), property).toHaveCSS(property, expected)
    }
  })

  // Page 07 puts the theme to the left of «GitHub ↗»; the language comes after it.
  test('starts the end of the bar: the theme, then GitHub, then the language', async ({ page }) => {
    const github = await page.getByRole('link', { name: /GitHub/ }).boundingBox()
    const theme = await trigger(page).boundingBox()
    const language = await page.getByRole('button', { name: /^Language: / }).boundingBox()

    expect((theme?.x ?? 0) + (theme?.width ?? 0)).toBeLessThanOrEqual(github?.x ?? 0)
    expect((github?.x ?? 0) + (github?.width ?? 0)).toBeLessThanOrEqual(language?.x ?? 0)
    expect((language?.x ?? 0) + (language?.width ?? 0)).toBeGreaterThan(1024 - 200)
  })

  test('opens below the button and inside the window', async ({ page }) => {
    await trigger(page).click()

    const button = await trigger(page).boundingBox()
    const list = await page.getByRole('list', { name: 'Theme' }).boundingBox()
    expect(list?.y).toBeGreaterThanOrEqual((button?.y ?? 0) + (button?.height ?? 0))
    expect((list?.x ?? 0) + (list?.width ?? 0)).toBeLessThanOrEqual(1024)
  })
})

// The first-paint script runs before the stylesheet and before any app code: with the app's scripts blocked the page
// is what a visitor sees before React renders, and it must already have the theme they chose.
test.describe('a reload', () => {
  test.use({ viewport: { width: 1024, height: 800 } })

  for (const [choice, attribute] of [
    ['Light', 'light'],
    ['Dark', 'dark'],
  ] as const) {
    test(`keeps ${choice}, and paints it before the app runs`, async ({ page }) => {
      await page.goto('./docs/foundations/')
      const painted = await paintedBackgrounds(page)
      await trigger(page).click()
      await option(page, choice).click()
      expect(await page.evaluate(() => localStorage.getItem('forma-ui-theme'))).toBe(attribute)

      await page.route('**/assets/*.js', (route) => route.abort())
      await page.reload()

      await expect(page.locator('html')).toHaveAttribute('data-theme', attribute)
      expect(await background(page)).toBe(painted[attribute])
    })
  }

  test('keeps System: no stored theme, and the operating system decides before the app runs', async ({ page }) => {
    await page.goto('./docs/foundations/')
    const { dark } = await paintedBackgrounds(page)
    await trigger(page).click()
    await option(page, 'Dark').click()
    await trigger(page).click()
    await option(page, 'System').click()
    expect(await page.evaluate(() => localStorage.getItem('forma-ui-theme'))).toBeNull()

    await page.emulateMedia({ colorScheme: 'dark' })
    await page.route('**/assets/*.js', (route) => route.abort())
    await page.reload()

    await expect(page.locator('html')).not.toHaveAttribute('data-theme')
    expect(await background(page)).toBe(dark)
  })
})

test.describe('the theme switcher in the drawer', () => {
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

  test('changes the theme while the drawer stays open, and says so from inside it', async ({ page }) => {
    await trigger(page).click()
    await option(page, 'Dark').click()

    await expect(page.getByRole('dialog', { name: 'Menu' })).toBeVisible()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    await expect(liveRegionOf(trigger(page))).toHaveText('Theme changed to dark')
    await expect(trigger(page)).toBeFocused()
  })

  test('has targets of at least 44 px: the button and each theme', async ({ page }) => {
    await trigger(page).click()

    for (const name of ['Light', 'Dark', 'System']) {
      const box = await option(page, name).boundingBox()
      expect(box?.height, name).toBeGreaterThanOrEqual(44)
    }
    expect((await trigger(page).boundingBox())?.height).toBeGreaterThanOrEqual(44)
  })

  test('opens its list inside the window, below the button', async ({ page }) => {
    await trigger(page).click()

    const button = await trigger(page).boundingBox()
    const list = await page.getByRole('list', { name: 'Theme' }).boundingBox()
    expect(list?.y).toBeGreaterThanOrEqual((button?.y ?? 0) + (button?.height ?? 0))
    expect((list?.x ?? 0) + (list?.width ?? 0)).toBeLessThanOrEqual(390)
  })

  test('closes the list on the first Escape, and the drawer on the second', async ({ page }) => {
    await trigger(page).click()

    await page.keyboard.press('Escape')
    await expect(option(page, 'Dark')).toBeHidden()
    await expect(page.getByRole('dialog', { name: 'Menu' })).toBeVisible()
    await expect(trigger(page)).toBeFocused()

    await page.keyboard.press('Escape')
    await expect(page.getByRole('button', { name: 'Open menu' })).toBeFocused()
  })
})
