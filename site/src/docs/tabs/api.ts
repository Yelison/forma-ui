import type { TabItem, TabsProps } from '@yelison/forma-ui'
import type { ComponentApi, PropDoc } from '../types'

// Tabs renders a wrapper of its own and takes no native attributes, so every prop of it is its own. The record is typed
// with the props that the library has, so a prop added without a row here fails `npm run typecheck`.
const own = {
  label: { type: 'string', description: 'docs.tabs.api.label' },
  items: { type: 'TabItem[]', description: 'docs.tabs.api.items' },
  value: { type: 'string', description: 'docs.tabs.api.value' },
  defaultValue: { type: 'string', default: 'the id of the first item', description: 'docs.tabs.api.defaultValue' },
  onChange: { type: '(id: string) => void', description: 'docs.tabs.api.onChange' },
  className: { type: 'string', description: 'docs.tabs.api.className' },
} satisfies Record<keyof TabsProps, PropDoc>

// The shape of one item, which the page lists next to the props of Tabs.
const item = {
  id: { type: 'string', description: 'docs.tabs.item.id' },
  label: { type: 'ReactNode', description: 'docs.tabs.item.label' },
  content: { type: 'ReactNode', description: 'docs.tabs.item.content' },
} satisfies Record<keyof TabItem, PropDoc>

/** The API of Tabs, documented, and the shape of the items that it takes. */
export const tabsApi = {
  own,
  related: [{ component: 'TabItem', title: 'docs.tabs.item.title', own: item }],
} as const satisfies ComponentApi
