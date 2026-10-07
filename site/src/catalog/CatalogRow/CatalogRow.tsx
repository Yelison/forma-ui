import { useId, type ReactNode } from 'react'
import { useIntl } from 'react-intl'
import { Link } from 'react-router'
import type { CatalogFamily } from '../families'
import styles from './CatalogRow.module.css'

export interface CatalogRowProps {
  family: CatalogFamily
  /** Whether the row is out of the list because of a filter. It stays in the page, so its specimens keep their state. */
  hidden?: boolean
  /** The specimens of the family. */
  children: ReactNode
}

/** The full-width row of a family: its name, what it is for, the links to its reference pages and its specimens. */
export function CatalogRow({ family, hidden = false, children }: CatalogRowProps) {
  const intl = useIntl()
  const headingId = useId()

  return (
    <section className={styles.row} aria-labelledby={headingId} hidden={hidden}>
      <h2 id={headingId} className={styles.name}>
        {family.name}
      </h2>
      <p className={styles.description}>{intl.formatMessage({ id: family.descriptionId })}</p>
      {family.references ? (
        <ul className={styles.links}>
          {family.references.map((reference) => (
            <li key={reference.path}>
              <Link to={reference.path} className={styles.link}>
                {intl.formatMessage({ id: 'catalog.family.reference' }, { component: reference.name })}
                <span aria-hidden="true">→</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.pending}>{intl.formatMessage({ id: 'catalog.family.referencePending' })}</p>
      )}
      {children}
    </section>
  )
}
