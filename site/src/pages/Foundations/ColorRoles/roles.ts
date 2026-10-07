import type { TokenName } from '@yelison/forma-ui'
import type { MessageId } from '../../../i18n'

/** The part of a color token's name after `--color-`: a typo, or a token the package dropped, fails the type check. */
export type ColorName = TokenName extends infer Token ? (Token extends `--color-${infer Name}` ? Name : never) : never

export interface ColorRole {
  name: ColorName
  /** The message that names what the color is for. Message ids have no hyphens, so they are not the token names. */
  label: MessageId
}

/** The color tokens the page documents, by the role they play. */
export const colorRoleGroups = [
  {
    group: 'surface',
    roles: [
      { name: 'bg', label: 'foundations.color.bg' },
      { name: 'surface', label: 'foundations.color.surface' },
      { name: 'surface-hover', label: 'foundations.color.surfaceHover' },
      { name: 'line', label: 'foundations.color.line' },
      { name: 'progress-track', label: 'foundations.color.progressTrack' },
      { name: 'overlay', label: 'foundations.color.overlay' },
    ],
  },
  {
    group: 'content',
    roles: [
      { name: 'ink', label: 'foundations.color.ink' },
      { name: 'muted', label: 'foundations.color.muted' },
      { name: 'link', label: 'foundations.color.link' },
    ],
  },
  {
    group: 'action',
    roles: [
      { name: 'brand', label: 'foundations.color.brand' },
      { name: 'brand-hover', label: 'foundations.color.brandHover' },
      { name: 'on-brand', label: 'foundations.color.onBrand' },
      { name: 'focus', label: 'foundations.color.focus' },
      { name: 'disabled', label: 'foundations.color.disabled' },
    ],
  },
  {
    group: 'navigation',
    roles: [
      { name: 'nav', label: 'foundations.color.nav' },
      { name: 'nav-active', label: 'foundations.color.navActive' },
      { name: 'nav-text', label: 'foundations.color.navText' },
      { name: 'nav-ink', label: 'foundations.color.navInk' },
    ],
  },
  {
    group: 'status',
    roles: [
      { name: 'blue-ink', label: 'foundations.color.blueInk' },
      { name: 'blue-bg', label: 'foundations.color.blueBg' },
      { name: 'green-ink', label: 'foundations.color.greenInk' },
      { name: 'green-bg', label: 'foundations.color.greenBg' },
      { name: 'amber-ink', label: 'foundations.color.amberInk' },
      { name: 'amber-bg', label: 'foundations.color.amberBg' },
      { name: 'red-ink', label: 'foundations.color.redInk' },
      { name: 'red-bg', label: 'foundations.color.redBg' },
    ],
  },
] as const satisfies readonly { group: string; roles: readonly ColorRole[] }[]
