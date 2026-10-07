import { useId } from 'react'
import { useIntl } from 'react-intl'
import type { Release as ReleaseData } from '../entries'
import styles from './Release.module.css'

export interface ReleaseProps {
  release: ReleaseData
  /** Whether it is the newest: the one the design is at now. */
  current: boolean
  /** The id of the version, which the table of contents points at. */
  id: string
}

/** One version of the design history: its label, its day, its title and every change with its type in words. */
export function Release({ release, current, id }: ReleaseProps) {
  const intl = useIntl()
  const titleId = useId()

  return (
    <li id={id} className={styles.release} aria-labelledby={titleId} tabIndex={-1}>
      <p className={styles.meta}>
        <span className={styles.version}>
          {intl.formatMessage({ id: 'changelog.version' }, { version: release.version })}
        </span>
        <span className={styles.stage}>{intl.formatMessage({ id: `changelog.stage.${release.stage}` })}</span>
        <time dateTime={release.date}>{intl.formatDate(release.date, { dateStyle: 'long', timeZone: 'UTC' })}</time>
        {current && <span className={styles.current}>{intl.formatMessage({ id: 'changelog.current' })}</span>}
      </p>
      <h2 id={titleId} className={styles.title}>
        {intl.formatMessage({ id: release.title })}
      </h2>
      <ul className={styles.changes}>
        {release.changes.map((change) => (
          <li key={change.summary} className={styles.change}>
            <span className={styles[change.type]}>{intl.formatMessage({ id: `changelog.type.${change.type}` })}</span>
            <span className={styles.summary}>
              {intl.formatMessage({ id: change.summary })}
              {change.source && (
                <>
                  {' '}
                  <a href={change.source.href}>{change.source.label}</a>
                </>
              )}
            </span>
          </li>
        ))}
      </ul>
    </li>
  )
}
