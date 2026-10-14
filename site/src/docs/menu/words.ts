import type { IntlShape } from 'react-intl'
import type { MessageId } from '../../i18n'

/** What the samples of Menu say, in the language of the page: the same words on the live menu and in its JSX. */
export interface MenuWords {
  /** The accessible name of the menu of ticket actions, and of its trigger button. */
  label: string
  trigger: string
  /** The name of the trigger that is an icon. */
  more: string
  assign: string
  priority: string
  resolve: string
  archive: string
  delete: string
  note: string
  workspace: {
    label: string
    trigger: string
    search: string
    empty: string
    all: string
    admin: string
    agent: string
    /** The names of the workspaces: the first is the current one. */
    names: readonly [string, string, string]
  }
  status: {
    label: string
    /** The options of the filter, the first one meaning «no filter». */
    options: readonly [string, string, string]
  }
}

/** The words of the samples, from the catalogue of the page. */
export function menuWords(intl: IntlShape): MenuWords {
  const say = (id: MessageId) => intl.formatMessage({ id })
  return {
    label: say('catalog.sample.menu.label'),
    trigger: say('catalog.sample.menu.trigger'),
    more: say('catalog.sample.menu.more'),
    assign: say('catalog.sample.menu.assign'),
    priority: say('catalog.sample.menu.priority'),
    resolve: say('catalog.sample.menu.resolve'),
    archive: say('catalog.sample.menu.archive'),
    delete: say('catalog.sample.menu.delete'),
    note: say('catalog.sample.menu.note'),
    workspace: {
      label: say('catalog.sample.menu.workspace.label'),
      trigger: say('catalog.sample.menu.workspace.trigger'),
      search: say('catalog.sample.menu.workspace.search'),
      empty: say('catalog.sample.menu.workspace.empty'),
      all: say('catalog.sample.menu.workspace.all'),
      admin: say('catalog.sample.menu.workspace.admin'),
      agent: say('catalog.sample.menu.workspace.agent'),
      names: [
        say('catalog.sample.menu.workspace.acme'),
        say('catalog.sample.menu.workspace.northwind'),
        say('catalog.sample.menu.workspace.lumen'),
      ],
    },
    status: {
      label: say('catalog.sample.status.title'),
      options: [
        say('catalog.sample.status.all'),
        say('catalog.sample.status.open'),
        say('catalog.sample.status.closed'),
      ],
    },
  }
}
