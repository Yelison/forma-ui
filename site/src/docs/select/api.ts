import type { SelectProps } from '@yelison/forma-ui'
import type { ComponentApi, NativeProps, OwnProps, PropDoc } from '../types'

// The props of Select that the library adds to a `<select>`. The record is typed with the props that the library has, so
// a prop added without a row here fails `npm run typecheck`.
const own = {
  label: { type: 'ReactNode', description: 'docs.select.api.label' },
  hint: { type: 'ReactNode', description: 'docs.select.api.hint' },
  error: { type: 'ReactNode', description: 'docs.select.api.error' },
  announce: { type: "'assertive' | 'off'", description: 'docs.select.api.announce' },
  fieldClassName: { type: 'string', description: 'docs.select.api.fieldClassName' },
} satisfies Record<OwnProps<SelectProps, 'select'>, PropDoc>

const changed = {
  id: { type: 'string', description: 'docs.select.api.id' },
  'aria-describedby': { type: 'string', description: 'docs.select.api.ariaDescribedby' },
  'aria-invalid': { type: 'Booleanish', description: 'docs.select.api.ariaInvalid' },
  'aria-disabled': { type: 'Booleanish', description: 'docs.select.api.ariaDisabled' },
  className: { type: 'string', description: 'docs.select.api.className' },
  children: { type: 'ReactNode', description: 'docs.select.api.children' },
} satisfies Partial<Record<NativeProps<'select'>, PropDoc>>

/** The API of Select, documented. */
export const selectApi = {
  own,
  changed,
  others: 'docs.select.api.others',
} as const satisfies ComponentApi
