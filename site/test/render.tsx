import { act, render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { IntlProvider } from 'react-intl'
import { MemoryRouter } from 'react-router'
import { LocaleContext } from '../src/i18n/LocaleContext'
import type { Locale, MessageId } from '../src/i18n'
import { messages } from './messages'

/** Every message replaced by its own id in marks: what is on screen and does not carry them is not a message. */
export const markedMessages = Object.fromEntries(Object.keys(messages.en).map((id) => [id, `⟦${id}⟧`])) as Record<
  MessageId,
  string
>

interface RenderOptions {
  /** The path the router starts at. */
  path?: string
  locale?: Locale
  /** Replaces the messages of the locale, for example with {@link markedMessages}. */
  messages?: Record<MessageId, string>
}

function inSite(ui: ReactElement, { path = '/', locale = 'en', messages: override }: RenderOptions = {}): ReactElement {
  return (
    <IntlProvider locale={locale} messages={override ?? messages[locale]}>
      <LocaleContext value={{ locale, setLocale: () => {}, failedChanges: 0 }}>
        <MemoryRouter initialEntries={[path]}>{ui}</MemoryRouter>
      </LocaleContext>
    </IntlProvider>
  )
}

/**
 * Renders what the site renders around a page: its messages in a language, and a router at a path. The language is
 * fixed: a component that changes it is tested under the real `IntlRoot`.
 */
export const renderInSite = (ui: ReactElement, options?: RenderOptions) => render(inSite(ui, options))

/**
 * `render` for what suspends while it loads, such as the messages and the chunk of a page. It renders inside an awaited
 * `act`, which gives React the chance to retry what was waiting on promises that settle in microtasks. It does not wait
 * for a load that takes real time (a module imported for the first time, which the bundler may have to transform): the
 * first query after it has to be a `findBy*`, which retries until the page is there.
 */
export const renderAndSettle = (ui: ReactElement) => act(async () => render(ui))

/** `renderInSite` for what suspends while it loads: see {@link renderAndSettle}. */
export const renderInSiteAndSettle = (ui: ReactElement, options?: RenderOptions) => renderAndSettle(inSite(ui, options))
