import type { ButtonProps } from '@yelison/forma-ui'
import type { ComponentApi, NativeProps, OwnProps, PropDoc } from '../types'

// The props of Button that the library adds to a `<button>`. The record is typed with the keys that the library has,
// so a prop that is added without a row here, or a row for one that was removed, fails `npm run typecheck`.
const own = {
  variant: {
    type: `'primary' | 'secondary' | 'ghost' | 'danger'`,
    default: `'primary'`,
    description: 'docs.button.api.variant',
  },
  icon: { type: 'IconName', description: 'docs.button.api.icon' },
  loading: { type: 'boolean', default: 'false', description: 'docs.button.api.loading' },
  loadingLabel: { type: 'ReactNode', description: 'docs.button.api.loadingLabel' },
  block: { type: 'boolean', default: 'false', description: 'docs.button.api.block' },
} satisfies Record<OwnProps<ButtonProps, 'button'>, PropDoc>

// The native attributes that Button gives a meaning of its own. Typed with the native attributes of a `<button>` and
// nothing else: a prop of the library has its row in `own`, and cannot be listed twice.
const changed = {
  type: { type: `'button' | 'submit' | 'reset'`, default: `'button'`, description: 'docs.button.api.type' },
  'aria-disabled': { type: 'Booleanish', description: 'docs.button.api.ariaDisabled' },
  'aria-busy': { type: 'Booleanish', description: 'docs.button.api.ariaBusy' },
  onClick: { type: 'MouseEventHandler<HTMLButtonElement>', description: 'docs.button.api.onClick' },
  className: { type: 'string', description: 'docs.button.api.className' },
  children: { type: 'ReactNode', description: 'docs.button.api.children' },
} satisfies Partial<Record<NativeProps<'button'>, PropDoc>>

/** The API of Button, documented. */
export const buttonApi = { own, changed, others: 'docs.button.api.others' } as const satisfies ComponentApi
