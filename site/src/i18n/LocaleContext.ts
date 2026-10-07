import { createContext, useContext } from 'react'
import type { Locale } from './locale'

export interface LocaleState {
  /** The language of the page. */
  locale: Locale
  /** Changes the language of the page, and remembers the choice. */
  setLocale: (locale: Locale) => void
}

export const LocaleContext = createContext<LocaleState | null>(null)

/** The language of the page and the way to change it. Only under `IntlRoot`. */
export function useLocale(): LocaleState {
  const state = useContext(LocaleContext)
  if (state === null) throw new Error('useLocale needs an IntlRoot above it')
  return state
}
