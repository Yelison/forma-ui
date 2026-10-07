import { useIntl } from 'react-intl'
import { Link } from 'react-router'
import { richText } from '../../../docs/richText'
import { componentPages, sectionPaths } from '../../../routes'
import { GuideSection } from '../../guide'
import type { ObligationGroup } from '../obligations'
import styles from './ObligationSection.module.css'

export interface ObligationSectionProps {
  group: ObligationGroup
}

/** One group of obligations: what it asks of the person using the components, and where each component says it too. */
export function ObligationSection({ group }: ObligationSectionProps) {
  const intl = useIntl()

  return (
    <GuideSection id={group.id} title={intl.formatMessage({ id: group.title })}>
      <ul>
        {group.obligations.map((id) => (
          <li key={id}>{intl.formatMessage({ id }, richText)}</li>
        ))}
      </ul>
      <p className={styles.references}>
        <span>{intl.formatMessage({ id: 'accessibility.references' })}</span>
        {group.references.map((name) => (
          <Link
            key={name}
            className={styles.reference}
            to={`${sectionPaths.components}${componentPages.find((page) => page.name === name)?.slug}/#accessibility`}
          >
            {name}
          </Link>
        ))}
      </p>
    </GuideSection>
  )
}
