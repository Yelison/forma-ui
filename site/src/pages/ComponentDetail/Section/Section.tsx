import { useIntl } from 'react-intl'
import type { MessageId } from '../../../i18n'
import type { ReactNode } from 'react'
import styles from './Section.module.css'

export interface SectionProps {
  /** The id that the links of the page point at. It is English, as the path of the page is. */
  id: string
  title: MessageId
  children: ReactNode
}

/** A section of a reference page: a heading that the table of contents links to, and what the section holds. */
export function Section({ id, title, children }: SectionProps) {
  const intl = useIntl()
  return (
    <section id={id} className={styles.section} aria-labelledby={`${id}-heading`}>
      <h2 id={`${id}-heading`} className={styles.heading}>
        {intl.formatMessage({ id: title })}
      </h2>
      {children}
    </section>
  )
}
