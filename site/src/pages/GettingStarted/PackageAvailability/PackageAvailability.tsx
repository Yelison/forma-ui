import { useId } from 'react'
import { useIntl } from 'react-intl'
import { packageStatus } from '../../../packageStatus'
import styles from './PackageAvailability.module.css'

export interface PackageAvailabilityProps {
  /** Whether the package is on npm. It decides between the notice that says it is pending and the one that says it is not. */
  published: boolean
}

/** What the reader needs to know before the install command: whether it works yet, said in words and not by color alone. */
export function PackageAvailability({ published }: PackageAvailabilityProps) {
  const intl = useIntl()
  const titleId = useId()
  const { name, version } = packageStatus

  return (
    <aside className={published ? styles.note : `${styles.note} ${styles.pending}`} aria-labelledby={titleId}>
      <h3 id={titleId} className={styles.title}>
        {intl.formatMessage({ id: 'gettingStarted.availability.title' })}
      </h3>
      <p className={styles.body}>
        {intl.formatMessage(
          { id: published ? 'gettingStarted.availability.published' : 'gettingStarted.availability.pending' },
          { name, version },
        )}
      </p>
    </aside>
  )
}
