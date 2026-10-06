import type { MessageId } from '../i18n'
import { sectionPaths } from '../routes'

export interface NavigationLink {
  /** The path the link goes to, one of the routes of the manifest. */
  path: string
  /** The message with the text of the link. */
  labelId: MessageId
}

/** The pages of the documentation, in reading order: what the drawer lists. */
export const documentationLinks: readonly NavigationLink[] = [
  { path: sectionPaths.gettingStarted, labelId: 'nav.gettingStarted' },
  { path: sectionPaths.foundations, labelId: 'nav.foundations' },
  { path: sectionPaths.components, labelId: 'nav.components' },
  { path: sectionPaths.theming, labelId: 'nav.theming' },
  { path: sectionPaths.accessibility, labelId: 'nav.accessibility' },
  { path: sectionPaths.changelog, labelId: 'nav.changelog' },
]

/** Where the Documentation link of the top bar goes: the first page of the index. */
export const documentationEntryPath = sectionPaths.gettingStarted

const withTrailingSlash = (pathname: string) => (pathname.endsWith('/') ? pathname : `${pathname}/`)

/**
 * Whether a path belongs to the documentation section: everything under /docs/, and the changelog, which page 07
 * draws inside the documentation navigation too. The homepage and unknown paths do not.
 */
export function isDocumentationPath(pathname: string): boolean {
  const path = withTrailingSlash(pathname)
  return path.startsWith('/docs/') || path === sectionPaths.changelog
}

/**
 * The `aria-current` of the Documentation link: `page` on the page it points at, `true` anywhere else in the section,
 * which keeps it highlighted without saying that the section is the page, and nothing outside the section.
 */
export function documentationCurrent(pathname: string): 'page' | 'true' | undefined {
  if (!isDocumentationPath(pathname)) return undefined
  return withTrailingSlash(pathname) === documentationEntryPath ? 'page' : 'true'
}
