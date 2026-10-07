import { useId } from 'react'
import { useIntl } from 'react-intl'
import type { Control, ControlOption } from './definitions'
import styles from './ComponentExplorer.module.css'
import { optionLabel } from './optionLabel'

export interface ControlSelectProps {
  control: Control
  value: string
  onChange: (option: ControlOption) => void
}

/** One control of the explorer: a native `select`, with its label. An option that is only proposed is disabled. */
export function ControlSelect({ control, value, onChange }: ControlSelectProps) {
  const intl = useIntl()
  const id = useId()

  return (
    <div className={styles.control}>
      <label className={styles.controlLabel} htmlFor={id}>
        {intl.formatMessage({ id: control.label })}
      </label>
      <select
        id={id}
        className={styles.select}
        value={value}
        onChange={(event) => {
          const chosen = control.options.find((option) => option.value === event.target.value)
          if (chosen) onChange(chosen)
        }}
      >
        {control.options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.proposed}>
            {optionLabel(intl, option)}
          </option>
        ))}
      </select>
    </div>
  )
}
