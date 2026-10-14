import type { ComponentDoc } from '../types'
import { menuApi } from './api'
import { menuExamples } from './examples'

/** The reference of Menu: what its page says, which the template of the page puts in order. */
export const menuDoc: ComponentDoc = {
  summary: 'docs.menu.summary',
  usageDescription: 'docs.menu.usage.description',
  importCode: `import { Menu } from '@yelison/forma-ui'`,
  examples: menuExamples,
  api: menuApi,
  accessibility: [
    'docs.menu.a11y.pattern',
    'docs.menu.a11y.keyboard',
    'docs.menu.a11y.focus',
    'docs.menu.a11y.name',
    'docs.menu.a11y.options',
    'docs.menu.a11y.disabled',
    'docs.menu.a11y.search',
    'docs.menu.a11y.dialog',
    'docs.menu.a11y.trigger',
    'docs.menu.a11y.strings',
  ],
  limitations: [
    'docs.menu.limit.items',
    'docs.menu.limit.spread',
    'docs.menu.limit.placement',
    'docs.menu.limit.submenu',
    'docs.menu.limit.checkbox',
    'docs.menu.limit.touch',
    'docs.menu.limit.size',
  ],
}
