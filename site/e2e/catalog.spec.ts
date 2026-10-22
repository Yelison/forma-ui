import { expect, test, type Page } from '@playwright/test'

// What the catalog says in each language. The filters and the empty state are checked in both: a message that reached
// the page in only one of them would show here.
const text = {
  en: {
    category: 'Category',
    filterByName: 'Filter by name',
    actions: 'Actions',
    forms: 'Forms',
    navigation: 'Navigation',
    display: 'Display',
    feedback: 'Feedback',
    all: 'All',
    count: (count: number) => `Showing ${count} component${count === 1 ? '' : 's'}`,
    empty: 'No component matches these filters.',
    clear: 'Clear filters',
    openDeleteDialog: 'Delete item',
    deleteTitle: 'Delete this item?',
    cancel: 'Cancel',
    showDetails: 'Show details',
    folderActions: 'Folder actions',
  },
  es: {
    category: 'Categoría',
    filterByName: 'Filtrar por nombre',
    actions: 'Acciones',
    forms: 'Formularios',
    navigation: 'Navegación',
    display: 'Visualización',
    feedback: 'Feedback',
    all: 'Todos',
    count: (count: number) => `Mostrando ${count} componente${count === 1 ? '' : 's'}`,
    empty: 'Ningún componente coincide con estos filtros.',
    clear: 'Borrar filtros',
    openDeleteDialog: 'Eliminar elemento',
    deleteTitle: '¿Eliminar este elemento?',
    cancel: 'Cancelar',
    showDetails: 'Ver detalles',
    folderActions: 'Acciones de la carpeta',
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
      expect(await rowNames(page)).toEqual([
        'Button',
        'Input',
        'SearchField',
        'Select',
        'FilterChip',
        'Menu',
        'Radio',
        'Avatar',
        'Badge',
        'Icon',
        'Tabs',
        'Disclosure',
        'Alert',
        'Tooltip',
        'Dialog',
      ])
      await expect(countOf(page)).toHaveText(t.count(15))
      await expect(page.getByRole('button', { name: t.openDeleteDialog })).toBeVisible()
    })

    test('announces nothing on load: its specimens with an error are not alerts', async ({ page }) => {
      await expect(page.getByRole('region', { name: 'Input' }).locator('[aria-invalid="true"]')).toHaveCount(1)
      await expect(page.getByRole('region', { name: 'Select' }).locator('[aria-invalid="true"]')).toHaveCount(1)
      await expect(page.getByRole('alert')).toHaveCount(0)
    })

    test('narrows the list with a category chosen by mouse, and announces the count', async ({ page }) => {
      await page.getByText(t.feedback, { exact: true }).click()

      expect(await rowNames(page)).toEqual(['Alert', 'Tooltip', 'Dialog'])
      await expect(countOf(page)).toHaveText(t.count(3))
    })

    test('shows the Radio row under Forms, with groups that answer the arrow keys apart', async ({ page }) => {
      await page.getByText(t.forms, { exact: true }).click()

      expect(await rowNames(page)).toEqual(['Input', 'SearchField', 'Select', 'Radio'])
      await expect(countOf(page)).toHaveText(t.count(4))
      const [empty, preselected] = await page.getByRole('region', { name: 'Radio' }).getByRole('group').all()
      await empty!.getByRole('radio').first().focus()
      await page.keyboard.press('ArrowDown')
      await expect(empty!.getByRole('radio').nth(1)).toBeFocused()
      await expect(empty!.getByRole('radio').nth(1)).toBeChecked()
      await expect(preselected!.getByRole('radio').nth(1)).toBeChecked()
    })

    test('shows the Disclosure row under Display, with disclosures that answer Enter and Space and a folder whose menu does not toggle it', async ({
      page,
    }) => {
      await page.getByText(t.display, { exact: true }).click()
      expect(await rowNames(page)).toEqual(['Avatar', 'Badge', 'Icon', 'Disclosure'])
      const row = page.getByRole('region', { name: 'Disclosure' })

      const details = row.getByRole('button', { name: text[locale].showDetails }).first()
      await details.focus()
      await page.keyboard.press('Enter')
      await expect(details).toHaveAttribute('aria-expanded', 'true')
      await page.keyboard.press('Space')
      await expect(details).toHaveAttribute('aria-expanded', 'false')
      await expect(details).toBeFocused()

      const folder = row.getByRole('heading', { level: 3 }).getByRole('button')
      await row.getByRole('button', { name: text[locale].folderActions }).click()
      await expect(page.getByRole('menu', { name: text[locale].folderActions })).toBeVisible()
      await expect(folder).toHaveAttribute('aria-expanded', 'true')
    })

    test('shows the Avatar row at its three sizes, with the initials where a picture fails to load', async ({
      page,
    }) => {
      const row = page.getByRole('region', { name: 'Avatar' })
      const sizes = await row
        .getByRole('img', { name: 'Laura Méndez' })
        .evaluateAll((avatars) => avatars.slice(0, 3).map((avatar) => avatar.getBoundingClientRect().width))

      expect(sizes).toEqual([28, 36, 48])
      // The picture that fails is replaced by the initials once the browser reports the error, so one image is left. The
      // initials show ten times: three sizes, five tones, the failed picture and the decorative avatar.
      await expect(row.getByText('LM')).toHaveCount(10)
      await expect(row.locator('img')).toHaveCount(1)
    })

    test('shows the SearchField and Select rows under Forms, which answer Escape and the arrow keys', async ({
      page,
    }) => {
      await page.getByText(t.forms, { exact: true }).click()

      const [, withText] = await page.getByRole('region', { name: 'SearchField' }).getByRole('searchbox').all()
      await withText!.focus()
      await page.keyboard.press('Escape')
      await expect(withText!).toHaveValue('')
      const select = page.getByRole('region', { name: 'Select' }).getByRole('combobox').first()
      await select.focus()
      await page.keyboard.press('ArrowDown')
      await expect(select).toHaveValue('high')
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
      expect(await rowNames(page)).toEqual(['Button', 'FilterChip', 'Menu'])
      await expect(countOf(page)).toHaveText(t.count(3))
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

      expect(await rowNames(page)).toHaveLength(15)
      await expect(page.getByRole('textbox', { name: t.filterByName })).toBeFocused()
      await expect(page.getByRole('textbox', { name: t.filterByName })).toHaveValue('')
    })

    test('does not move the filters when the count or the list changes', async ({ page }) => {
      const filters = page.getByRole('textbox', { name: t.filterByName })
      const before = await filters.boundingBox()
      const status = await countOf(page).boundingBox()

      await page.getByText(t.feedback, { exact: true }).click()
      await expect(countOf(page)).toHaveText(t.count(3))

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

// The pill shape rounds the purple badge completely, and the badge keeps the height of the default one, in both themes.
for (const theme of ['light', 'dark'] as const) {
  test(`shows the purple pill fully rounded and as tall as the default one in the ${theme} theme`, async ({ page }) => {
    await page.addInitScript((value) => localStorage.setItem('forma-ui-theme', value), theme)
    await page.goto('./docs/components/')
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme)

    const commenters = page.getByRole('region', { name: 'Badge' }).getByText('Commenter', { exact: true })
    await expect(commenters).toHaveCount(2)
    const [defaultShape, pill] = await commenters.evaluateAll((elements) =>
      elements.map((element) => ({
        radius: Number.parseFloat(getComputedStyle(element).borderTopLeftRadius),
        height: element.getBoundingClientRect().height,
      })),
    )

    // Fully rounded: the radius reaches half of the height. It differs from the corners of the default shape, whatever
    // the value of the control radius is.
    expect(pill?.radius).toBeGreaterThanOrEqual((pill?.height ?? Infinity) / 2)
    expect(pill?.radius).not.toBe(defaultShape?.radius)
    expect(pill?.height).toBe(defaultShape?.height)
  })
}
