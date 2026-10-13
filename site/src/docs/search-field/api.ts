import type { SearchFieldProps } from '@yelison/forma-ui'
import type { ComponentApi, NativeProps, OwnProps, PropDoc } from '../types'

// The props of SearchField that the library adds to an `<input>`. The record is typed with the props that the library has,
// so a prop added without a row here fails `npm run typecheck`.
const own = {
  label: { type: 'string', description: 'docs.searchField.api.label' },
  onValueChange: { type: '(value: string) => void', description: 'docs.searchField.api.onValueChange' },
  fieldClassName: { type: 'string', description: 'docs.searchField.api.fieldClassName' },
} satisfies Record<OwnProps<SearchFieldProps, 'input'>, PropDoc>

const changed = {
  value: { type: 'string', description: 'docs.searchField.api.value' },
  id: { type: 'string', description: 'docs.searchField.api.id' },
  readOnly: { type: 'boolean', description: 'docs.searchField.api.readOnly' },
  onKeyDown: { type: '(event: KeyboardEvent) => void', description: 'docs.searchField.api.onKeyDown' },
  className: { type: 'string', description: 'docs.searchField.api.className' },
} satisfies Partial<Record<NativeProps<'input'>, PropDoc>>

/** The API of SearchField, documented. */
export const searchFieldApi = {
  own,
  changed,
  others: 'docs.searchField.api.others',
} as const satisfies ComponentApi
