import { useIntl } from 'react-intl'
import { Link } from 'react-router'
import { notFoundRoute, sectionPaths } from '../../routes'
import { RoutePage } from '../RoutePage'
import styles from './NotFound.module.css'

/** What a path that is not in the manifest shows: the same page GitHub Pages serves as 404.html. */
export function NotFound() {
  const intl = useIntl()

  return (
    <RoutePage route={notFoundRoute}>
      <p className={styles.action}>
        <Link to={sectionPaths.home}>{intl.formatMessage({ id: 'notFound.home' })}</Link>
      </p>
    </RoutePage>
  )
}
