import { createContext, useContext } from 'react'
import type { Locale } from './locale'

export interface LocaleState {
  /** The language of the page. */
  locale: Locale
  /**
   * Asks for another language. It is asynchronous: the page changes, and the choice is remembered, once the messages of
   * what is on screen have arrived in the new language. Only the language chosen last applies. If its messages cannot be
   * fetched the page stays in the language it has, nothing is remembered, and `failedChanges` says so.
   */
  setLocale: (locale: Locale) => void
  /** How many choices in a row could not be fetched: zero once a choice is made, until one fails. */
  failedChanges: number
}

export const LocaleContext = createContext<LocaleState | null>(null)

/** The language of the page and the way to change it. Only under `IntlRoot`. */
export function useLocale(): LocaleState {
  const state = useContext(LocaleContext)
  if (state === null) throw new Error('useLocale needs an IntlRoot above it')
  return state
}
