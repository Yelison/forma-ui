import type { componentPages } from '../routes'
import { buttonDoc } from './button'
import type { ComponentDoc } from './types'

/**
 * The reference of each component that has one, by the slug of its page. The slugs are the ones of the routes, so a
 * misspelled one does not compile. The components without an entry show the placeholder of their route.
 */
export const componentDocs: Partial<Record<(typeof componentPages)[number]['slug'], ComponentDoc>> = {
  button: buttonDoc,
}

export type { ComponentDoc } from './types'
