import { useLayoutEffect, useState, type ReactNode } from 'react'
import { IntlProvider } from 'react-intl'
import { readStoredLocale, resolveLocale } from './locale'
import { messages } from './messages'

export interface IntlRootProps {
  /** The app: everything under it can format messages and reads the language of the page. */
  children: ReactNode
}

/**
 * Gives the app its messages in the language of the visitor and keeps `<html lang>` on the same language, so screen
 * readers pronounce the page right and the browser offers the right hyphenation and spell check.
 */
export function IntlRoot({ children }: IntlRootProps) {
  const [locale] = useState(() => resolveLocale(readStoredLocale(), navigator.languages))

  // <html> is outside React's tree: this is the one place that has to reach it. It is a layout effect so the
  // attribute is right before the browser paints.
  useLayoutEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  return (
    <IntlProvider locale={locale} messages={messages[locale]}>
      {children}
    </IntlProvider>
  )
}
