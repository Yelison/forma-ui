import { useEffect, useState } from 'react'
import { useIntl } from 'react-intl'
import { SearchNotice } from '../SearchNotice'
import styles from './SearchLoading.module.css'

// A search that arrives sooner than this is not worth a flash of text, or a screen reader interrupting itself.
const showAfterMilliseconds = 400

export interface SearchLoadingProps {
  /** Called when the person presses Escape: the search is cancelled, and it must not open when it arrives. */
  onCancel: () => void
}

/**
 * What stands in for the search dialog while its chunk is fetched: nothing for a moment, then a notice that is shown
 * and announced. The live region is on the page from the first render and the text goes into it later, since a region
 * that arrives together with its text is often not read.
 *
 * The dialog it stands in for closes on Escape, so this does too: the person who changed their mind must not get a
 * modal that takes focus later. The listener is on the document because nothing here has focus.
 */
export function SearchLoading({ onCancel }: SearchLoadingProps) {
  const intl = useIntl()
  const [slow, setSlow] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), showAfterMilliseconds)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !event.isComposing) onCancel()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onCancel])

  return (
    <div role="status" className={styles.region}>
      {slow && <SearchNotice>{intl.formatMessage({ id: 'search.loading' })}</SearchNotice>}
    </div>
  )
}
