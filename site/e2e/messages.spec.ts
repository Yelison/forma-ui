import { expect, test } from '@playwright/test'

// The messages are compiled to syntax trees when the site is built, so the browser never parses ICU. A message that
// reached the page as a string would not format, because the parser is left out of the bundle. A message without
// arguments is returned as it is and proves nothing, so the page checked has some with them: the wordmark's label
// (`{product}`) and the description of a component (`{component}`).
test.describe('the precompiled messages', () => {
  test.use({ locale: 'es-ES' })

  test('format in Spanish with no error in the console', async ({ page }) => {
    const problems: string[] = []
    page.on('pageerror', (error) => problems.push(error.message))
    page.on('console', (message) => message.type() === 'error' && problems.push(message.text()))

    await page.goto('./docs/components/button/')

    await expect(page.getByRole('link', { name: 'Forma UI, inicio' })).toBeVisible()
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      'Referencia del componente Button: variantes, estados, API y accesibilidad.',
    )
    expect(problems).toEqual([])
  })

  test('leave the ICU parser out of the JS the page loads', async ({ page }) => {
    const scripts: Promise<string>[] = []
    page.on('response', (response) => {
      if (response.request().resourceType() === 'script') scripts.push(response.text())
    })

    await page.goto('./')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    const code = await Promise.all(scripts)
    expect(code.length).toBeGreaterThan(0)
    // An error code that only the ICU parser knows.
    expect(code.some((script) => script.includes('EXPECT_ARGUMENT_CLOSING_BRACE'))).toBe(false)
  })
})
