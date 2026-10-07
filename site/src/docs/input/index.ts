import type { ComponentDoc } from '../types'
import { inputApi } from './api'
import { inputExamples } from './examples'

/** The reference of Input, and of Field, which it is made of: the template of the page puts it in order. */
export const inputDoc: ComponentDoc = {
  summary: 'docs.input.summary',
  usageDescription: 'docs.input.usage.description',
  importCode: `import { Input } from '@yelison/forma-ui'`,
  examples: inputExamples,
  api: inputApi,
  accessibility: [
    'docs.input.a11y.label',
    'docs.input.a11y.describedby',
    'docs.input.a11y.error',
    'docs.input.a11y.disabled',
    'docs.input.a11y.placeholder',
    'docs.input.a11y.focus',
  ],
  limitations: [
    'docs.input.limit.native',
    'docs.input.limit.control',
    'docs.input.limit.validation',
    'docs.input.limit.size',
    'docs.input.limit.errorAnnouncement',
  ],
}
