import type { MenuItem, MenuProps, MenuSearch, MenuTriggerProps } from '@yelison/forma-ui'
import type { ComponentApi, PropDoc } from '../types'

// Menu wraps no element: every prop of it is its own. Each record is typed with the props that the library has, so a
// prop added without a row here fails `npm run typecheck`.
const own = {
  label: { type: 'string', description: 'docs.menu.api.label' },
  items: { type: 'MenuItem[]', description: 'docs.menu.api.items' },
  placement: { type: `'bottom-start' | 'bottom-end'`, default: `'bottom-end'`, description: 'docs.menu.api.placement' },
  search: { type: 'MenuSearch', description: 'docs.menu.api.search' },
  note: { type: 'string', description: 'docs.menu.api.note' },
  wide: { type: 'boolean', default: 'false', description: 'docs.menu.api.wide' },
  children: { type: '(trigger: MenuTriggerProps) => ReactNode', description: 'docs.menu.api.children' },
} satisfies Record<keyof MenuProps, PropDoc>

const item = {
  id: { type: 'string', description: 'docs.menu.item.id' },
  label: { type: 'string', description: 'docs.menu.item.label' },
  icon: { type: 'IconName', description: 'docs.menu.item.icon' },
  tone: { type: `'default' | 'danger'`, default: `'default'`, description: 'docs.menu.item.tone' },
  disabled: { type: 'boolean', default: 'false', description: 'docs.menu.item.disabled' },
  description: { type: 'string', description: 'docs.menu.item.description' },
  leading: { type: 'ReactNode', description: 'docs.menu.item.leading' },
  checked: { type: 'boolean', description: 'docs.menu.item.checked' },
  separatorBefore: { type: 'boolean', default: 'false', description: 'docs.menu.item.separatorBefore' },
  searchable: { type: 'boolean', default: 'false', description: 'docs.menu.item.searchable' },
  title: { type: 'string', description: 'docs.menu.item.title' },
  onSelect: { type: '() => void', description: 'docs.menu.item.onSelect' },
} satisfies Record<keyof MenuItem, PropDoc>

const search = {
  label: { type: 'string', description: 'docs.menu.search.label' },
  emptyText: { type: 'string', description: 'docs.menu.search.emptyText' },
} satisfies Record<keyof MenuSearch, PropDoc>

// What the render prop hands to the trigger, which is spread on it.
const trigger = {
  ref: { type: '(node: HTMLElement | null) => void', description: 'docs.menu.trigger.ref' },
  'aria-haspopup': { type: `'menu'`, description: 'docs.menu.trigger.ariaHaspopup' },
  'aria-expanded': { type: 'boolean', description: 'docs.menu.trigger.ariaExpanded' },
  'aria-controls': { type: 'string | undefined', description: 'docs.menu.trigger.ariaControls' },
  onClick: { type: '(event: MouseEvent<HTMLElement>) => void', description: 'docs.menu.trigger.onClick' },
  onKeyDown: { type: '(event: KeyboardEvent<HTMLElement>) => void', description: 'docs.menu.trigger.onKeyDown' },
} satisfies Record<keyof MenuTriggerProps, PropDoc>

/** The API of Menu, documented, with the shape of its items, of its search field and of what it hands to its trigger. */
export const menuApi = {
  own,
  related: [
    { component: 'MenuItem', title: 'docs.menu.item.group', own: item },
    { component: 'MenuSearch', title: 'docs.menu.search.title', own: search },
    { component: 'MenuTriggerProps', title: 'docs.menu.trigger.title', own: trigger },
  ],
} as const satisfies ComponentApi
