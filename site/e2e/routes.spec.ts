import { expect, test } from '@playwright/test'
import { canonicalUrl, routes } from '../src/routes'
import en from '../src/i18n/en.json' with { type: 'json' }

// `request` reads the HTML the server sends, before any script runs: this is what GitHub Pages serves to a deep link
// and to a crawler, and it must already be the page of the route, not the shell of the home page.
test.describe('a direct link', () => {
  for (const route of routes) {
    test(`to ${route.path} is answered with 200 and the head of that route`, async ({ request }) => {
      const response = await request.get(`.${route.path}`)
      const html = await response.text()

      expect(response.status()).toBe(200)
      expect(html).toContain(`<link rel="canonical" href="${canonicalUrl(route.path)}" />`)
      const title = route.key === 'component' ? `${route.componentName} · Forma UI` : en[`route.${route.key}.title`]
      expect(html).toContain(`<title>${title}</title>`)
    })
  }
})

test.describe('a path that is not a route', () => {
  // Pages sends 404.html with this status; `vite preview` sends the status with an empty body, so the page itself
  // is checked from the 404 file in the next test.
  test('is answered with 404, not with the shell of the home page', async ({ request }) => {
    const response = await request.get('./docs/components/checkbox/')

    expect(response.status()).toBe(404)
  })

  test('shows the not-found page when the app is opened there from the 404 file', async ({ page }) => {
    await page.goto('./404.html')

    await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible()
  })

  test('shows it when a client-side navigation reaches an unknown path', async ({ page }) => {
    await page.goto('./docs/components/')
    await page.evaluate(() => {
      history.pushState({}, '', '/forma-ui/docs/components/checkbox/')
      dispatchEvent(new PopStateEvent('popstate'))
    })

    await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible()
  })
})
