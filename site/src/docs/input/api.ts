import type { FieldProps, InputProps } from '@yelison/forma-ui'
import type { ComponentApi, NativeProps, OwnProps, PropDoc } from '../types'

// The props of Input that the library adds to an `<input>`. The record is typed with the props that the library has, so
// a prop added without a row here fails `npm run typecheck`.
const own = {
  label: { type: 'ReactNode', description: 'docs.input.api.label' },
  hint: { type: 'ReactNode', description: 'docs.input.api.hint' },
  error: { type: 'ReactNode', description: 'docs.input.api.error' },
  announce: { type: "'assertive' | 'off'", description: 'docs.input.api.announce' },
  fieldClassName: { type: 'string', description: 'docs.input.api.fieldClassName' },
} satisfies Record<OwnProps<InputProps, 'input'>, PropDoc>

const changed = {
  id: { type: 'string', description: 'docs.input.api.id' },
  'aria-describedby': { type: 'string', description: 'docs.input.api.ariaDescribedby' },
  'aria-invalid': { type: 'Booleanish', description: 'docs.input.api.ariaInvalid' },
  className: { type: 'string', description: 'docs.input.api.className' },
} satisfies Partial<Record<NativeProps<'input'>, PropDoc>>

// Field is what Input is made of, and what a consumer uses for a control of its own: it wraps no element, so every
// prop of it is its own.
const field = {
  label: { type: 'ReactNode', description: 'docs.input.field.api.label' },
  hint: { type: 'ReactNode', description: 'docs.input.field.api.hint' },
  error: { type: 'ReactNode', description: 'docs.input.field.api.error' },
  announce: { type: "'assertive' | 'off'", description: 'docs.input.field.api.announce' },
  id: { type: 'string', description: 'docs.input.field.api.id' },
  describedBy: { type: 'string', description: 'docs.input.field.api.describedBy' },
  className: { type: 'string', description: 'docs.input.field.api.className' },
  children: {
    type: '(control: FieldControlProps) => ReactNode',
    description: 'docs.input.field.api.children',
  },
} satisfies Record<keyof FieldProps, PropDoc>

/** The API of Input, documented, and the one of Field, which Input is made of. */
export const inputApi = {
  own,
  changed,
  others: 'docs.input.api.others',
  related: [{ component: 'Field', own: field }],
} as const satisfies ComponentApi
