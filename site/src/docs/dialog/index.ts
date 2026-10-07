import type { ComponentDoc } from '../types'
import { dialogApi } from './api'
import { dialogExamples } from './examples'

/** The reference of Dialog, which is also the one of Modal: the template of the page puts it in order. */
export const dialogDoc: ComponentDoc = {
  summary: 'docs.dialog.summary',
  usageDescription: 'docs.dialog.usage.description',
  importCode: `import { Dialog } from '@yelison/forma-ui'`,
  examples: dialogExamples,
  api: dialogApi,
  accessibility: [
    'docs.dialog.a11y.native',
    'docs.dialog.a11y.name',
    'docs.dialog.a11y.focus',
    'docs.dialog.a11y.dismiss',
    'docs.dialog.a11y.footer',
    'docs.dialog.a11y.strings',
    'docs.dialog.a11y.scroll',
  ],
  limitations: [
    'docs.dialog.limit.controlled',
    'docs.dialog.limit.focusLost',
    'docs.dialog.limit.tooltip',
    'docs.dialog.limit.close',
    'docs.dialog.limit.content',
    'docs.dialog.limit.sizes',
    'docs.dialog.limit.modal',
  ],
}
