import { useIntl } from 'react-intl'
import type { CopyLabels } from '../../components/CodeBlock'

/** The words of the copy button in the language of the page. */
export function useCopyLabels(): CopyLabels {
  const intl = useIntl()
  return {
    action: intl.formatMessage({ id: 'guides.code.copy' }),
    success: intl.formatMessage({ id: 'guides.code.copied' }),
    failure: intl.formatMessage({ id: 'guides.code.copyFailed' }),
  }
}
