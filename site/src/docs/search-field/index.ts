import type { ComponentDoc } from '../types'
import { searchFieldApi } from './api'
import { searchFieldExamples } from './examples'

/** The reference of SearchField: what its page says, which the template of the page puts in order. */
export const searchFieldDoc: ComponentDoc = {
  summary: 'docs.searchField.summary',
  usageDescription: 'docs.searchField.usage.description',
  importCode: `import { SearchField } from '@yelison/forma-ui'`,
  examples: searchFieldExamples,
  api: searchFieldApi,
  accessibility: [
    'docs.searchField.a11y.native',
    'docs.searchField.a11y.label',
    'docs.searchField.a11y.escape',
    'docs.searchField.a11y.disabled',
    'docs.searchField.a11y.focus',
    'docs.searchField.a11y.icon',
    'docs.searchField.a11y.strings',
  ],
  limitations: [
    'docs.searchField.limit.controlled',
    'docs.searchField.limit.omitted',
    'docs.searchField.limit.classes',
    'docs.searchField.limit.clear',
    'docs.searchField.limit.results',
    'docs.searchField.limit.hint',
    'docs.searchField.limit.size',
    'docs.searchField.limit.design',
  ],
}
