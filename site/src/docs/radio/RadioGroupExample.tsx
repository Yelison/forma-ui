import { Radio } from '@yelison/forma-ui'
import { OptionGroup } from './OptionGroup'

/** One option of an example: the value that a form sends and the text of its label. */
export interface RadioOption {
  value: string
  label: string
}

export interface RadioGroupExampleProps {
  legend: string
  options: readonly RadioOption[]
  /** The value of the option that starts selected. */
  defaultValue?: string
  /** The value of the option that cannot be chosen. */
  disabledValue?: string
}

/** A group of radios that keeps its own selection: the live half of the examples with `defaultChecked` and `disabled`. */
export function RadioGroupExample({ legend, options, defaultValue, disabledValue }: RadioGroupExampleProps) {
  return (
    <OptionGroup legend={legend}>
      {(name) =>
        options.map(({ value, label }) => (
          <Radio
            key={value}
            name={name}
            value={value}
            label={label}
            defaultChecked={value === defaultValue}
            disabled={value === disabledValue}
          />
        ))
      }
    </OptionGroup>
  )
}
