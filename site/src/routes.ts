// The route manifest: every path of the site, once. It is plain data with no imports, because two programs read it:
// the app (which routes to a page for each entry) and scripts/emit-route-html.ts (which writes one HTML file for each
// entry, under Node's type stripping). Paths are English and the same in both languages; the language never changes
// a URL.

/** Where GitHub Pages serves the site: under the repository name. */
export const siteBasePath = '/forma-ui/'

/** The origin the canonical links are written against. Assumes the project page of the repository owner's account. */
export const siteOrigin = 'https://yelison.github.io'

/**
 * Names the messages of a route (`route.<key>.title`, `.description` and `.heading`). Every component reference
 * shares the `component` key: its heading is the component's own name, which is never translated.
 */
export type RouteKey =
  | 'home'
  | 'gettingStarted'
  | 'foundations'
  | 'components'
  | 'component'
  | 'theming'
  | 'accessibility'
  | 'changelog'
  | 'notFound'

export type SiteRoute =
  | {
      readonly key: Exclude<RouteKey, 'component'>
      /** The path inside the base path, with the slash at both ends that GitHub Pages serves. */
      readonly path: string
    }
  | {
      readonly key: 'component'
      readonly path: string
      /** The name of the component in the code: the heading of its page, the same in every language. */
      readonly componentName: string
    }

/** The documentation sections that have a page of their own. Paths end with a slash, the form Pages serves. */
export const sectionPaths = {
  home: '/',
  gettingStarted: '/docs/getting-started/',
  foundations: '/docs/foundations/',
  components: '/docs/components/',
  theming: '/docs/guides/theming/',
  accessibility: '/docs/guides/accessibility/',
  changelog: '/changelog/',
} as const

/** The components that have a reference page: the ones the library ships. */
export const componentPages = [
  { slug: 'button', name: 'Button' },
  { slug: 'icon-button', name: 'IconButton' },
  { slug: 'badge', name: 'Badge' },
  { slug: 'input', name: 'Input' },
  { slug: 'tooltip', name: 'Tooltip' },
  { slug: 'dialog', name: 'Dialog' },
  { slug: 'tabs', name: 'Tabs' },
] as const

export const routes: readonly SiteRoute[] = [
  { key: 'home', path: sectionPaths.home },
  { key: 'gettingStarted', path: sectionPaths.gettingStarted },
  { key: 'foundations', path: sectionPaths.foundations },
  { key: 'components', path: sectionPaths.components },
  ...componentPages.map(({ slug, name }) => ({
    key: 'component' as const,
    path: `${sectionPaths.components}${slug}/`,
    componentName: name,
  })),
  { key: 'theming', path: sectionPaths.theming },
  { key: 'accessibility', path: sectionPaths.accessibility },
  { key: 'changelog', path: sectionPaths.changelog },
]

/** What Pages serves for any other path. It is a file, not a route of the app: the app renders it for unknown paths. */
export const notFoundRoute: SiteRoute = { key: 'notFound', path: '/404.html' }

/** The absolute URL of a path: the one `<link rel="canonical">` points at. */
export function canonicalUrl(path: string): string {
  return `${siteOrigin}${siteBasePath.slice(0, -1)}${path}`
}
