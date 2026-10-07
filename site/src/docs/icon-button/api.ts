import type { IconButtonProps } from '@yelison/forma-ui'
import type { ComponentApi, NativeProps, OwnProps, PropDoc } from '../types'

// The props of IconButton that the library adds to a `<button>`: the same rule as Button, so a prop that is added
// without a row here fails `npm run typecheck`.
const own = {
  icon: { type: 'IconName | readonly IconName[]', description: 'docs.iconButton.api.icon' },
  flip: { type: 'boolean', default: 'false', description: 'docs.iconButton.api.flip' },
  label: { type: 'string', description: 'docs.iconButton.api.label' },
} satisfies Record<OwnProps<IconButtonProps, 'button'>, PropDoc>

const changed = {
  type: { type: `'button' | 'submit' | 'reset'`, default: `'button'`, description: 'docs.iconButton.api.type' },
  'aria-label': { type: 'string', description: 'docs.iconButton.api.ariaLabel' },
  className: { type: 'string', description: 'docs.iconButton.api.className' },
} satisfies Partial<Record<NativeProps<'button'>, PropDoc>>

/** The API of IconButton, documented. */
export const iconButtonApi = { own, changed, others: 'docs.iconButton.api.others' } as const satisfies ComponentApi
