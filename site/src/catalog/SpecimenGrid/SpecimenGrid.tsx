import type { ReactNode } from 'react'
import styles from './SpecimenGrid.module.css'

export interface SpecimenGridProps {
  /** How wide a specimen needs to be before the grid starts a new row: the smallest column. Defaults to `default`. */
  columns?: 'narrow' | 'default' | 'wide'
  children: ReactNode
}

/** The specimens of a family on its panel. They wrap onto as many rows as the width needs, down to one column. */
export function SpecimenGrid({ columns = 'default', children }: SpecimenGridProps) {
  return <ul className={`${styles.grid} ${styles[columns]}`}>{children}</ul>
}

export interface SpecimenProps {
  /** What the specimen shows: a state in words, or the prop and value that produce it in code. */
  label: ReactNode
  /**
   * Sets the component on a card of the page's own surface color instead of the panel. A component whose background is
   * the panel's, such as the neutral Badge, is a bare word there; on the card it shows its shape. Defaults to `false`.
   */
  surface?: boolean
  /** The live component. */
  children: ReactNode
}

/** One variant or state of a component, working, with its label under it. */
export function Specimen({ label, surface = false, children }: SpecimenProps) {
  return (
    <li className={styles.specimen}>
      <div className={surface ? `${styles.stage} ${styles.surface}` : styles.stage}>{children}</div>
      <span className={styles.label}>{label}</span>
    </li>
  )
}
