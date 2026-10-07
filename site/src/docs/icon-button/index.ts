import type { ComponentDoc } from '../types'
import { iconButtonApi } from './api'
import { iconButtonExamples } from './examples'

/** The reference of IconButton: what its page says, which the template of the page puts in order. */
export const iconButtonDoc: ComponentDoc = {
  summary: 'docs.iconButton.summary',
  usageDescription: 'docs.iconButton.usage.description',
  importCode: `import { IconButton } from '@yelison/forma-ui'`,
  examples: iconButtonExamples,
  api: iconButtonApi,
  accessibility: [
    'docs.iconButton.a11y.native',
    'docs.iconButton.a11y.name',
    'docs.iconButton.a11y.tooltip',
    'docs.iconButton.a11y.focus',
    'docs.iconButton.a11y.disabled',
    'docs.iconButton.a11y.target',
  ],
  limitations: [
    'docs.iconButton.limit.icons',
    'docs.iconButton.limit.size',
    'docs.iconButton.limit.pressed',
    'docs.iconButton.limit.label',
    'docs.iconButton.limit.glyph',
  ],
}
