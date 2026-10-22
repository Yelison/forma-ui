import type { ReactNode } from 'react'
import type { IntlShape } from 'react-intl'
import type { MessageId } from '../../i18n'

/** What the samples of Disclosure say, in the language of the page: the same words on the live component and in its JSX. */
export interface DisclosureWords {
  /** A line of text with its details: the summary and what opens. */
  details: { summary: string; region: string }
  /** A controlled disclosure whose region has a button that closes it. */
  controlled: { summary: string; region: string; done: string }
  /** A disclosure that cannot be opened. */
  disabled: { summary: string; region: string }
  /** A folder: the summary of the section, its two documents and its menu of actions. */
  folder: {
    summary: string
    documents: readonly [string, string]
    menu: { label: string; rename: string; delete: string }
  }
  /** A row of the history whose sentence holds a link, so that the button is a part of the row. */
  burst: {
    /** The name of the document, which the live sentence turns into a link. */
    document: string
    /** The sentence, with `document` as the link that the live row draws. */
    sentence: (document: ReactNode) => ReactNode
    /** The same sentence as text, for the JSX that shows it, with `document` written as the element. */
    sentenceCode: (document: string) => string
    show: string
    /** The accessible name of the list. */
    list: string
    people: readonly [string, string]
  }
}

/** The words of the samples, from the catalogue of the page. */
export function disclosureWords(intl: IntlShape): DisclosureWords {
  const say = (id: MessageId) => intl.formatMessage({ id })
  return {
    details: {
      summary: say('catalog.sample.disclosure.details.summary'),
      region: say('catalog.sample.disclosure.details.region'),
    },
    controlled: {
      summary: say('catalog.sample.disclosure.controlled.summary'),
      region: say('catalog.sample.disclosure.controlled.region'),
      done: say('catalog.sample.disclosure.controlled.done'),
    },
    disabled: {
      summary: say('catalog.sample.disclosure.disabled.summary'),
      region: say('catalog.sample.disclosure.disabled.region'),
    },
    folder: {
      summary: say('catalog.sample.disclosure.folder.summary'),
      documents: [say('catalog.sample.disclosure.folder.first'), say('catalog.sample.disclosure.folder.second')],
      menu: {
        label: say('catalog.sample.disclosure.folder.menu.label'),
        rename: say('catalog.sample.disclosure.folder.menu.rename'),
        delete: say('catalog.sample.disclosure.folder.menu.delete'),
      },
    },
    burst: {
      document: say('catalog.sample.disclosure.burst.document'),
      sentence: (document) =>
        intl.formatMessage({ id: 'catalog.sample.disclosure.burst.sentence' }, { document, count: 4 }),
      sentenceCode: (document) =>
        intl.formatMessage({ id: 'catalog.sample.disclosure.burst.sentence' }, { document, count: 4 }),
      show: say('catalog.sample.disclosure.burst.show'),
      list: say('catalog.sample.disclosure.burst.list'),
      people: [say('catalog.sample.disclosure.burst.first'), say('catalog.sample.disclosure.burst.second')],
    },
  }
}
