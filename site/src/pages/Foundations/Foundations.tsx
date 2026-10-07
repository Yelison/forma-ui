import { useIntl } from 'react-intl'
import type { SiteRoute } from '../../routes'
import { RoutePage } from '../RoutePage'
import { ColorRoles } from './ColorRoles'
import { ContrastTable } from './ContrastTable'
import { SpacingScale } from './SpacingScale'
import { useThemeTokens } from './themeTokens'
import { TypeScale } from './TypeScale'
import styles from './Foundations.module.css'

export interface FoundationsProps {
  /** The route of the page: it names the heading and the document head. */
  route: SiteRoute
}

/**
 * The Foundations page: color roles, type hierarchy, spacing and the measured contrast, all read from the package's
 * tokens in the theme that is painted, so a change in the token source changes the page and needs no edit here.
 */
export function Foundations({ route }: FoundationsProps) {
  const intl = useIntl()
  const { theme, values } = useThemeTokens()

  return (
    <RoutePage route={route}>
      <p className={styles.lead}>{intl.formatMessage({ id: 'foundations.lead' })}</p>
      <p className={styles.theme}>{intl.formatMessage({ id: 'foundations.theme' }, { theme })}</p>
      <ColorRoles values={values} />
      <TypeScale values={values} />
      <SpacingScale values={values} />
      <ContrastTable theme={theme} values={values} />
    </RoutePage>
  )
}
