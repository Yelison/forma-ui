import type { ComponentDoc } from '../types'
import { alertApi } from './api'
import { alertExamples } from './examples'

/** The reference of Alert: what its page says, which the template of the page puts in order. */
export const alertDoc: ComponentDoc = {
  summary: 'docs.alert.summary',
  usageDescription: 'docs.alert.usage.description',
  importCode: `import { Alert } from '@yelison/forma-ui'`,
  examples: alertExamples,
  api: alertApi,
  accessibility: [
    'docs.alert.a11y.text',
    'docs.alert.a11y.static',
    'docs.alert.a11y.live',
    'docs.alert.a11y.mounted',
    'docs.alert.a11y.action',
    'docs.alert.a11y.contrast',
    'docs.alert.a11y.strings',
  ],
  limitations: [
    'docs.alert.limit.dismiss',
    'docs.alert.limit.action',
    'docs.alert.limit.tones',
    'docs.alert.limit.icon',
    'docs.alert.limit.design',
  ],
}
