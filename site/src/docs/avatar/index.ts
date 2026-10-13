import type { ComponentDoc } from '../types'
import { avatarApi } from './api'
import { avatarExamples } from './examples'

/** The reference of Avatar: what its page says, which the template of the page puts in order. */
export const avatarDoc: ComponentDoc = {
  summary: 'docs.avatar.summary',
  usageDescription: 'docs.avatar.usage.description',
  importCode: `import { Avatar } from '@yelison/forma-ui'`,
  examples: avatarExamples,
  api: avatarApi,
  accessibility: [
    'docs.avatar.a11y.name',
    'docs.avatar.a11y.decorative',
    'docs.avatar.a11y.picture',
    'docs.avatar.a11y.contrast',
    'docs.avatar.a11y.strings',
  ],
  limitations: [
    'docs.avatar.limit.sizes',
    'docs.avatar.limit.tones',
    'docs.avatar.limit.initials',
    'docs.avatar.limit.retry',
    'docs.avatar.limit.native',
    'docs.avatar.limit.interactive',
  ],
}
