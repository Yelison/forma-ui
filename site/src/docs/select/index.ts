import type { ComponentDoc } from '../types'
import { selectApi } from './api'
import { selectExamples } from './examples'

/** The reference of Select: what its page says, which the template of the page puts in order. */
export const selectDoc: ComponentDoc = {
  summary: 'docs.select.summary',
  usageDescription: 'docs.select.usage.description',
  importCode: `import { Select } from '@yelison/forma-ui'`,
  examples: selectExamples,
  api: selectApi,
  accessibility: [
    'docs.select.a11y.native',
    'docs.select.a11y.label',
    'docs.select.a11y.describedby',
    'docs.select.a11y.error',
    'docs.select.a11y.disabled',
    'docs.select.a11y.focus',
    'docs.select.a11y.chevron',
  ],
  limitations: [
    'docs.select.limit.readOnly',
    'docs.select.limit.ariaDisabled',
    'docs.select.limit.native',
    'docs.select.limit.validation',
    'docs.select.limit.size',
    'docs.select.limit.errorAnnouncement',
    'docs.select.limit.design',
  ],
}
