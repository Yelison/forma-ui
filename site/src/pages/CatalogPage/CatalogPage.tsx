import { Button } from '@yelison/forma-ui'
import { useRef, useState } from 'react'
import { useIntl } from 'react-intl'
import { CatalogFilters } from '../../catalog/CatalogFilters'
import { CatalogRow } from '../../catalog/CatalogRow'
import { catalogFamilies } from '../../catalog/families'
import { familySpecimens } from '../../catalog/familySpecimens'
import { matchingFamilyIds, type CatalogFilters as Filters } from '../../catalog/filterFamilies'
import type { SiteRoute } from '../../routes'
import { RoutePage } from '../RoutePage'
import styles from './CatalogPage.module.css'

const noFilters: Filters = { category: 'all', name: '' }

export interface CatalogPageProps {
  /** The catalog route: it names the heading and the document head. */
  route: SiteRoute
}

/**
 * The catalog: a row for each family of the library, with its specimens working, and the filters that narrow the list.
 * The rows a filter leaves out are hidden and stay in the page, so a dialog or a field keeps its state while the
 * filters change.
 */
export function CatalogPage({ route }: CatalogPageProps) {
  const intl = useIntl()
  const [filters, setFilters] = useState(noFilters)
  const nameRef = useRef<HTMLInputElement>(null)
  const matching = matchingFamilyIds(catalogFamilies, filters)

  function clearFilters() {
    setFilters(noFilters)
    // The button that was pressed leaves with the empty state: focus goes to the first filter, not to the page.
    nameRef.current?.focus()
  }

  return (
    <RoutePage route={route}>
      <p className={styles.lead}>{intl.formatMessage({ id: 'catalog.lead' })}</p>
      <CatalogFilters filters={filters} onChange={setFilters} count={matching.size} nameRef={nameRef} />
      {matching.size === 0 && (
        <div className={styles.empty}>
          <p className={styles.emptyText}>{intl.formatMessage({ id: 'catalog.empty' })}</p>
          <Button variant="secondary" onClick={clearFilters}>
            {intl.formatMessage({ id: 'catalog.empty.clear' })}
          </Button>
        </div>
      )}
      {catalogFamilies.map((family) => {
        const Specimens = familySpecimens[family.id]
        return (
          <CatalogRow key={family.id} family={family} hidden={!matching.has(family.id)}>
            <Specimens />
          </CatalogRow>
        )
      })}
    </RoutePage>
  )
}
