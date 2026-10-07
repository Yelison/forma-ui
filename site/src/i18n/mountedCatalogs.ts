import type { CatalogName } from './catalogNames'

// The lists of catalogues of the `Messages` that are on screen, one entry for each. They are kept here and not in
// `loadCatalogs` because that one remembers what was ever fetched, and a language change has to wait only for what the
// page needs now, not for the pages the visitor left behind.
const mounted = new Set<readonly CatalogName[]>()

/** Records that a `Messages` with these catalogues is on screen. Returns what to call when it leaves. */
export function mountCatalogs(catalogs: readonly CatalogName[]): () => void {
  const entry = [...catalogs]
  mounted.add(entry)
  return () => {
    mounted.delete(entry)
  }
}

/** The catalogues that the page on screen is showing, each once. */
export function mountedCatalogs(): CatalogName[] {
  return [...new Set([...mounted].flat())]
}
