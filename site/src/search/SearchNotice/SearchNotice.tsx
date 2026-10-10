import type { ComponentProps } from 'react'
import styles from './SearchNotice.module.css'

/**
 * The frame of what the search says while its dialog is not there: that it is on its way, or that it did not come.
 * The caller chooses the live region, because a loading notice has to be inside one that was already on the page.
 */
export function SearchNotice({ children, ...props }: ComponentProps<'div'>) {
  return (
    <div {...props} className={styles.notice}>
      {children}
    </div>
  )
}
