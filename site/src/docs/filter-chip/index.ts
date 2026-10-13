import type { ComponentDoc } from '../types'
import { filterChipApi } from './api'
import { filterChipExamples } from './examples'

/** The reference of FilterChip: what its page says, which the template of the page puts in order. */
export const filterChipDoc: ComponentDoc = {
  summary: 'docs.filterChip.summary',
  usageDescription: 'docs.filterChip.usage.description',
  importCode: `import { FilterChip } from '@yelison/forma-ui'`,
  examples: filterChipExamples,
  api: filterChipApi,
  accessibility: [
    'docs.filterChip.a11y.native',
    'docs.filterChip.a11y.modes',
    'docs.filterChip.a11y.group',
    'docs.filterChip.a11y.pressed',
    'docs.filterChip.a11y.popup',
    'docs.filterChip.a11y.focus',
    'docs.filterChip.a11y.disabled',
    'docs.filterChip.a11y.target',
    'docs.filterChip.a11y.strings',
  ],
  limitations: [
    'docs.filterChip.limit.group',
    'docs.filterChip.limit.menu',
    'docs.filterChip.limit.color',
    'docs.filterChip.limit.pressed',
    'docs.filterChip.limit.size',
    'docs.filterChip.limit.design',
  ],
}
