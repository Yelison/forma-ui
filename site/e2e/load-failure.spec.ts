import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { overflow } from './support/layout'
import { recordShifts, totalShift } from './support/shift'

// A page that loads on demand can fail to arrive: the network drops, or a deployment replaced the files the open tab
// knows. Without a boundary React unmounts the whole app and the page is blank. These specs abort the request of the
// chunk (or of the messages) of a page and hold what a visitor has to get instead: a notice inside the content, with the
// bar, the menu and the footer in place, focus on it, and a way back.
const foundations = './docs/foundations/'
const widths = [320, 390, 767, 768, 1024, 1199, 1200, 1440]
const themes = ['light', 'dark'] as const

const chunkOfFoundations = '**/assets/Foundations-*.js'
const chunkOfGettingStarted = '**/assets/GettingStarted-*.js'
const messagesOfFoundations = '**/assets/foundations.en-*.js'
const abort = (page: Page, pattern: string) => page.route(pattern, (route) => route.abort())

const notice = (page: Page) => page.getByRole('heading', { level: 1, name: 'This page could not be loaded' })

test.describe('a page whose chunk does not arrive', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test('shows the notice inside the content, with the bar and the footer in place, focus on it and no layout shift', async ({
    page,
  }) => {
    await recordShifts(page)
    await abort(page, chunkOfFoundations)

    await page.goto(foundations)

    await expect(notice(page)).toBeFocused()
    await expect(page.getByRole('main').getByRole('button', { name: 'Retry' })).toBeVisible()
    await expect(page.getByRole('banner')).toBeVisible()
    await expect(page.getByRole('contentinfo')).toBeVisible()
    await expect(page).toHaveTitle('This page could not be loaded · Forma UI')
    // The notice takes the height of a screen, as the placeholder it replaces did: the footer does not move.
    expect(await page.locator('main').evaluate((main) => main.getBoundingClientRect().height)).toBeGreaterThanOrEqual(
      800,
    )
    expect(await totalShift(page)).toBe(0)
  })

  test('tries again with Retry: it loads the page once the chunk can be fetched', async ({ page }) => {
    await abort(page, chunkOfFoundations)
    await page.goto(foundations)
    await expect(notice(page)).toBeVisible()

    // The chunk is reachable again, which is what the visitor does by coming back online.
    await page.unroute(chunkOfFoundations)
    await page.getByRole('button', { name: 'Retry' }).click()

    await expect(page.getByRole('heading', { level: 1, name: 'Foundations' })).toBeVisible()
    await expect(notice(page)).toHaveCount(0)
  })

  test('keeps the menu working', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 })
    await abort(page, chunkOfFoundations)
    await page.goto(foundations)
    await expect(notice(page)).toBeVisible()

    await page.getByRole('button', { name: 'Open menu' }).click()

    await expect(page.getByRole('dialog', { name: 'Menu' })).toBeVisible()
  })

  for (const theme of themes) {
    test(`has no axe violations in the ${theme} theme`, async ({ page }) => {
      await page.addInitScript((value) => localStorage.setItem('forma-ui-theme', value), theme)
      await abort(page, chunkOfFoundations)
      await page.goto(foundations)
      await expect(notice(page)).toBeVisible()
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme)

      const { violations } = await new AxeBuilder({ page }).analyze()
      expect(violations.map(({ id, nodes }) => ({ id, targets: nodes.map((node) => node.target) }))).toEqual([])
    })

    test(`fits from 320 to 1440 px in the ${theme} theme`, async ({ page }) => {
      await page.addInitScript((value) => localStorage.setItem('forma-ui-theme', value), theme)
      await abort(page, chunkOfFoundations)
      await page.goto(foundations)
      await expect(notice(page)).toBeVisible()

      for (const width of widths) {
        await page.setViewportSize({ width, height: 800 })
        expect(await overflow(page), `at ${width} px`).toEqual({ scroll: 0, outside: [], clipped: [] })
      }
    })
  }

  test('is in Spanish for a visitor who reads Spanish', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('forma-ui-locale', 'es'))
    await abort(page, chunkOfFoundations)

    await page.goto(foundations)

    await expect(page.getByRole('heading', { level: 1, name: 'No se pudo cargar esta página' })).toBeFocused()
    await expect(page.getByRole('button', { name: 'Reintentar' })).toBeVisible()
    await expect(page).toHaveTitle('No se pudo cargar esta página · Forma UI')
    await expect(page.locator('html')).toHaveAttribute('lang', 'es')
  })
})

test.describe('a page whose messages do not arrive', () => {
  test('shows the same notice', async ({ page }) => {
    await abort(page, messagesOfFoundations)

    await page.goto(foundations)

    await expect(notice(page)).toBeFocused()
    await expect(page.getByRole('button', { name: 'Retry' })).toBeVisible()
  })
})

test.describe('a client-side navigation to a page that does not arrive', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test('shows the notice with focus on it, and going to another page clears it', async ({ page }) => {
    await page.goto('./')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await abort(page, chunkOfGettingStarted)

    await page.getByRole('link', { name: 'Documentation' }).click()

    await expect(page).toHaveURL(/\/docs\/getting-started\/$/)
    await expect(notice(page)).toBeFocused()
    await expect(page.getByRole('contentinfo')).toBeVisible()

    await page.getByRole('link', { name: 'Forma UI, home' }).click()

    await expect(page).toHaveURL(/\/forma-ui\/$/)
    await expect(
      page.getByRole('heading', { level: 1, name: 'Design with intent. Build with confidence.' }),
    ).toBeVisible()
    await expect(notice(page)).toHaveCount(0)
  })
})

test.describe('the pseudo-locale', () => {
  for (const locale of ['en', 'es']) {
    test(`fits the notice at 320 px in ${locale}`, async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 800 })
      await page.addInitScript((value) => localStorage.setItem('forma-ui-locale', value), locale)
      await abort(page, chunkOfFoundations)

      await page.goto('./__pseudo__/docs/foundations/')

      // Pseudo-localized messages are in brackets: the notice is the build's own, not the English of the real site.
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(/^\[.+\]$/)
      await expect(page.getByRole('main').getByRole('button')).toHaveText(/^\[.+\]$/)
      expect(await overflow(page)).toEqual({ scroll: 0, outside: [], clipped: [] })
    })
  }
})
