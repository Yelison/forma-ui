import { Button } from '@yelison/forma-ui'
import { useEffect, useRef } from 'react'
import { useIntl } from 'react-intl'
import { reloadPage } from '../../errors/reloadPage'
import { SearchNotice } from '../SearchNotice'

export interface SearchLoadErrorProps {
  /** Called when the person closes the notice and goes on without the search. */
  onDismiss: () => void
}

/**
 * What stands in for the search dialog when its chunk could not be fetched. The top bar is outside the boundary of the
 * routes, so without this the failure would take the whole app with it. It is an alert, and focus goes to its first
 * button, as it would into the dialog it stands in for: the person asked for something and is told, where they are,
 * what happened. Retry reloads the page, for the reason `reloadPage` gives. Escape dismisses it, as it would the dialog.
 */
export function SearchLoadError({ onDismiss }: SearchLoadErrorProps) {
  const intl = useIntl()
  const retryRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    retryRef.current?.focus()
  }, [])

  return (
    <SearchNotice
      role="alert"
      onKeyDown={(event) => {
        if (event.key === 'Escape') onDismiss()
      }}
    >
      {intl.formatMessage({ id: 'search.loadFailed' })}
      <Button ref={retryRef} onClick={reloadPage}>
        {intl.formatMessage({ id: 'app.retry' })}
      </Button>
      <Button variant="secondary" onClick={onDismiss}>
        {intl.formatMessage({ id: 'app.dismiss' })}
      </Button>
    </SearchNotice>
  )
}
