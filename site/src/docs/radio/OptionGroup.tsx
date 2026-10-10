import { useId, type ReactNode } from 'react'
import styles from './OptionGroup.module.css'

export interface OptionGroupProps {
  /** What the group chooses: the legend that a screen reader reads with each option. */
  legend: string
  /** The options, which share the name that the group hands them. */
  children: (name: string) => ReactNode
}

/**
 * The fieldset that a group of radios goes in. Every group has a name of its own: radios that share a name are one
 * group wherever they are on the page, and the examples and the specimens of a page would otherwise take each other's
 * selection and arrow keys.
 */
export function OptionGroup({ legend, children }: OptionGroupProps) {
  const name = useId()
  return (
    <fieldset className={styles.group}>
      <legend className={styles.legend}>{legend}</legend>
      {children(name)}
    </fieldset>
  )
}
