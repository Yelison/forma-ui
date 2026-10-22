import type { ComponentDoc } from '../types'
import { disclosureApi } from './api'
import { disclosureExamples } from './examples'

/** The reference of Disclosure: what its page says, which the template of the page puts in order. */
export const disclosureDoc: ComponentDoc = {
  summary: 'docs.disclosure.summary',
  usageDescription: 'docs.disclosure.usage.description',
  importCode: `import { Disclosure } from '@yelison/forma-ui'`,
  examples: disclosureExamples,
  api: disclosureApi,
  accessibility: [
    'docs.disclosure.a11y.pattern',
    'docs.disclosure.a11y.keyboard',
    'docs.disclosure.a11y.focus',
    'docs.disclosure.a11y.hidden',
    'docs.disclosure.a11y.name',
    'docs.disclosure.a11y.heading',
    'docs.disclosure.a11y.actions',
    'docs.disclosure.a11y.motion',
    'docs.disclosure.a11y.strings',
  ],
  limitations: [
    'docs.disclosure.limit.parts',
    'docs.disclosure.limit.mounted',
    'docs.disclosure.limit.button',
    'docs.disclosure.limit.group',
    'docs.disclosure.limit.direction',
  ],
}
