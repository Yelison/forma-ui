import { expect, test, type Page } from '@playwright/test'

test.use({ viewport: { width: 390, height: 800 } })

const menuButton = (page: Page) => page.getByRole('button', { name: 'Open menu' })
const drawer = (page: Page) => page.getByRole('dialog', { name: 'Menu' })
const focusIsInside = (page: Page) =>
  page.locator('dialog').evaluate((dialog) => dialog.contains(document.activeElement))

test.describe('the drawer at 390 px', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('./docs/components/')
    await menuButton(page).click()
    await expect(drawer(page)).toBeVisible()
  })

  test('puts focus inside as soon as it opens', async ({ page }) => {
    expect(await focusIsInside(page)).toBe(true)
  })

  test('never lets Tab reach the page behind while tabbing in both directions', async ({ page }) => {
    // The browser may send focus to its own interface when it leaves the last control, which is <body> to the page;
    // what must never happen is that it lands on the page behind the drawer.
    const reachesPageBehind = () =>
      page
        .locator('dialog')
        .evaluate((dialog) => document.activeElement !== document.body && !dialog.contains(document.activeElement))

    // More presses than the drawer has controls, so it goes round more than once.
    for (const key of ['Tab', 'Shift+Tab']) {
      for (let press = 0; press < 12; press++) {
        await page.keyboard.press(key)
        expect(await reachesPageBehind(), `after ${press + 1} presses of ${key}`).toBe(false)
      }
    }
  })

  test('closes on Escape and gives focus back to the menu button', async ({ page }) => {
    await page.keyboard.press('Escape')

    await expect(drawer(page)).toBeHidden()
    await expect(menuButton(page)).toBeFocused()
    await expect(menuButton(page)).toHaveAttribute('aria-expanded', 'false')
  })

  test('closes on the close button and gives focus back to the menu button', async ({ page }) => {
    await page.getByRole('button', { name: 'Close menu' }).click()

    await expect(drawer(page)).toBeHidden()
    await expect(menuButton(page)).toBeFocused()
  })

  test('closes on a click outside the panel', async ({ page }) => {
    await page.mouse.click(20, 400)

    await expect(drawer(page)).toBeHidden()
  })

  test('closes when a link is followed, and focus lands on the heading of the new page', async ({ page }) => {
    await page.getByRole('link', { name: 'Foundations' }).click()

    await expect(drawer(page)).toBeHidden()
    await expect(page).toHaveURL(/\/docs\/foundations\/$/)
    await expect(page.getByRole('heading', { level: 1, name: 'Foundations' })).toBeFocused()
  })

  test('has targets of at least 44 px', async ({ page }) => {
    const targets = [page.getByRole('button', { name: 'Close menu' }), ...(await drawer(page).getByRole('link').all())]

    for (const target of targets) {
      const box = await target.boundingBox()
      expect(box?.height, await target.innerText()).toBeGreaterThanOrEqual(44)
    }
    await page.keyboard.press('Escape')
    const button = await menuButton(page).boundingBox()
    expect(button?.width).toBeGreaterThanOrEqual(44)
    expect(button?.height).toBeGreaterThanOrEqual(44)
  })

  test('does not let the page behind scroll while it is open', async ({ page }) => {
    await expect(page.locator('html')).toHaveCSS('overflow', 'hidden')

    await page.keyboard.press('Escape')
    await expect(page.locator('html')).not.toHaveCSS('overflow', 'hidden')
  })

  test('closes when the window grows to desktop width', async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 800 })

    await expect(drawer(page)).toBeHidden()
  })

  test('puts focus on the wordmark when the window grows, because the menu button is gone', async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 800 })

    await expect(page.getByRole('link', { name: 'Forma UI, home' })).toBeFocused()
  })
})

test.describe('the menu button', () => {
  test.use({ viewport: { width: 768, height: 800 } })

  test('is not there from 768 px, where the top bar has its own links', async ({ page }) => {
    await page.goto('./docs/components/')

    await expect(menuButton(page)).toBeHidden()
    await expect(
      page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Documentation' }),
    ).toBeVisible()
  })
})
