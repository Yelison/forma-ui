import type { ComponentDoc } from '../types'
import { tabsApi } from './api'
import { tabsExamples } from './examples'

/** The reference of Tabs: what its page says, which the template of the page puts in order. */
export const tabsDoc: ComponentDoc = {
  summary: 'docs.tabs.summary',
  usageDescription: 'docs.tabs.usage.description',
  importCode: `import { Tabs } from '@yelison/forma-ui'`,
  examples: tabsExamples,
  api: tabsApi,
  accessibility: [
    'docs.tabs.a11y.pattern',
    'docs.tabs.a11y.name',
    'docs.tabs.a11y.keyboard',
    'docs.tabs.a11y.activation',
    'docs.tabs.a11y.panel',
    'docs.tabs.a11y.focus',
    'docs.tabs.a11y.strings',
  ],
  limitations: [
    'docs.tabs.limit.color',
    'docs.tabs.limit.activation',
    'docs.tabs.limit.orientation',
    'docs.tabs.limit.disabled',
    'docs.tabs.limit.mounted',
    'docs.tabs.limit.ids',
    'docs.tabs.limit.label',
    'docs.tabs.limit.wrap',
  ],
}
