import type { MessageId } from './messages'

// Tells react-intl which ids exist, so `formatMessage({ id })` and `<FormattedMessage id>` fail the type check on a
// typo. The ids come from en.json, the source language.
declare global {
  namespace FormatjsIntl {
    interface Message {
      ids: MessageId
    }
  }
}
