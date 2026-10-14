import type { AlertProps } from '@yelison/forma-ui'
import type { ComponentApi, NativeProps, OwnProps, PropDoc } from '../types'

// The props of Alert that the library adds to a `<div>`. The record is typed with the props that the library has, so a
// prop added without a row here fails `npm run typecheck`.
const own = {
  tone: {
    type: `'blue' | 'green' | 'amber' | 'red'`,
    default: `'blue'`,
    description: 'docs.alert.api.tone',
  },
  live: { type: 'boolean', default: 'false', description: 'docs.alert.api.live' },
} satisfies Record<OwnProps<AlertProps, 'div'>, PropDoc>

// `title` is a native attribute of the `<div>` that Alert takes over as its heading, so it is listed with the ones whose
// behavior changes.
const changed = {
  title: { type: 'ReactNode', description: 'docs.alert.api.title' },
  children: { type: 'ReactNode', description: 'docs.alert.api.children' },
  className: { type: 'string', description: 'docs.alert.api.className' },
  role: { type: 'string', description: 'docs.alert.api.role' },
} satisfies Partial<Record<NativeProps<'div'>, PropDoc>>

/** The API of Alert, documented. */
export const alertApi = { own, changed, others: 'docs.alert.api.others' } as const satisfies ComponentApi
