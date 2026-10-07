import type { ComponentDoc } from '../types'
import { buttonApi } from './api'
import { buttonExamples } from './examples'

/** The reference of Button: what its page says, which the template of the page puts in order. */
export const buttonDoc: ComponentDoc = {
  summary: 'docs.button.summary',
  usageDescription: 'docs.button.usage.description',
  importCode: `import { Button } from '@yelison/forma-ui'`,
  examples: buttonExamples,
  api: buttonApi,
  accessibility: [
    'docs.button.a11y.native',
    'docs.button.a11y.name',
    'docs.button.a11y.focus',
    'docs.button.a11y.loading',
    'docs.button.a11y.state',
    'docs.button.a11y.disabled',
    'docs.button.a11y.target',
  ],
  limitations: [
    'docs.button.limit.size',
    'docs.button.limit.pressed',
    'docs.button.limit.ariaDisabled',
    'docs.button.limit.loadingLabel',
    'docs.button.limit.link',
  ],
}
