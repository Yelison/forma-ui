import type { DisclosureButtonProps, DisclosureProps, DisclosureRootProps } from '@yelison/forma-ui'
import type { ComponentApi, OwnProps, PropDoc } from '../types'

// Disclosure wraps no single element: every prop of it is its own. Each record is typed with the props that the library
// has, so a prop added without a row here fails `npm run typecheck`.
const own = {
  summary: { type: 'ReactNode', description: 'docs.disclosure.api.summary' },
  variant: { type: `'inline' | 'section'`, default: `'inline'`, description: 'docs.disclosure.api.variant' },
  headingLevel: { type: '2 | 3 | 4 | 5 | 6', description: 'docs.disclosure.api.headingLevel' },
  actions: { type: 'ReactNode', description: 'docs.disclosure.api.actions' },
  open: { type: 'boolean', description: 'docs.disclosure.api.open' },
  defaultOpen: { type: 'boolean', default: 'false', description: 'docs.disclosure.api.defaultOpen' },
  onOpenChange: { type: '(open: boolean) => void', description: 'docs.disclosure.api.onOpenChange' },
  buttonProps: { type: 'DisclosureButtonProps', description: 'docs.disclosure.api.buttonProps' },
  className: { type: 'string', description: 'docs.disclosure.api.className' },
  children: { type: 'ReactNode', description: 'docs.disclosure.api.children' },
} satisfies Record<keyof DisclosureProps, PropDoc>

// The state that the parts share: the same three props that Disclosure takes, and the parts as children.
const root = {
  open: { type: 'boolean', description: 'docs.disclosure.api.open' },
  defaultOpen: { type: 'boolean', default: 'false', description: 'docs.disclosure.api.defaultOpen' },
  onOpenChange: { type: '(open: boolean) => void', description: 'docs.disclosure.api.onOpenChange' },
  children: { type: 'ReactNode', description: 'docs.disclosure.root.children' },
} satisfies Record<keyof DisclosureRootProps, PropDoc>

// DisclosureButton is a native `button`: its own prop is the side of the chevron.
const button = {
  chevron: { type: `'start' | 'end'`, default: `'end'`, description: 'docs.disclosure.button.chevron' },
} satisfies Record<OwnProps<DisclosureButtonProps, 'button'>, PropDoc>

/** The API of Disclosure, documented, with the parts that it is built from. */
export const disclosureApi = {
  own,
  related: [
    { component: 'DisclosureRoot', own: root },
    { component: 'DisclosureButton', own: button },
  ],
} as const satisfies ComponentApi
