import { expect, test } from '@playwright/test'

test.describe('the next steps of the homepage', () => {
  test('lead to the component catalog and take the focus to its heading', async ({ page }) => {
    await page.goto('./')

    await page.getByRole('link', { name: 'View components' }).click()

    await expect(page).toHaveURL(/\/forma-ui\/docs\/components\/$/)
    await expect(page.getByRole('heading', { level: 1, name: 'Components' })).toBeFocused()
  })

  test('lead to getting started, with the same path in Spanish', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('forma-ui-locale', 'es'))
    await page.goto('./')

    await page.getByRole('link', { name: 'Guía de integración' }).click()

    await expect(page).toHaveURL(/\/forma-ui\/docs\/getting-started\/$/)
    await expect(page.getByRole('heading', { level: 1, name: 'Primeros pasos' })).toBeFocused()
  })

  test('can be reached and followed with the keyboard', async ({ page }) => {
    await page.goto('./')
    await page.getByRole('link', { name: 'View components' }).focus()
    await page.keyboard.press('Tab')
    await expect(page.getByRole('link', { name: 'Integration guide' })).toBeFocused()

    await page.keyboard.press('Enter')

    await expect(page).toHaveURL(/\/forma-ui\/docs\/getting-started\/$/)
  })

  test('are styled as buttons by the stylesheet of the library, which the whole site loads', async ({ page }) => {
    await page.goto('./')

    await expect(page.getByRole('link', { name: 'View components' })).not.toHaveCSS(
      'background-color',
      'rgba(0, 0, 0, 0)',
    )
  })
})
