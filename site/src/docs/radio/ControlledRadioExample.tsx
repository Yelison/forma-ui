import { Radio } from '@yelison/forma-ui'
import { useState } from 'react'
import { OptionGroup } from './OptionGroup'
import type { RadioOption } from './RadioGroupExample'

export interface ControlledRadioExampleProps {
  legend: string
  options: readonly RadioOption[]
  initialValue: string
  /** Says which option is selected, from the parent's own state: it is what shows that the parent owns the selection. */
  selected: (value: string) => string
}

/** A group of radios whose selection lives in the parent, which reads it too: the live half of the «controlled» example. */
export function ControlledRadioExample({ legend, options, initialValue, selected }: ControlledRadioExampleProps) {
  const [value, setValue] = useState(initialValue)
  return (
    <div>
      <OptionGroup legend={legend}>
        {(name) =>
          options.map((option) => (
            <Radio
              key={option.value}
              name={name}
              value={option.value}
              label={option.label}
              checked={value === option.value}
              onChange={() => setValue(option.value)}
            />
          ))
        }
      </OptionGroup>
      <p>{selected(value)}</p>
    </div>
  )
}
