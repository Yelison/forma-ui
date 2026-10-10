import type { ComponentDoc } from '../types'
import { radioApi } from './api'
import { radioExamples } from './examples'

/** The reference of Radio: what its page says, which the template of the page puts in order. */
export const radioDoc: ComponentDoc = {
  summary: 'docs.radio.summary',
  usageDescription: 'docs.radio.usage.description',
  importCode: `import { Radio } from '@yelison/forma-ui'`,
  examples: radioExamples,
  api: radioApi,
  accessibility: [
    'docs.radio.a11y.native',
    'docs.radio.a11y.group',
    'docs.radio.a11y.keyboard',
    'docs.radio.a11y.focus',
    'docs.radio.a11y.selected',
    'docs.radio.a11y.disabled',
    'docs.radio.a11y.target',
    'docs.radio.a11y.strings',
  ],
  limitations: [
    'docs.radio.limit.readOnly',
    'docs.radio.limit.names',
    'docs.radio.limit.group',
    'docs.radio.limit.messages',
    'docs.radio.limit.contrast',
    'docs.radio.limit.size',
    'docs.radio.limit.design',
  ],
}
