import type { componentPages } from '../routes'
import { badgeDoc } from './badge'
import { buttonDoc } from './button'
import { dialogDoc } from './dialog'
import { iconButtonDoc } from './icon-button'
import { inputDoc } from './input'
import { tabsDoc } from './tabs'
import { tooltipDoc } from './tooltip'
import type { ComponentDoc } from './types'

/**
 * The reference of each component that has one, by the slug of its page. The slugs are the ones of the routes, so a
 * misspelled one does not compile. The components without an entry show the placeholder of their route.
 */
export const componentDocs: Partial<Record<(typeof componentPages)[number]['slug'], ComponentDoc>> = {
  button: buttonDoc,
  'icon-button': iconButtonDoc,
  badge: badgeDoc,
  input: inputDoc,
  tooltip: tooltipDoc,
  dialog: dialogDoc,
  tabs: tabsDoc,
}

export type { ComponentDoc } from './types'
