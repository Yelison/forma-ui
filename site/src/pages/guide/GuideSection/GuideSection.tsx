import { useId, type ReactNode } from 'react'
import styles from './GuideSection.module.css'

export interface GuideSectionProps {
  /** The id that the links of the page point at. It is English, as the path of the page is. */
  id: string
  /** The heading of the section, already in the active language. */
  title: string
  /** What goes before the heading, such as the number of a step. It is decoration: the heading says it all. */
  marker?: string
  children: ReactNode
}

/** A part of a guide: a region named by its second-level heading, which the table of contents and anchors point at. */
export function GuideSection({ id, title, marker, children }: GuideSectionProps) {
  const headingId = useId()

  return (
    // tabIndex lets a link to the section move focus here, not only scroll: left alone, the browser drops the focus to the
    // page when the link goes to something that cannot take it.
    <section id={id} className={styles.section} aria-labelledby={headingId} tabIndex={-1}>
      <h2 id={headingId} className={styles.heading}>
        {marker !== undefined && (
          <span className={styles.marker} aria-hidden="true">
            {marker}
          </span>
        )}
        {title}
      </h2>
      {children}
    </section>
  )
}
