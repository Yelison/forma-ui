import type { CatalogCategory, CatalogFamily } from './families'

export type CategoryFilter = CatalogCategory | 'all'

export interface CatalogFilters {
  category: CategoryFilter
  /** What the person typed to narrow the list by name. */
  name: string
}

/**
 * The ids of the families that pass both filters: the category, and a name that contains the text, ignoring case. A
 * family is also found by the name of any component its row shows.
 */
export function matchingFamilyIds(families: readonly CatalogFamily[], { category, name }: CatalogFilters) {
  const wanted = name.trim().toLowerCase()
  return new Set(
    families
      .filter(
        (family) =>
          (category === 'all' || family.category === category) &&
          [family.name, ...(family.references ?? []).map((reference) => reference.name)].some((name) =>
            name.toLowerCase().includes(wanted),
          ),
      )
      .map((family) => family.id),
  )
}
