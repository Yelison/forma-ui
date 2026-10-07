import type { TooltipProps, TooltipTriggerProps } from '@yelison/forma-ui'
import type { ComponentApi, PropDoc } from '../types'

// Tooltip wraps no element: every prop of it is its own. The record is typed with the props that the library has, so a
// prop added without a row here fails `npm run typecheck`.
const own = {
  content: { type: 'ReactNode', description: 'docs.tooltip.api.content' },
  placement: {
    type: `'right' | 'bottom-start' | 'bottom-end'`,
    default: `'right'`,
    description: 'docs.tooltip.api.placement',
  },
  describe: { type: 'boolean', default: 'true', description: 'docs.tooltip.api.describe' },
  disabled: { type: 'boolean', default: 'false', description: 'docs.tooltip.api.disabled' },
  children: { type: '(trigger: TooltipTriggerProps) => ReactNode', description: 'docs.tooltip.api.children' },
} satisfies Record<keyof TooltipProps, PropDoc>

// What the render prop hands to the trigger, which is spread on it: the page lists it next to the props of Tooltip.
const trigger = {
  ref: { type: '(node: HTMLElement | null) => void', description: 'docs.tooltip.trigger.ref' },
  onPointerEnter: { type: '() => void', description: 'docs.tooltip.trigger.onPointerEnter' },
  onPointerLeave: { type: '() => void', description: 'docs.tooltip.trigger.onPointerLeave' },
  onFocus: { type: '() => void', description: 'docs.tooltip.trigger.onFocus' },
  onBlur: { type: '() => void', description: 'docs.tooltip.trigger.onBlur' },
  'aria-describedby': { type: 'string | undefined', description: 'docs.tooltip.trigger.ariaDescribedby' },
} satisfies Record<keyof TooltipTriggerProps, PropDoc>

/** The API of Tooltip, documented, and the props that it hands to its trigger. */
export const tooltipApi = {
  own,
  related: [{ component: 'TooltipTriggerProps', title: 'docs.tooltip.trigger.title', own: trigger }],
} as const satisfies ComponentApi
