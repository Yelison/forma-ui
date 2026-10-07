import type { MessageId } from '../i18n'
import { componentPages, sectionPaths } from '../routes'

/** What a family does for the person using the interface. Filters group the catalog by it. */
export type CatalogCategory = 'actions' | 'forms' | 'display' | 'feedback'

export type FamilyId = 'button' | 'input' | 'badge' | 'icon' | 'tooltip' | 'dialog'

/** A reference page that a row links to: the component it documents (never translated) and where it is. */
export interface CatalogReference {
  readonly name: string
  readonly path: string
}

export interface CatalogFamily {
  readonly id: FamilyId
  /** The name in the code: the heading of the row, the same in every language. */
  readonly name: string
  readonly category: CatalogCategory
  /** The message that says in a sentence what the family is for. */
  readonly descriptionId: MessageId
  /**
   * The reference pages of the components that the row shows, the family's own first. A row that shows two components,
   * such as Button with IconButton, links to both, and a filter by the name of either finds the row. Icon has none yet:
   * the plan fixes the list of reference pages.
   */
  readonly references?: readonly CatalogReference[]
}

/** Categories in the order of the filter. «Navigation» is left out until NavItem and Tabs are in the library. */
export const catalogCategories = [
  'actions',
  'forms',
  'display',
  'feedback',
] as const satisfies readonly CatalogCategory[]

const reference = (slug: (typeof componentPages)[number]['slug']): CatalogReference => ({
  name: componentPages.find((page) => page.slug === slug)!.name,
  path: `${sectionPaths.components}${slug}/`,
})

/**
 * The families of the v0.1 library, in reading order. Button carries IconButton, which is the same family drawn
 * without text. Checkbox, Switch, Tabs and NavItem are in the design but not in the library, so they have no row.
 */
export const catalogFamilies: readonly CatalogFamily[] = [
  {
    id: 'button',
    name: 'Button',
    category: 'actions',
    descriptionId: 'catalog.family.button.description',
    references: [reference('button'), reference('icon-button')],
  },
  {
    id: 'input',
    name: 'Input',
    category: 'forms',
    descriptionId: 'catalog.family.input.description',
    references: [reference('input')],
  },
  {
    id: 'badge',
    name: 'Badge',
    category: 'display',
    descriptionId: 'catalog.family.badge.description',
    references: [reference('badge')],
  },
  { id: 'icon', name: 'Icon', category: 'display', descriptionId: 'catalog.family.icon.description' },
  {
    id: 'tooltip',
    name: 'Tooltip',
    category: 'feedback',
    descriptionId: 'catalog.family.tooltip.description',
    references: [reference('tooltip')],
  },
  {
    id: 'dialog',
    name: 'Dialog',
    category: 'feedback',
    descriptionId: 'catalog.family.dialog.description',
    references: [reference('dialog')],
  },
]
