import { Input } from '@yelison/forma-ui'
import type { Ref } from 'react'
import { useIntl } from 'react-intl'
import { catalogCategories } from '../families'
import type { CatalogFilters as Filters, CategoryFilter } from '../filterFamilies'
import styles from './CatalogFilters.module.css'

export interface CatalogFiltersProps {
  filters: Filters
  onChange: (filters: Filters) => void
  /** How many families pass the filters now: it is said aloud each time it changes. */
  count: number
  /** The text field, so that the page can put focus back in it after the filters are cleared. */
  nameRef: Ref<HTMLInputElement>
}

const categoryFilters = ['all', ...catalogCategories] as const satisfies readonly CategoryFilter[]

/** The visible filters of the catalog: the category, as a group of radio buttons, and a field to narrow by name. */
export function CatalogFilters({ filters, onChange, count, nameRef }: CatalogFiltersProps) {
  const intl = useIntl()

  return (
    <div className={styles.filters}>
      <Input
        ref={nameRef}
        label={intl.formatMessage({ id: 'catalog.filter.name' })}
        value={filters.name}
        onChange={(event) => onChange({ ...filters, name: event.target.value })}
        autoComplete="off"
        spellCheck={false}
        fieldClassName={styles.name}
      />
      <fieldset className={styles.categories}>
        <legend className={styles.legend}>{intl.formatMessage({ id: 'catalog.filter.category' })}</legend>
        {categoryFilters.map((category) => (
          <label key={category} className={styles.chip}>
            <input
              type="radio"
              name="catalog-category"
              className={styles.radio}
              checked={filters.category === category}
              onChange={() => onChange({ ...filters, category })}
            />
            {intl.formatMessage({ id: `catalog.category.${category}` })}
          </label>
        ))}
      </fieldset>
      {/* The room for a line is always there, so the rows do not move when the text changes. */}
      <p role="status" className={styles.count}>
        {intl.formatMessage({ id: 'catalog.count' }, { count })}
      </p>
    </div>
  )
}
