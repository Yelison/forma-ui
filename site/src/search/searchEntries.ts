import type { IntlShape } from 'react-intl'
import { componentPages, routes, sectionPaths } from '../routes'

/** What the overlay lists, in the order it lists it: the components first, then the pages of the documentation. */
export const searchGroups = ['components', 'pages'] as const

export type SearchGroup = (typeof searchGroups)[number]

export interface SearchEntry {
  /** Where choosing the entry goes: a route of the manifest. */
  path: string
  /** The name of the component (never translated), or the heading of the page in the active language. */
  title: string
  /** What the page says about itself, in the active language: the meta description of the route. */
  description: string
  group: SearchGroup
}

/**
 * The entries of the search in the active language, derived from the route manifest and the messages of the routes: a
 * page added to the manifest is found with no second list to keep. The homepage and the not-found page are not
 * something to look for.
 */
export function searchEntries(formatMessage: IntlShape['formatMessage']): SearchEntry[] {
  const components = componentPages.map(({ slug, name }) => ({
    path: `${sectionPaths.components}${slug}/`,
    title: name,
    description: formatMessage({ id: 'route.component.description' }, { component: name }),
    group: 'components' as const,
  }))
  const pages = routes.flatMap((route) =>
    route.key === 'home' || route.key === 'component'
      ? []
      : [
          {
            path: route.path,
            title: formatMessage({ id: `route.${route.key}.heading` }),
            description: formatMessage({ id: `route.${route.key}.description` }),
            group: 'pages' as const,
          },
        ],
  )
  return [...components, ...pages]
}
