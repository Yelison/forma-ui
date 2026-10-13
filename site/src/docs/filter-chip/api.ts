import type { FilterChipProps } from '@yelison/forma-ui'
import type { ComponentApi, NativeProps, OwnProps, PropDoc } from '../types'

// The props of FilterChip that the library adds to a `<button>`. The record is typed with the props that the library
// has, so a prop added without a row here fails `npm run typecheck`.
const own = {
  selected: { type: 'boolean', default: 'false', description: 'docs.filterChip.api.selected' },
} satisfies Record<OwnProps<FilterChipProps, 'button'>, PropDoc>

const changed = {
  'aria-haspopup': {
    type: "boolean | 'menu' | 'listbox' | 'dialog' | …",
    description: 'docs.filterChip.api.ariaHaspopup',
  },
  type: { type: "'button' | 'submit' | 'reset'", default: "'button'", description: 'docs.filterChip.api.type' },
} satisfies Partial<Record<NativeProps<'button'>, PropDoc>>

/** The API of FilterChip, documented. */
export const filterChipApi = {
  own,
  changed,
  others: 'docs.filterChip.api.others',
} as const satisfies ComponentApi
