import type { ComponentDoc } from '../types'
import { tooltipApi } from './api'
import { tooltipExamples } from './examples'

/** The reference of Tooltip: what its page says, which the template of the page puts in order. */
export const tooltipDoc: ComponentDoc = {
  summary: 'docs.tooltip.summary',
  usageDescription: 'docs.tooltip.usage.description',
  importCode: `import { Tooltip } from '@yelison/forma-ui'`,
  examples: tooltipExamples,
  api: tooltipApi,
  accessibility: [
    'docs.tooltip.a11y.keyboard',
    'docs.tooltip.a11y.dismiss',
    'docs.tooltip.a11y.hover',
    'docs.tooltip.a11y.describe',
    'docs.tooltip.a11y.content',
    'docs.tooltip.a11y.dialog',
    'docs.tooltip.a11y.trigger',
  ],
  limitations: [
    'docs.tooltip.limit.touch',
    'docs.tooltip.limit.spread',
    'docs.tooltip.limit.placement',
    'docs.tooltip.limit.interactive',
    'docs.tooltip.limit.dialog',
    'docs.tooltip.limit.delay',
  ],
}
