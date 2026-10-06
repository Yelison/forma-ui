import { useContext } from 'react'
import type { FormaStrings } from './strings.js'
import { StringsContext } from './stringsContext.js'

/** Returns the library's text: the closest `FormaProvider`'s, or the English defaults when there is none. */
export function useFormaStrings(): FormaStrings {
  return useContext(StringsContext)
}
