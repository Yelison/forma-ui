import styles from './PagePending.module.css'

/**
 * What the content area shows while the page of a route loads on demand: nothing to read, and the height of a screen.
 * The footer then starts below the fold, so it does not move into view when the page arrives and takes its height.
 */
export function PagePending() {
  return <div className={styles.pending} aria-hidden="true" />
}
