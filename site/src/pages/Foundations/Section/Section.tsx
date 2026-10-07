import { useId, type ReactNode } from 'react'
import styles from './Section.module.css'

export interface SectionProps {
  /** The heading of the section, already in the active language. */
  title: string
  /** What the section explains, already in the active language. */
  description: string
  children: ReactNode
}

/** A titled part of the Foundations page: a region named by its second-level heading, a sentence and its content. */
export function Section({ title, description, children }: SectionProps) {
  const headingId = useId()

  return (
    <section className={styles.section} aria-labelledby={headingId}>
      <h2 id={headingId} className={styles.title}>
        {title}
      </h2>
      <p className={styles.description}>{description}</p>
      {children}
    </section>
  )
}
