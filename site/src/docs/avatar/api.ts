import type { AvatarProps } from '@yelison/forma-ui'
import type { ComponentApi, PropDoc } from '../types'

// Avatar renders a `<span>` but forwards no attributes to it, so every prop it takes is its own and the reference has
// no group of native ones. The record is typed with the props that the library has, so a prop added without a row here
// fails `npm run typecheck`.
const own = {
  name: { type: 'string', description: 'docs.avatar.api.name' },
  size: { type: `'small' | 'medium' | 'large'`, default: `'medium'`, description: 'docs.avatar.api.size' },
  tone: {
    type: `'blue' | 'green' | 'amber' | 'red' | 'purple' | 'neutral'`,
    default: `'blue'`,
    description: 'docs.avatar.api.tone',
  },
  src: { type: 'string', description: 'docs.avatar.api.src' },
  decorative: { type: 'boolean', default: 'false', description: 'docs.avatar.api.decorative' },
  className: { type: 'string', description: 'docs.avatar.api.className' },
} satisfies Record<keyof AvatarProps, PropDoc>

/** The API of Avatar, documented. */
export const avatarApi = { own } as const satisfies ComponentApi
