import type { IntlShape } from 'react-intl'
import type { ControlOption } from './definitions'

/** The name of an option as the person reads it: its message, or the value of the prop when that is the name. */
export function optionLabel(intl: IntlShape, { label, value }: ControlOption): string {
  return label ? intl.formatMessage({ id: label }, { value }) : value
}
