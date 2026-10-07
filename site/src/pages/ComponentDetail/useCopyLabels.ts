import { useIntl } from 'react-intl'
import type { CopyLabels } from '../../components/CodeBlock'

/** The words of the copy button in the language of the page. */
export function useCopyLabels(): CopyLabels {
  const intl = useIntl()
  return {
    action: intl.formatMessage({ id: 'detail.code.copy' }),
    success: intl.formatMessage({ id: 'detail.code.copied' }),
    failure: intl.formatMessage({ id: 'detail.code.copyFailed' }),
  }
}
