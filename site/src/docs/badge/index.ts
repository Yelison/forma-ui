import type { ComponentDoc } from '../types'
import { badgeApi } from './api'
import { badgeExamples } from './examples'

/** The reference of Badge: what its page says, which the template of the page puts in order. */
export const badgeDoc: ComponentDoc = {
  summary: 'docs.badge.summary',
  usageDescription: 'docs.badge.usage.description',
  importCode: `import { Badge } from '@yelison/forma-ui'`,
  examples: badgeExamples,
  api: badgeApi,
  accessibility: [
    'docs.badge.a11y.text',
    'docs.badge.a11y.native',
    'docs.badge.a11y.contrast',
    'docs.badge.a11y.change',
  ],
  limitations: [
    'docs.badge.limit.tones',
    'docs.badge.limit.size',
    'docs.badge.limit.wrap',
    'docs.badge.limit.interactive',
  ],
}
