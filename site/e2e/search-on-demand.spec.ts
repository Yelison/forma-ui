import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { overflow, smallTargets } from './support/layout'
import { recordShifts, totalShift } from './support/shift'

// The search dialog is fetched the first time it is used: these specs hold what that must not cost. The shortcut and the
// buttons are in the page, so the first use is not lost whatever the network does; the chunk is asked for when the person
// shows intent and not before; and a chunk that does not come leaves a notice, not a blank page.
// The widths of the checklist: the ones where the top bar and the drawer change.
const widths = [320, 390, 767, 768, 1024, 1199, 1200, 1440]
const chunkOfSearch = '**/assets/SearchDialog-*.js'
const trigger = (page: Page) => page.getByRole('button', { name: 'Search…' })
const dialog = (page: Page) => page.getByRole('dialog', { name: 'Search the documentation' })
// The region has no box of its own (the notice inside it is out of the flow): what is seen is the text in it.
const loading = (page: Page) => page.getByRole('status').getByText('Loading search…')
const failure = (page: Page) => page.getByRole('alert').filter({ hasText: 'The search could not be loaded.' })

/** Holds the chunk back until `release` is called: a slow network, without a timer to wait out. */
async function holdChunk(page: Page) {
  let release = () => {}
  const gate = new Promise<void>((resolve) => (release = resolve))
  await page.route(chunkOfSearch, async (route) => {
    await gate
    await route.continue()
  })
  return release
}

/** Lets the held chunk go and waits until the browser has it, then two frames more: what would open has opened. */
async function arrive(page: Page, release: () => void) {
  const response = page.waitForResponse((made) =>
    /\/assets\/SearchDialog-[\w-]+\.js$/.test(new URL(made.url()).pathname),
  )
  release()
  await response
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))))
}

/** The requests for the chunk of the search that the page makes from now on. */
function countChunkRequests(page: Page) {
  const requests: string[] = []
  page.on('request', (request) => {
    if (/\/assets\/SearchDialog-[\w-]+\.js$/.test(new URL(request.url()).pathname)) requests.push(request.url())
  })
  return requests
}

async function violations(page: Page) {
  const { violations } = await new AxeBuilder({ page }).analyze()
  return violations.map(({ id, nodes }) => ({ id, targets: nodes.map((node) => node.target) }))
}

async function openPage(page: Page, path = './docs/foundations/') {
  await page.goto(path)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
}

test.describe('the first use of the search, with its chunk on the way', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test('is not lost when the shortcut is pressed once: a notice says so, and the dialog opens with focus in the field', async ({
    page,
  }) => {
    await recordShifts(page)
    await openPage(page)
    const release = await holdChunk(page)

    await page.keyboard.press('Control+K')

    await expect(loading(page)).toBeVisible()
    await expect(dialog(page)).toHaveCount(0)
    release()
    await expect(dialog(page)).toBeVisible()
    await expect(page.getByRole('combobox')).toBeFocused()
    await expect(loading(page)).toHaveCount(0)
    // From the key press to the dialog is longer than the half second that a shift after an input is excused for: the
    // controls of the bar must not have moved when the loading state came and went.
    expect(await totalShift(page)).toBe(0)
  })

  test('is not lost when the button is used: the dialog opens when the chunk arrives, and closing it gives focus back to the button', async ({
    page,
  }) => {
    await openPage(page)
    const release = await holdChunk(page)

    await trigger(page).click()
    await expect(loading(page)).toBeVisible()
    release()
    await expect(dialog(page)).toBeVisible()
    await page.keyboard.press('Escape')

    await expect(dialog(page)).toHaveCount(0)
    await expect(trigger(page)).toBeFocused()
  })

  for (const theme of ['light', 'dark']) {
    test(`has no axe violations in the ${theme} theme with the loading notice on screen`, async ({ page }) => {
      await page.addInitScript((value) => localStorage.setItem('forma-ui-theme', value), theme)
      await openPage(page)
      await holdChunk(page)
      await page.keyboard.press('Control+K')
      await expect(loading(page)).toBeVisible()
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme)

      expect(await violations(page)).toEqual([])
    })
  }

  test('is cancelled by Escape: no notice, and no dialog taking focus when the chunk arrives', async ({ page }) => {
    await openPage(page)
    const documentation = page.getByRole('link', { name: 'Documentation' })
    await documentation.focus()
    const release = await holdChunk(page)
    await page.keyboard.press('Control+K')
    await expect(loading(page)).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(loading(page)).toHaveCount(0)
    await arrive(page, release)

    await expect(dialog(page)).toHaveCount(0)
    await expect(documentation).toBeFocused()
  })

  test('is cancelled by going to another page: it does not open over the page that was reached', async ({ page }) => {
    await openPage(page)
    const release = await holdChunk(page)
    await page.keyboard.press('Control+K')
    await expect(loading(page)).toBeVisible()

    await page.getByRole('link', { name: 'Forma UI, home' }).click()
    await expect(
      page.getByRole('heading', { level: 1, name: 'Design with intent. Build with confidence.' }),
    ).toBeFocused()
    await expect(loading(page)).toHaveCount(0)
    await arrive(page, release)

    await expect(dialog(page)).toHaveCount(0)
    await expect(page.getByRole('heading', { level: 1 })).toBeFocused()
  })

  test('says it in Spanish for a visitor who reads Spanish', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('forma-ui-locale', 'es'))
    await openPage(page)
    await holdChunk(page)

    await page.keyboard.press('Control+K')

    await expect(page.getByRole('status').getByText('Cargando la búsqueda…')).toBeVisible()
  })

  test('opens from the menu at 390 px, which closes first', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 })
    await openPage(page)
    const release = await holdChunk(page)

    await page.getByRole('button', { name: 'Open menu' }).click()
    await page.getByRole('dialog', { name: 'Menu' }).getByRole('button', { name: 'Search…' }).click()
    await expect(page.getByRole('dialog', { name: 'Menu' })).toHaveCount(0)
    await expect(loading(page)).toBeVisible()
    release()

    await expect(dialog(page)).toBeVisible()
    await expect(page.getByRole('combobox')).toBeFocused()
  })
})

test.describe('the fetch of the search chunk', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test('does not happen while the page loads: most visits never search', async ({ page }) => {
    const requests = countChunkRequests(page)

    await openPage(page)
    await page.waitForLoadState('networkidle')

    expect(requests).toEqual([])
  })

  test('starts when the pointer comes over the button, once, and the click does not ask again', async ({ page }) => {
    await openPage(page)
    const requests = countChunkRequests(page)

    await trigger(page).hover()
    await expect.poll(() => requests.length).toBe(1)
    await trigger(page).click()

    await expect(dialog(page)).toBeVisible()
    expect(requests).toHaveLength(1)
  })

  test('starts when the button takes focus, which is how a keyboard gets there', async ({ page }) => {
    await openPage(page)
    const requests = countChunkRequests(page)

    await trigger(page).focus()

    await expect.poll(() => requests.length).toBe(1)
  })
})

test.describe('a search chunk that does not arrive', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test('leaves the page working, and a notice with focus on Retry', async ({ page }) => {
    await openPage(page)
    await page.route(chunkOfSearch, (route) => route.abort())

    await page.keyboard.press('Control+K')

    await expect(failure(page)).toBeVisible()
    await expect(failure(page).getByRole('button', { name: 'Retry' })).toBeFocused()
    await expect(page.getByRole('banner')).toBeVisible()
    await expect(page.getByRole('heading', { level: 1, name: 'Foundations' })).toBeVisible()
  })

  test('is dismissed with Dismiss, and focus goes back to the search button', async ({ page }) => {
    await openPage(page)
    await page.route(chunkOfSearch, (route) => route.abort())
    await trigger(page).click()
    await expect(failure(page)).toBeVisible()

    await failure(page).getByRole('button', { name: 'Dismiss' }).click()

    await expect(failure(page)).toHaveCount(0)
    await expect(trigger(page)).toBeFocused()
  })

  test('is dismissed with Escape, as the dialog would be, and focus goes back to the search button', async ({
    page,
  }) => {
    await openPage(page)
    await page.route(chunkOfSearch, (route) => route.abort())
    await trigger(page).click()
    await expect(failure(page)).toBeVisible()
    await expect(failure(page).getByRole('button', { name: 'Retry' })).toBeFocused()

    await page.keyboard.press('Escape')

    await expect(failure(page)).toHaveCount(0)
    await expect(trigger(page)).toBeFocused()
  })

  test('is retried with Retry, which loads the page again: the search then opens', async ({ page }) => {
    await openPage(page)
    await page.route(chunkOfSearch, (route) => route.abort())
    await trigger(page).click()
    await expect(failure(page)).toBeVisible()

    await page.unroute(chunkOfSearch)
    await failure(page).getByRole('button', { name: 'Retry' }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'Foundations' })).toBeVisible()
    await trigger(page).click()

    await expect(dialog(page)).toBeVisible()
  })

  for (const theme of ['light', 'dark']) {
    test(`has no axe violations in the ${theme} theme with the failure on screen`, async ({ page }) => {
      await page.addInitScript((value) => localStorage.setItem('forma-ui-theme', value), theme)
      await openPage(page)
      await page.route(chunkOfSearch, (route) => route.abort())
      await page.keyboard.press('Control+K')
      await expect(failure(page)).toBeVisible()
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme)

      expect(await violations(page)).toEqual([])
    })
  }

  test('fits from 320 to 1440 px in the pseudo-locale, with targets a thumb can hit on a narrow screen', async ({
    page,
  }) => {
    await page.addInitScript(() => localStorage.setItem('forma-ui-locale', 'es'))
    await page.route(chunkOfSearch, (route) => route.abort())
    await openPage(page, './__pseudo__/docs/foundations/')
    await page.keyboard.press('Control+K')
    const notice = page.getByRole('alert')
    await expect(notice).toHaveText(/^\[.+\]/)

    for (const width of widths) {
      await page.setViewportSize({ width, height: 800 })
      expect(await overflow(page), `at ${width} px`).toEqual({ scroll: 0, outside: [], clipped: [] })
      // The buttons are the library's, which is 44 px high in the touch layout (below 768 px) and 40 px above it.
      if (width < 768) expect(await smallTargets(notice), `at ${width} px`).toEqual([])
    }
  })
})

test.describe('the loading notice in the pseudo-locale', () => {
  test('is on screen and fits from 320 to 1440 px', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('forma-ui-locale', 'es'))
    await openPage(page, './__pseudo__/docs/foundations/')
    await holdChunk(page)
    await page.keyboard.press('Control+K')
    await expect(page.getByRole('status').getByText(/^\[.+\]$/)).toBeVisible()

    for (const width of widths) {
      await page.setViewportSize({ width, height: 800 })
      expect(await overflow(page), `at ${width} px`).toEqual({ scroll: 0, outside: [], clipped: [] })
    }
  })
})
