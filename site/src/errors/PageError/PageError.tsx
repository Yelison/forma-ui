import { Button } from '@yelison/forma-ui'
import { useEffect, useRef } from 'react'
import { useIntl } from 'react-intl'
import { DocumentHead } from '../../head'
import styles from './PageError.module.css'

export interface PageErrorProps {
  /** Called when the person asks to try again. */
  onRetry: () => void
}

/**
 * What the content area shows when its page could not be loaded: the top bar, the menu and the footer stay as they are.
 * Focus goes to the heading, which is what announces the failure to a screen reader (a live region around it would
 * read it twice) and starts a keyboard user next to the button. It has the height of a page, and the document head says
 * it too, so the tab does not keep the title of the page that was left.
 */
export function PageError({ onRetry }: PageErrorProps) {
  const intl = useIntl()
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  const description = intl.formatMessage({ id: 'pageError.description' })

  return (
    <div className={styles.error}>
      <DocumentHead title={intl.formatMessage({ id: 'pageError.title' })} description={description} />
      <h1 ref={headingRef} tabIndex={-1} className={styles.heading}>
        {intl.formatMessage({ id: 'pageError.heading' })}
      </h1>
      <p className={styles.description}>{description}</p>
      <Button onClick={onRetry}>{intl.formatMessage({ id: 'app.retry' })}</Button>
    </div>
  )
}
