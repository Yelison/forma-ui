import { use, useLayoutEffect, type ReactNode } from 'react'
import { IntlProvider } from 'react-intl'
import type { CatalogName } from './catalogNames'
import { useLocale } from './LocaleContext'
import { loadCatalogs } from './loadCatalogs'
import { mountCatalogs } from './mountedCatalogs'

export interface MessagesProps {
  /** The catalogues the children need, all of them: this provider replaces the messages of the one above it. */
  catalogs: readonly CatalogName[]
  /** What formats messages of these catalogues. */
  children: ReactNode
}

/**
 * Gives its children the messages of `catalogs` in the language of the page, and suspends until they have arrived: the
 * nearest `Suspense` above decides what shows meanwhile, so a page never renders with an id where its text should be.
 * A change of language that suspends here has to be made in a transition (`IntlRoot` does), or that `Suspense` hides
 * the page while the messages are read.
 *
 * It is a provider of its own, with the full list, and not a merge into the one above: the catalogues of a page then
 * come and go with the page, and no state of the root has to learn which pages are open. The cost is one more
 * `IntlProvider` for the pages that have catalogues of their own.
 */
export function Messages({ catalogs, children }: MessagesProps) {
  const { locale } = useLocale()
  const messages = use(loadCatalogs(locale, catalogs))
  // Once it is on screen, a change of language has to bring these catalogues in the new language (see `IntlRoot`).
  useLayoutEffect(() => mountCatalogs(catalogs), [catalogs])

  return (
    <IntlProvider locale={locale} messages={messages}>
      {children}
    </IntlProvider>
  )
}
