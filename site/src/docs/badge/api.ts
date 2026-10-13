import type { BadgeProps } from '@yelison/forma-ui'
import type { ComponentApi, NativeProps, OwnProps, PropDoc } from '../types'

// Badge adds two props to a `<span>`. The record is typed with the props that the library has, so a tone added without
// a row here fails `npm run typecheck`.
const own = {
  tone: {
    type: `'neutral' | 'blue' | 'green' | 'amber' | 'red' | 'purple'`,
    default: `'neutral'`,
    description: 'docs.badge.api.tone',
  },
  shape: {
    type: `'default' | 'pill'`,
    default: `'default'`,
    description: 'docs.badge.api.shape',
  },
} satisfies Record<OwnProps<BadgeProps, 'span'>, PropDoc>

const changed = {
  children: { type: 'ReactNode', description: 'docs.badge.api.children' },
  className: { type: 'string', description: 'docs.badge.api.className' },
} satisfies Partial<Record<NativeProps<'span'>, PropDoc>>

/** The API of Badge, documented. */
export const badgeApi = { own, changed, others: 'docs.badge.api.others' } as const satisfies ComponentApi
