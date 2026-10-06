import { expect, test } from '@playwright/test'

test('opens the placeholder page served under the /forma-ui/ base', async ({ page }) => {
  await page.goto('./')

  await expect(page).toHaveTitle('Forma UI')
  await expect(page.getByRole('heading', { level: 1, name: 'Forma UI' })).toBeVisible()
  await expect(page.getByTestId('library-version')).toHaveText('0.0.0')
})
