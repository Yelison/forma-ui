import { expect, test } from '@playwright/test'

// With no stored choice the page opens in the first language of the browser that the site speaks; paths do not change.
test.describe('with a Spanish browser', () => {
  test.use({ locale: 'es-ES' })

  test('renders a deep link in Spanish: <html lang>, heading and title', async ({ page }) => {
    await page.goto('./docs/components/button/')

    await expect(page.locator('html')).toHaveAttribute('lang', 'es')
    await expect(page.getByRole('heading', { level: 1, name: 'Button' })).toBeVisible()
    await expect(page).toHaveTitle('Button · Forma UI')

    await page.goto('./docs/foundations/')
    await expect(page.getByRole('heading', { level: 1, name: 'Fundamentos' })).toBeVisible()
    await expect(page).toHaveTitle('Fundamentos · Forma UI')
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /^Roles de color/)
    await expect(page).toHaveURL(/\/docs\/foundations\/$/)
  })

  test('names the chrome in Spanish', async ({ page }) => {
    await page.goto('./')

    await expect(page.getByRole('navigation', { name: 'Principal' })).toBeVisible()
    await expect(page.getByRole('contentinfo')).toHaveText('Forma UI · Construido con cuidado')
  })

  test('lets the stored choice win', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('forma-ui-locale', 'en'))
    await page.goto('./docs/foundations/')

    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    await expect(page.getByRole('heading', { level: 1, name: 'Foundations' })).toBeVisible()
  })
})

test.describe('with a French browser', () => {
  test.use({ locale: 'fr-FR' })

  test('falls back to English', async ({ page }) => {
    await page.goto('./docs/foundations/')

    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    await expect(page.getByRole('heading', { level: 1, name: 'Foundations' })).toBeVisible()
    await expect(page).toHaveTitle('Foundations · Forma UI')
  })
})
