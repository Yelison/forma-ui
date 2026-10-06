import { useRef, useState } from 'react'
import { useIntl } from 'react-intl'
import { Link, useLocation } from 'react-router'
import { productName } from '../../brand'
import { sectionPaths } from '../../routes'
import { Drawer } from '../Drawer'
import { GitHubLink } from '../GitHubLink'
import { documentationCurrent, documentationEntryPath } from '../navigation'
import styles from './TopNav.module.css'

/** The top bar: the wordmark, Documentation (highlighted across its whole section), GitHub and, on narrow screens, the menu. */
export function TopNav() {
  const intl = useIntl()
  const { pathname } = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const wordmarkRef = useRef<HTMLAnchorElement>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)

  function handleDrawerClose() {
    setMenuOpen(false)
    // Closing the drawer gives focus back to the menu button. When it closed because the window grew, the narrow
    // layout and the button are gone and focus would be dropped: the wordmark is the start of the bar, and is always there.
    if (menuButtonRef.current !== null && getComputedStyle(menuButtonRef.current).display === 'none') {
      wordmarkRef.current?.focus()
    }
  }

  return (
    <header className={styles.bar}>
      <div className={`site-column ${styles.inner}`}>
        <Link
          ref={wordmarkRef}
          to={sectionPaths.home}
          className={styles.wordmark}
          aria-label={intl.formatMessage({ id: 'nav.home' }, { product: productName })}
        >
          <span className={styles.mark} aria-hidden="true">
            F
          </span>
          {productName}
        </Link>
        <nav className={styles.links} aria-label={intl.formatMessage({ id: 'nav.primary' })}>
          <Link to={documentationEntryPath} className={styles.link} aria-current={documentationCurrent(pathname)}>
            {intl.formatMessage({ id: 'nav.docs' })}
          </Link>
        </nav>
        <GitHubLink className={styles.github} />
        <button
          ref={menuButtonRef}
          type="button"
          className={styles.menuButton}
          aria-label={intl.formatMessage({ id: 'nav.menu.open' })}
          aria-haspopup="dialog"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(true)}
        >
          <span aria-hidden="true">☰</span>
        </button>
        <Drawer open={menuOpen} onClose={handleDrawerClose} />
      </div>
    </header>
  )
}
