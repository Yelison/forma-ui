import { useContext, useMemo, type ReactNode } from 'react'
import type { FormaStrings } from './strings.js'
import { StringsContext } from './stringsContext.js'

/** The props of `FormaProvider`. */
export interface FormaProviderProps {
  /**
   * Replaces the library's built-in text, for example `{ buttonLoading: 'Enviando…' }`. Entries left out keep the
   * value of the closest provider above, or the English default.
   */
  strings?: Partial<FormaStrings>
  /** The part of the application whose components read these strings. */
  children: ReactNode
}

/**
 * Supplies the text that the components show on their own. A prop on a component wins over the provider, and the
 * provider over the English default. Nothing else is needed for an application in English.
 */
export function FormaProvider({ strings, children }: FormaProviderProps) {
  const inherited = useContext(StringsContext)
  // Depending on the values and not on `strings` keeps the context stable when a consumer passes an inline object
  // on every render: the components below only render again when a string actually changes.
  const buttonLoading = strings?.buttonLoading ?? inherited.buttonLoading
  const dialogClose = strings?.dialogClose ?? inherited.dialogClose
  const value = useMemo(() => ({ buttonLoading, dialogClose }), [buttonLoading, dialogClose])

  return <StringsContext value={value}>{children}</StringsContext>
}
