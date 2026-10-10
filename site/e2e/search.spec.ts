import { expect, test, type Page } from '@playwright/test'

// What the search says in each language: it is checked in both, with the page reached by a result in each.
const text = {
  en: {
    trigger: 'Search…',
    title: 'Search the documentation',
    combobox: 'Search components and pages',
    count: (count: number) => (count === 0 ? 'No results' : `${count} result${count === 1 ? '' : 's'}`),
    empty: (query: string) => `No results for “${query}”. Try another word.`,
    // The title of a page other than the one the test starts on, what it is called and where it is.
    query: 'theming',
    pageHeading: 'Theming',
    pagePath: /\/docs\/guides\/theming\/$/,
    // A word that every page of a component says in its description, and that is also the title of a page.
    namedQuery: 'accessibility',
    namedHeading: 'Accessibility',
    accentQuery: 'color roles',
    accentPage: 'Foundations',
    openMenu: 'Open menu',
    menu: 'Menu',
  },
  es: {
    trigger: 'Buscar…',
    title: 'Buscar en la documentación',
    combobox: 'Buscar componentes y páginas',
    count: (count: number) => (count === 0 ? 'Sin resultados' : `${count} resultado${count === 1 ? '' : 's'}`),
    empty: (query: string) => `Sin resultados para «${query}». Prueba con otra palabra.`,
    query: 'temas',
    pageHeading: 'Temas',
    pagePath: /\/docs\/guides\/theming\/$/,
    // «tipográfica» is in the description of the page, and is typed without its accent.
    namedQuery: 'accesibilidad',
    namedHeading: 'Accesibilidad',
    accentQuery: 'tipografica',
    accentPage: 'Fundamentos',
    openMenu: 'Abrir menú',
    menu: 'Menú',
  },
} as const

const results = (page: Page) => page.getByRole('option')
// The live region of the dialog: the switchers of the bar have their own, so it is looked for inside the dialog.
const count = (page: Page) => page.getByRole('dialog').getByRole('status')

for (const locale of ['en', 'es'] as const) {
  const t = text[locale]

  test.describe(`the search in ${locale}`, () => {
    test.use({ viewport: { width: 1280, height: 800 } })

    test.beforeEach(async ({ page }) => {
      await page.addInitScript((value) => localStorage.setItem('forma-ui-locale', value), locale)
      await page.goto('./docs/foundations/')
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    })

    test('opens from the button of the bar, with focus in the field and everything listed', async ({ page }) => {
      await page.getByRole('button', { name: t.trigger }).click()

      await expect(page.getByRole('dialog', { name: t.title })).toBeVisible()
      await expect(page.getByRole('combobox', { name: t.combobox })).toBeFocused()
      await expect(results(page)).toHaveCount(14)
      await expect(count(page)).toHaveText(t.count(14))
    })

    test('opens from Ctrl+K, wherever focus is', async ({ page }) => {
      await page.keyboard.press('Control+K')

      await expect(page.getByRole('dialog', { name: t.title })).toBeVisible()
      await expect(page.getByRole('combobox')).toBeFocused()
    })

    test('narrows the results as the person types, ignoring accents, and announces the count', async ({ page }) => {
      await page.keyboard.press('Control+K')

      await page.getByRole('combobox').fill(t.accentQuery)

      await expect(results(page)).toHaveCount(1)
      await expect(results(page).first()).toContainText(t.accentPage)
      await expect(count(page)).toHaveText(t.count(1))
    })

    test('says that nothing was found', async ({ page }) => {
      await page.keyboard.press('Control+K')

      await page.getByRole('combobox').fill('zzz')

      await expect(page.getByText(t.empty('zzz'))).toBeVisible()
      await expect(count(page)).toHaveText(t.count(0))
      await expect(results(page)).toHaveCount(0)
    })

    test('moves through the results with the arrows, and goes to the one reached on Enter, focusing its heading', async ({
      page,
    }) => {
      await page.keyboard.press('Control+K')
      await expect(results(page).first()).toHaveAttribute('aria-selected', 'true')
      await page.keyboard.press('ArrowDown')
      await page.keyboard.press('ArrowDown')
      await expect(results(page).nth(2)).toHaveAttribute('aria-selected', 'true')
      const active = await page.getByRole('combobox').getAttribute('aria-activedescendant')
      await expect(results(page).nth(2)).toHaveAttribute('id', active!)

      // Typing starts the list over, with its first result active: the page that was asked for.
      await page.getByRole('combobox').fill(t.query)
      await expect(results(page).first()).toContainText(t.pageHeading)
      await expect(results(page).first()).toHaveAttribute('aria-selected', 'true')
      await page.keyboard.press('Enter')

      await expect(page).toHaveURL(t.pagePath)
      await expect(page.getByRole('dialog')).toBeHidden()
      await expect(page.getByRole('heading', { level: 1, name: t.pageHeading })).toBeFocused()
    })

    test('goes to the page that is named like the query, and not to a component that mentions it', async ({ page }) => {
      await page.keyboard.press('Control+K')

      await page.getByRole('combobox').fill(t.namedQuery)
      await expect(results(page).first()).toContainText(t.namedHeading)
      await page.keyboard.press('Enter')

      await expect(page).toHaveURL(/\/docs\/guides\/accessibility\/$/)
      await expect(page.getByRole('heading', { level: 1, name: t.namedHeading })).toBeFocused()
    })

    test('goes to a result that is clicked, and leaves the language as it is', async ({ page }) => {
      await page.getByRole('button', { name: t.trigger }).click()

      await page.getByRole('option', { name: /^Dialog/ }).click()

      await expect(page).toHaveURL(/\/docs\/components\/dialog\/$/)
      await expect(page.getByRole('heading', { level: 1, name: 'Dialog' })).toBeFocused()
      await expect(page.locator('html')).toHaveAttribute('lang', locale)
    })

    test('closes on Escape and gives focus back to the button that opened it', async ({ page }) => {
      const trigger = page.getByRole('button', { name: t.trigger })
      await trigger.click()

      await page.keyboard.press('Escape')

      await expect(page.getByRole('dialog')).toBeHidden()
      await expect(trigger).toBeFocused()
    })

    test('puts focus on the search button when it closes after the shortcut, and not on the page', async ({ page }) => {
      await page.keyboard.press('Control+K')
      await expect(page.getByRole('dialog')).toBeVisible()

      await page.keyboard.press('Escape')

      await expect(page.getByRole('dialog')).toBeHidden()
      await expect(page.getByRole('button', { name: t.trigger })).toBeFocused()
    })

    test('keeps Tab inside the dialog', async ({ page }) => {
      await page.keyboard.press('Control+K')

      // The browser may send focus to its own interface when it leaves the last control, which is <body> to the page;
      // what must never happen is that it lands on the page behind the dialog.
      for (const key of ['Tab', 'Shift+Tab', 'Tab', 'Tab']) {
        await page.keyboard.press(key)
        expect(
          await page
            .getByRole('dialog')
            .evaluate((dialog) => document.activeElement === document.body || dialog.contains(document.activeElement)),
        ).toBe(true)
      }
    })

    test('does not let the page behind scroll while it is open, and lets it again afterwards', async ({ page }) => {
      await page.keyboard.press('Control+K')
      await expect(page.locator('html')).toHaveCSS('overflow', 'hidden')

      await page.keyboard.press('Escape')

      await expect(page.locator('html')).not.toHaveCSS('overflow', 'hidden')
    })
  })

  test.describe(`the search button of the bar at 800 px in ${locale}`, () => {
    test.use({ viewport: { width: 800, height: 800 } })

    test('shows the icon alone, which is still named, is a target of 44 px and opens the search', async ({ page }) => {
      await page.addInitScript((value) => localStorage.setItem('forma-ui-locale', value), locale)
      await page.goto('./docs/foundations/')
      const trigger = page.getByRole('button', { name: t.trigger })

      await expect(trigger).toBeVisible()
      // The words and the shortcut are in the markup, and out of sight.
      await expect(trigger.getByText(t.trigger, { exact: true })).toBeHidden()
      await expect(trigger.locator('kbd')).toBeHidden()
      const box = await trigger.boundingBox()
      expect(box?.width).toBeGreaterThanOrEqual(44)
      expect(box?.height).toBeGreaterThanOrEqual(44)

      await trigger.click()
      await expect(page.getByRole('dialog', { name: t.title })).toBeVisible()
    })
  })

  test.describe(`the search button of the bar at 390 px in ${locale}`, () => {
    test.use({ viewport: { width: 390, height: 800 } })

    test.beforeEach(async ({ page }) => {
      await page.addInitScript((value) => localStorage.setItem('forma-ui-locale', value), locale)
      await page.goto('./docs/foundations/')
    })

    test('is the icon alone, named, a target of 44 px, and beside the menu button', async ({ page }) => {
      const trigger = page.getByRole('banner').getByRole('button', { name: t.trigger })

      await expect(trigger).toBeVisible()
      await expect(trigger.getByText(t.trigger, { exact: true })).toBeHidden()
      const box = await trigger.boundingBox()
      expect(box?.width).toBeGreaterThanOrEqual(44)
      expect(box?.height).toBeGreaterThanOrEqual(44)
      const menu = await page.getByRole('button', { name: t.openMenu }).boundingBox()
      // Side by side, the search first, as in page 07.
      expect(box!.x + box!.width).toBeLessThanOrEqual(menu!.x)
      expect(Math.abs(box!.y - menu!.y)).toBeLessThan(1)
    })

    test('opens the search with focus in the field, and gives focus back to itself on Escape', async ({ page }) => {
      const trigger = page.getByRole('banner').getByRole('button', { name: t.trigger })

      await trigger.click()
      await expect(page.getByRole('dialog', { name: t.title })).toBeVisible()
      await expect(page.getByRole('combobox')).toBeFocused()

      await page.keyboard.press('Escape')

      await expect(page.getByRole('dialog')).toBeHidden()
      await expect(trigger).toBeFocused()
    })
  })

  test.describe(`the search from the menu in ${locale}`, () => {
    test.use({ viewport: { width: 390, height: 800 } })

    test.beforeEach(async ({ page }) => {
      await page.addInitScript((value) => localStorage.setItem('forma-ui-locale', value), locale)
      await page.goto('./docs/foundations/')
      await page.getByRole('button', { name: t.openMenu }).click()
      await expect(page.getByRole('dialog', { name: t.menu })).toBeVisible()
      await page.getByRole('dialog', { name: t.menu }).getByRole('button', { name: t.trigger }).click()
    })

    test('closes the menu and opens the search, which is not stacked on top of it', async ({ page }) => {
      await expect(page.getByRole('dialog', { name: t.title })).toBeVisible()
      await expect(page.getByRole('dialog', { name: t.menu })).toBeHidden()
      await expect(page.getByRole('combobox')).toBeFocused()
    })

    test('gives focus back to the menu button on Escape', async ({ page }) => {
      await page.keyboard.press('Escape')

      await expect(page.getByRole('dialog')).toBeHidden()
      await expect(page.getByRole('button', { name: t.openMenu })).toBeFocused()
    })

    test('goes to the result chosen, with the menu left closed and focus on the heading', async ({ page }) => {
      await page.getByRole('combobox').fill(t.query)
      await page.keyboard.press('Enter')

      await expect(page).toHaveURL(t.pagePath)
      await expect(page.getByRole('dialog')).toBeHidden()
      await expect(page.getByRole('heading', { level: 1 })).toBeFocused()
    })
  })
}
