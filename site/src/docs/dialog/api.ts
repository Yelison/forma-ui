import type { DialogProps } from '@yelison/forma-ui'
import type { ComponentApi, PropDoc } from '../types'

// Dialog wraps no element that takes attributes: every prop of it is its own, `className` included. The record is typed
// with the props that the library has, so a prop added without a row here fails `npm run typecheck`. `Modal` is the same
// component with the same props, so its page is this one.
const own = {
  open: { type: 'boolean', description: 'docs.dialog.api.open' },
  onClose: { type: '() => void', description: 'docs.dialog.api.onClose' },
  title: { type: 'ReactNode', description: 'docs.dialog.api.title' },
  description: { type: 'ReactNode', description: 'docs.dialog.api.description' },
  footer: { type: 'ReactNode', description: 'docs.dialog.api.footer' },
  size: { type: `'default' | 'wide'`, default: `'default'`, description: 'docs.dialog.api.size' },
  className: { type: 'string', description: 'docs.dialog.api.className' },
  children: { type: 'ReactNode', description: 'docs.dialog.api.children' },
} satisfies Record<keyof DialogProps, PropDoc>

/** The API of Dialog, documented. */
export const dialogApi = { own } as const satisfies ComponentApi
