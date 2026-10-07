import { startTransition, Suspense, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { commonCatalog } from './routeCatalogs'
import { LocaleContext } from './LocaleContext'
import { loadCatalogs } from './loadCatalogs'
import { Messages } from './Messages'
import { mountedCatalogs } from './mountedCatalogs'
import { readStoredLocale, resolveLocale, storeLocale, type Locale } from './locale'

export interface IntlRootProps {
  /** The app: everything under it can format messages, reads the language of the page and can change it. */
  children: ReactNode
}

const chrome = [commonCatalog] as const

/**
 * Gives the app its messages in the language of the visitor and keeps `<html lang>` on the same language, so screen
 * readers pronounce the page right and the browser offers the right hyphenation and spell check. The language is state
 * of the page: a choice applies once the messages of what is on screen have arrived, and is kept for the next visit.
 *
 * Only the catalogue of the chrome is loaded here, in the language in use; each page adds its own (`Messages`). The
 * HTML of every route preloads them, so the first render finds them on their way, and shows nothing until they arrive
 * rather than a page of ids.
 */
export function IntlRoot({ children }: IntlRootProps) {
  const [locale, setLocale] = useState(() => resolveLocale(readStoredLocale(), navigator.languages))
  const [failedChanges, setFailedChanges] = useState(0)
  // The language asked for last. Two choices in a row can finish out of order; only the latest may apply.
  const asked = useRef<Locale>(locale)

  // <html> is outside React's tree: this is the one place that has to reach it. It is a layout effect so the
  // attribute is right before the browser paints.
  useLayoutEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  async function choose(next: Locale) {
    asked.current = next
    setFailedChanges(0)
    try {
      // What is on screen needs its messages in the new language, and only that: fetch them before anything changes,
      // so the page is never half in one language, blank, or without the focus the visitor had. The pages the visitor
      // has left do not hold the change back.
      await loadCatalogs(next, mountedCatalogs())
    } catch {
      // The new language could not be fetched, which leaves the page working in the one it has. Nothing is stored, so
      // the next visit does not open in a language that did not load; the switcher says so, if this is the choice that
      // counts.
      if (asked.current === next) setFailedChanges((failed) => failed + 1)
      return
    }
    if (asked.current !== next) return
    storeLocale(next)
    // A transition: the messages are read through a promise of their own (see `Messages`), which a render in the new
    // language suspends on for an instant even though they are here. An urgent update would let the nearest `Suspense`
    // hide the page meanwhile, and a hidden page loses the focus of whoever is using it; a transition keeps it as it is.
    startTransition(() => setLocale(next))
  }

  return (
    <LocaleContext value={{ locale, setLocale: choose, failedChanges }}>
      <Suspense fallback={null}>
        <Messages catalogs={chrome}>{children}</Messages>
      </Suspense>
    </LocaleContext>
  )
}
