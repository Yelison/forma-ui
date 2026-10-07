import type { ReactNode } from 'react'
import styles from './GuideLead.module.css'

export interface GuideLeadProps {
  /** The sentence that says what the page is for, already in the active language. */
  children: ReactNode
}

/** The introduction of a guide, under its heading: one sentence in the larger text of the page. */
export function GuideLead({ children }: GuideLeadProps) {
  return <p className={styles.lead}>{children}</p>
}
