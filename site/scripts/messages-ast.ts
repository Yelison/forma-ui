// Compiles the message catalogues to ICU syntax trees while the site is built, so react-intl does not parse any ICU
// message in the browser and the ICU parser is not in the bundle (see the alias in vite.config.ts). It is the
// FormatJS CLI's own `compile --ast`, the same one that check-messages.ts validates the catalogues with.
import { dirname, resolve } from 'node:path'
import type { Plugin } from 'vite'
import { compileMessages } from './formatjs.ts'

export interface CatalogueOptions {
  /** The directory with the catalogues (`common.en.json`, `common.es.json`…): the JSON files directly inside it are compiled. */
  directory: string
  /** A pseudo-locale for the CLI, such as `en-XA`. Omit it for the real messages. */
  pseudoLocale?: string
}

/** The module that stands for a catalogue: its syntax trees. `null` for any other module, which stays as it is. */
export function catalogueModule(id: string, { directory, pseudoLocale }: CatalogueOptions) {
  const isCatalogue = id.endsWith('.json') && dirname(id) === resolve(directory)
  if (!isCatalogue) return null
  return { code: `export default ${JSON.stringify(compileMessages(id, { pseudoLocale }))}`, map: null }
}

/**
 * Vite plugin: in the production build, the catalogues of `directory` export syntax trees instead of strings. The
 * imports of the app do not change. Tests and the dev server keep the strings, which react-intl parses on its own.
 */
export function messagesAst(options: CatalogueOptions): Plugin {
  return {
    name: 'forma-ui-messages-ast',
    apply: 'build',
    // After Vite's JSON plugin, which has turned the file into a module by then: this one replaces that module.
    enforce: 'post',
    transform: (_source, id) => catalogueModule(id, options),
  }
}
