// Which catalogues each route needs: plain data and one function, with relative `.ts` imports, because the app (to load
// them) and scripts/emit-route-html.ts (to preload them from the HTML of the route) read the same answer.
import { componentPages, type SiteRoute } from '../routes.ts'
import type { CatalogName } from './catalogNames.ts'

/** The catalogue that every page has: the chrome around it, and the title of every route. */
export const commonCatalog = 'common' satisfies CatalogName

// The reference of each component is one catalogue of its own: the six references share a chunk and a route key, so the
// catalogue follows the component, not the route. A new entry in `componentPages` fails the type check until it has one.
const referenceCatalogs: Record<(typeof componentPages)[number]['name'], CatalogName> = {
  Button: 'docs.button',
  IconButton: 'docs.iconButton',
  Badge: 'docs.badge',
  Input: 'docs.input',
  Tooltip: 'docs.tooltip',
  Dialog: 'docs.dialog',
}

const pageCatalogsByKey: Partial<Record<SiteRoute['key'], readonly CatalogName[]>> = {
  home: ['home'],
  foundations: ['foundations'],
  components: ['catalog', 'specimens'],
}

/** What the page of a route needs besides `common`: nothing for the pages that only show messages of the chrome. */
export function pageCatalogs(route: SiteRoute): readonly CatalogName[] {
  if (route.key !== 'component') return pageCatalogsByKey[route.key] ?? []
  const reference = new Map<string, CatalogName>(Object.entries(referenceCatalogs)).get(route.componentName)
  if (reference === undefined) throw new Error(`${route.componentName} has no reference catalogue`)
  return ['detail', 'specimens', reference]
}

/** Every catalogue a route shows, `common` first: the one the chrome has and the ones its page adds. */
export function routeCatalogs(route: SiteRoute): readonly CatalogName[] {
  return [commonCatalog, ...pageCatalogs(route)]
}
