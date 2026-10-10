import { useEffect, useRef, useState } from 'react'
import { useIntl } from 'react-intl'
import { Link, useLocation } from 'react-router'
import { productName } from '../../brand'
import { sectionPaths } from '../../routes'
import { LazySearchDialog } from '../../search/LazySearchDialog'
import { SearchTrigger } from '../../search/SearchTrigger'
import { useSearchShortcut } from '../../search/useSearchShortcut'
import { Drawer } from '../Drawer'
import { GitHubLink } from '../GitHubLink'
import { LanguageSwitcher } from '../LanguageSwitcher'
import { ThemeSwitcher } from '../ThemeSwitcher'
import { documentationCurrent, documentationEntryPath } from '../navigation'
import styles from './TopNav.module.css'

/**
 * The top bar: the wordmark, Documentation (highlighted across its whole section), the search, the theme, GitHub, the
 * language and, on narrow screens, the menu, which holds the links and both choices, and the search again. It also owns
 * the search, which opens from either button and from Ctrl+K or ⌘+K and is fetched the first time it does.
 */
export function TopNav() {
  const intl = useIntl()
  const { pathname } = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  // The page the search was opened on, or none. Going to another page closes it, which matters while its chunk is still
  // on the way: it must not open over a page the person has left. This is state adjusted while rendering, not an effect,
  // so there is no frame with the search open on the new page.
  const [searchPath, setSearchPath] = useState<string | null>(null)
  if (searchPath !== null && searchPath !== pathname) setSearchPath(null)
  const searchOpen = searchPath !== null
  const wordmarkRef = useRef<HTMLAnchorElement>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const searchButtonRef = useRef<HTMLButtonElement>(null)
  const searchClosedByUser = useRef(false)

  // The menu closes first, so that the search is not stacked on top of it and a page that is chosen is not left behind it.
  function openSearch() {
    setMenuOpen(false)
    setSearchPath(pathname)
  }
  useSearchShortcut(openSearch)

  function handleSearchClose() {
    searchClosedByUser.current = true
    setSearchPath(null)
  }

  // The search gives focus back to what had it when it opened. When that was the page itself (the shortcut pressed with
  // nothing focused) or a control that is gone, such as the one of the menu, focus would fall to the body: the nearest
  // control of the bar that is on screen takes it instead. It runs here, after the dialog has closed and the page is no
  // longer inert, and not in the handler, where it would not.
  useEffect(() => {
    if (searchOpen || !searchClosedByUser.current) return
    searchClosedByUser.current = false
    if (document.activeElement !== document.body) return
    const onScreen = [searchButtonRef.current, menuButtonRef.current, wordmarkRef.current].find(
      (control) => control !== null && getComputedStyle(control).display !== 'none',
    )
    onScreen?.focus()
  }, [searchOpen])

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
        <SearchTrigger ref={searchButtonRef} className={styles.search} collapsible onClick={openSearch} />
        <ThemeSwitcher className={styles.switcher} />
        <GitHubLink className={styles.github} />
        <LanguageSwitcher className={styles.switcher} />
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
        <Drawer open={menuOpen} onClose={handleDrawerClose} onSearch={openSearch} />
        <LazySearchDialog open={searchOpen} onClose={handleSearchClose} />
      </div>
    </header>
  )
}
