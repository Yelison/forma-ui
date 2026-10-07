import { catalogLoaders } from './catalogLoaders'
import type { CatalogName } from './catalogNames'
import type { Locale } from './locale'
import type { MessageId } from './messages'

/**
 * The messages of one or more catalogues. The type says strings, which is what the tests and the dev server hold: the
 * production build swaps each catalogue for the ICU syntax trees compiled from it (scripts/messages-ast.ts), which
 * react-intl takes in the same place. Nothing in the app reads a message as text except through react-intl.
 */
export type MessageMap = Record<MessageId, string>

// What has been asked for, so that a catalogue is fetched once however many pages need it. The promises are kept, not
// the messages: a page that renders while one is on its way suspends on the same promise as the first that asked.
const catalogues = new Map<Locale, Map<CatalogName, Promise<Record<string, string>>>>()
const bundles = new Map<string, Promise<MessageMap>>()

function loadCatalogue(locale: Locale, name: CatalogName): Promise<Record<string, string>> {
  const ofLocale = catalogues.get(locale) ?? new Map<CatalogName, Promise<Record<string, string>>>()
  catalogues.set(locale, ofLocale)
  const loaded = ofLocale.get(name)
  if (loaded !== undefined) return loaded

  const loading = catalogLoaders[name][locale]().then((module) => module.default)
  ofLocale.set(name, loading)
  // A failed fetch is not kept, so the next attempt (the visitor choosing the language again) asks the network again.
  loading.catch(() => ofLocale.delete(name))
  return loading
}

/**
 * The messages of `names` in `locale`, merged into one object. It is the same promise, and so the same object, for the
 * same languages and names: a component can `use` it on every render, and react-intl is given an unchanged `messages`.
 * The catalogues are fetched side by side. Names are in the order the catalogues merge in; ids are unique across them
 * (check-messages), so the order only decides which promise a failure comes from.
 */
export function loadCatalogs(locale: Locale, names: readonly CatalogName[]): Promise<MessageMap> {
  const key = `${locale}:${names.join(',')}`
  let bundle = bundles.get(key)
  if (bundle === undefined) {
    bundle = Promise.all(names.map((name) => loadCatalogue(locale, name))).then((loaded) =>
      Object.assign({}, ...loaded),
    )
    bundles.set(key, bundle)
    bundle.catch(() => bundles.delete(key))
  }
  return bundle
}
