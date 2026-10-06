import { expect, test } from '@playwright/test'

test('opens the homepage served under the /forma-ui/ base', async ({ page }) => {
  await page.goto('./')

  await expect(page).toHaveTitle('Forma UI · A shared design system')
  await expect(
    page.getByRole('heading', { level: 1, name: 'Design with intent. Build with confidence.' }),
  ).toBeVisible()
  await expect(page.getByRole('contentinfo')).toHaveText('Forma UI · Built with care')
})
