import { expect, test, type Page } from '@playwright/test'

// What the catalog says in each language. The filters and the empty state are checked in both: a message that reached
// the page in only one of them would show here.
const text = {
  en: {
    category: 'Category',
    filterByName: 'Filter by name',
    actions: 'Actions',
    navigation: 'Navigation',
    feedback: 'Feedback',
    all: 'All',
    count: (count: number) => `Showing ${count} component${count === 1 ? '' : 's'}`,
    empty: 'No component matches these filters.',
    clear: 'Clear filters',
    openDeleteDialog: 'Delete item',
    deleteTitle: 'Delete this item?',
    cancel: 'Cancel',
  },
  es: {
    category: 'Categoría',
    filterByName: 'Filtrar por nombre',
    actions: 'Acciones',
    navigation: 'Navegación',
    feedback: 'Feedback',
    all: 'Todos',
    count: (count: number) => `Mostrando ${count} componente${count === 1 ? '' : 's'}`,
    empty: 'Ningún componente coincide con estos filtros.',
    clear: 'Borrar filtros',
    openDeleteDialog: 'Eliminar elemento',
    deleteTitle: '¿Eliminar este elemento?',
    cancel: 'Cancelar',
  },
} as const

// The switchers of the top bar each have a live region of their own: the count is the one inside the page.
const countOf = (page: Page) => page.getByRole('main').getByRole('status')

const rowNames = (page: Page) => page.getByRole('heading', { level: 2 }).allTextContents()

for (const locale of ['en', 'es'] as const) {
  const t = text[locale]

  test.describe(`the catalog in ${locale}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript((value) => localStorage.setItem('forma-ui-locale', value), locale)
      await page.goto('./docs/components/')
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    })

    test('shows a row for each family of the library, with its specimens', async ({ page }) => {
      expect(await rowNames(page)).toEqual(['Button', 'Input', 'Badge', 'Icon', 'Tabs', 'Tooltip', 'Dialog'])
      await expect(countOf(page)).toHaveText(t.count(7))
      await expect(page.getByRole('button', { name: t.openDeleteDialog })).toBeVisible()
    })

    test('announces nothing on load: its specimens with an error are not alerts', async ({ page }) => {
      await expect(page.getByRole('region', { name: 'Input' }).locator('[aria-invalid="true"]')).toHaveCount(1)
      await expect(page.getByRole('alert')).toHaveCount(0)
    })

    test('narrows the list with a category chosen by mouse, and announces the count', async ({ page }) => {
      await page.getByText(t.feedback, { exact: true }).click()

      expect(await rowNames(page)).toEqual(['Tooltip', 'Dialog'])
      await expect(countOf(page)).toHaveText(t.count(2))
    })

    test('shows the Tabs row under Navigation, with tabs that answer the keyboard', async ({ page }) => {
      await page.getByText(t.navigation, { exact: true }).click()

      expect(await rowNames(page)).toEqual(['Tabs'])
      await expect(countOf(page)).toHaveText(t.count(1))
      const [first] = await page.getByRole('tablist').all()
      await first!.getByRole('tab').first().focus()
      await page.keyboard.press('ArrowRight')
      await expect(first!.getByRole('tab').nth(1)).toBeFocused()
      await expect(first!.getByRole('tab').nth(1)).toHaveAttribute('aria-selected', 'true')
    })

    test('narrows the list from the keyboard alone, and focus stays on the filter', async ({ page }) => {
      await page.getByRole('radio', { name: t.all, exact: true }).focus()

      await page.keyboard.press('ArrowRight')

      await expect(page.getByRole('radio', { name: t.actions, exact: true })).toBeFocused()
      await expect(page.getByRole('radio', { name: t.actions, exact: true })).toBeChecked()
      expect(await rowNames(page)).toEqual(['Button'])
      await expect(countOf(page)).toHaveText(t.count(1))
    })

    test('reaches the filters and the first specimen with Tab, in the order of the page', async ({ page }) => {
      await page.getByRole('textbox', { name: t.filterByName }).focus()

      await page.keyboard.press('Tab')
      await expect(page.getByRole('radio', { name: t.all, exact: true })).toBeFocused()
      await page.keyboard.press('Tab')
      await expect(page.getByRole('link', { name: /Button/ }).first()).toBeFocused()
    })

    test('says that nothing matches, and clears the filters with focus on the first one', async ({ page }) => {
      await page.getByRole('textbox', { name: t.filterByName }).fill('zzz')

      await expect(page.getByText(t.empty)).toBeVisible()
      await expect(countOf(page)).toHaveText(t.count(0))
      expect(await rowNames(page)).toEqual([])

      await page.getByRole('button', { name: t.clear }).click()

      expect(await rowNames(page)).toHaveLength(7)
      await expect(page.getByRole('textbox', { name: t.filterByName })).toBeFocused()
      await expect(page.getByRole('textbox', { name: t.filterByName })).toHaveValue('')
    })

    test('does not move the filters when the count or the list changes', async ({ page }) => {
      const filters = page.getByRole('textbox', { name: t.filterByName })
      const before = await filters.boundingBox()
      const status = await countOf(page).boundingBox()

      await page.getByText(t.feedback, { exact: true }).click()
      await expect(countOf(page)).toHaveText(t.count(2))

      expect(await filters.boundingBox()).toEqual(before)
      expect(await countOf(page).boundingBox()).toEqual(status)
    })

    test('opens the dialog of a specimen, closes it with Escape and gives focus back to its button', async ({
      page,
    }) => {
      const opener = page.getByRole('button', { name: t.openDeleteDialog })
      await opener.click()
      await expect(page.getByRole('dialog', { name: t.deleteTitle })).toBeVisible()
      await expect(page.getByRole('button', { name: t.cancel })).toBeFocused()

      await page.keyboard.press('Escape')

      await expect(page.getByRole('dialog')).toBeHidden()
      await expect(opener).toBeFocused()
    })

    test('follows the link of the Button row to the reference of IconButton', async ({ page }) => {
      await page.getByRole('link', { name: /IconButton/ }).click()

      await expect(page).toHaveURL(/\/docs\/components\/icon-button\/$/)
      await expect(page.getByRole('heading', { level: 1, name: 'IconButton' })).toBeFocused()
    })

    test('follows a link of a row to the reference of the component, with focus on its heading', async ({ page }) => {
      await page.getByRole('link', { name: /Badge/ }).click()

      await expect(page).toHaveURL(/\/docs\/components\/badge\/$/)
      await expect(page.getByRole('heading', { level: 1, name: 'Badge' })).toBeFocused()
    })
  })
}

// The neutral badge has the background of the panel of its row: it only shows as a badge on its own card.
for (const theme of ['light', 'dark'] as const) {
  test(`shows the neutral badge as a badge in the ${theme} theme`, async ({ page }) => {
    await page.addInitScript((value) => localStorage.setItem('forma-ui-theme', value), theme)
    await page.goto('./docs/components/')
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme)

    const badge = page.getByRole('region', { name: 'Badge' }).getByText('Draft', { exact: true })
    const [badgeBackground, behindBadge] = await badge.evaluate((element) => {
      // What is painted behind the badge is the first background that is not transparent, going up.
      let behind = element.parentElement
      while (behind && getComputedStyle(behind).backgroundColor === 'rgba(0, 0, 0, 0)') behind = behind.parentElement
      return [getComputedStyle(element).backgroundColor, behind ? getComputedStyle(behind).backgroundColor : '']
    })

    expect(badgeBackground).not.toBe(behindBadge)
  })
}
