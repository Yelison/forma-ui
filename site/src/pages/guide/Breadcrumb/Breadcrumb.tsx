import { useIntl } from 'react-intl'
import { Link } from 'react-router'
import { sectionPaths } from '../../../routes'
import styles from './Breadcrumb.module.css'

export interface BreadcrumbProps {
  /** The name of the current page, already in the active language. */
  current: string
}

/** Where the page is in the documentation: the section, then the page, which is the current one. */
export function Breadcrumb({ current }: BreadcrumbProps) {
  const intl = useIntl()

  return (
    <nav aria-label={intl.formatMessage({ id: 'guides.breadcrumb.label' })}>
      <ol className={styles.breadcrumb}>
        <li>
          <Link to={sectionPaths.gettingStarted}>{intl.formatMessage({ id: 'nav.docs' })}</Link>
        </li>
        <li aria-current="page">{current}</li>
      </ol>
    </nav>
  )
}
