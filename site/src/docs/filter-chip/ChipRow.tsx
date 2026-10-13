import { FilterChip } from '@yelison/forma-ui'
import { useState } from 'react'
import styles from './ChipRow.module.css'

export interface ChipRowProps {
  /** The name of the group, which a screen reader reads when focus enters the row. */
  label: string
  options: readonly string[]
  /** The option that starts pressed. */
  initialValue: string
  /** The option that cannot be chosen. */
  disabledOption?: string
}

/**
 * A single-choice row of toggle chips, with the state where the library tells the application to keep it: here. The
 * live half of the examples of the group and of the catalog.
 */
export function ChipRow({ label, options, initialValue, disabledOption }: ChipRowProps) {
  const [value, setValue] = useState(initialValue)
  return (
    <div role="group" aria-label={label} className={styles.row}>
      {options.map((option) => (
        <FilterChip
          key={option}
          selected={option === value}
          disabled={option === disabledOption}
          onClick={() => setValue(option)}
        >
          {option}
        </FilterChip>
      ))}
    </div>
  )
}
