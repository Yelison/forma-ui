import type { RadioProps } from '@yelison/forma-ui'
import type { ComponentApi, NativeProps, OwnProps, PropDoc } from '../types'

// The props of Radio that the library adds to an `<input>`. The record is typed with the props that the library has, so
// a prop added without a row here fails `npm run typecheck`.
const own = {
  label: { type: 'ReactNode', description: 'docs.radio.api.label' },
} satisfies Record<OwnProps<RadioProps, 'input'>, PropDoc>

const changed = {
  className: { type: 'string', description: 'docs.radio.api.className' },
} satisfies Partial<Record<NativeProps<'input'>, PropDoc>>

/** The API of Radio, documented. */
export const radioApi = {
  own,
  changed,
  others: 'docs.radio.api.others',
} as const satisfies ComponentApi
