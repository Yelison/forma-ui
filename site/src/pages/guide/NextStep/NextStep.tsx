import { buttonClassName } from '@yelison/forma-ui'
import { useId } from 'react'
import { useIntl } from 'react-intl'
import { Link } from 'react-router'
import styles from './NextStep.module.css'

export interface NextStepProps {
  /** The heading of the suggestion, already in the active language. */
  title: string
  /** Why it is the next thing to read, already in the active language. */
  body: string
  /** The text of the link, already in the active language. */
  linkLabel: string
  /** The path the link goes to. */
  to: string
}

/** The end of a guide: where to go from here, as a real link that looks like the secondary button. */
export function NextStep({ title, body, linkLabel, to }: NextStepProps) {
  const intl = useIntl()
  const titleId = useId()

  return (
    <aside className={styles.next} aria-labelledby={titleId}>
      <p className={styles.label}>{intl.formatMessage({ id: 'guides.next.label' })}</p>
      <h2 id={titleId} className={styles.title}>
        {title}
      </h2>
      <p className={styles.body}>{body}</p>
      <Link className={buttonClassName({ variant: 'secondary', className: styles.link })} to={to}>
        {linkLabel}
      </Link>
    </aside>
  )
}
