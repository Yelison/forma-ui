import { useLayoutEffect, useState, type ReactNode } from 'react'
import { IntlProvider } from 'react-intl'
import { LocaleContext } from './LocaleContext'
import { readStoredLocale, resolveLocale, storeLocale, type Locale } from './locale'
import { messages } from './messages'

export interface IntlRootProps {
  /** The app: everything under it can format messages, reads the language of the page and can change it. */
  children: ReactNode
}

/**
 * Gives the app its messages in the language of the visitor and keeps `<html lang>` on the same language, so screen
 * readers pronounce the page right and the browser offers the right hyphenation and spell check. The language is state
 * of the page: a choice applies at once, and is kept for the next visit.
 */
export function IntlRoot({ children }: IntlRootProps) {
  const [locale, setLocale] = useState(() => resolveLocale(readStoredLocale(), navigator.languages))

  // <html> is outside React's tree: this is the one place that has to reach it. It is a layout effect so the
  // attribute is right before the browser paints.
  useLayoutEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  function choose(next: Locale) {
    setLocale(next)
    storeLocale(next)
  }

  return (
    <IntlProvider locale={locale} messages={messages[locale]}>
      <LocaleContext value={{ locale, setLocale: choose }}>{children}</LocaleContext>
    </IntlProvider>
  )
}
