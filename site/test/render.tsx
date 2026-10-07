import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { IntlProvider } from 'react-intl'
import { MemoryRouter } from 'react-router'
import { LocaleContext } from '../src/i18n/LocaleContext'
import { messages, type Locale, type MessageId } from '../src/i18n'

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

/**
 * Renders what the site renders around a page: its messages in a language, and a router at a path. The language is
 * fixed: a component that changes it is tested under the real `IntlRoot`.
 */
export function renderInSite(ui: ReactElement, { path = '/', locale = 'en', messages: override }: RenderOptions = {}) {
  return render(
    <IntlProvider locale={locale} messages={override ?? messages[locale]}>
      <LocaleContext value={{ locale, setLocale: () => {} }}>
        <MemoryRouter initialEntries={[path]}>{ui}</MemoryRouter>
      </LocaleContext>
    </IntlProvider>,
  )
}
