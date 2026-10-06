import { createContext } from 'react'
import { defaultStrings, type FormaStrings } from './strings.js'

/**
 * Holds the library's text. Private: components read it with `useFormaStrings` and `FormaProvider` writes it.
 * The pure annotation lets a consumer's bundler drop the context when nothing imports the provider or the hook.
 */
export const StringsContext = /* @__PURE__ */ createContext<FormaStrings>(defaultStrings)
