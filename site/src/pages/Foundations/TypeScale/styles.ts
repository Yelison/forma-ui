import type { TokenName } from '@yelison/forma-ui'
import type { MessageId } from '../../../i18n'

/** The part of a font token's name after `--font-`, except the family, which is not a style. */
export type FontStyleName = Exclude<
  TokenName extends infer Token ? (Token extends `--font-${infer Name}` ? Name : never) : never,
  'family'
>

export interface FontStyle {
  name: FontStyleName
  /** The message that says what the style is for. */
  usage: MessageId
}

/** The type styles of the hierarchy, from the smallest text to the largest. */
export const fontStyles = [
  { name: 'caption', usage: 'foundations.type.style.caption' },
  { name: 'body', usage: 'foundations.type.style.body' },
  { name: 'label', usage: 'foundations.type.style.label' },
  { name: 'strong', usage: 'foundations.type.style.strong' },
  { name: 'section', usage: 'foundations.type.style.section' },
  { name: 'title-mobile', usage: 'foundations.type.style.titleMobile' },
  { name: 'title', usage: 'foundations.type.style.title' },
  { name: 'metric', usage: 'foundations.type.style.metric' },
  { name: 'logo', usage: 'foundations.type.style.logo' },
] as const satisfies readonly FontStyle[]
