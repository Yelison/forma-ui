import { useEffect, useId, useRef } from 'react'
import { useIntl } from 'react-intl'
import { NavLink } from 'react-router'
import { documentationLinks } from '../navigation'
import { GitHubLink } from '../GitHubLink'
import { SearchTrigger } from '../../search/SearchTrigger'
import { LanguageSwitcher } from '../LanguageSwitcher'
import { ThemeSwitcher } from '../ThemeSwitcher'
import styles from './Drawer.module.css'

// From this width the top bar shows its own links and there is no menu button: an open drawer would have no way back.
const desktopQuery = '(min-width: 768px)'

export interface DrawerProps {
  /** Whether the drawer is open. */
  open: boolean
  /**
   * Called when the drawer has closed, whatever closed it: Escape, the close button, a click outside, a link, or the
   * window growing to desktop width. Set `open` to false in response.
   */
  onClose: () => void
  /**
   * Called when the search button of the menu is used. The parent closes the menu and opens the search: the search is
   * the parent's, so it is not stacked on top of the menu.
   */
  onSearch: () => void
}

/**
 * The navigation menu of narrow screens: a modal `<dialog>`, so the browser contains focus inside it, closes it on
 * Escape and gives focus back to the button that opened it. It closes itself whenever the user acts on it; `open` only
 * has to follow the `onClose` it receives.
 */
export function Drawer({ open, onClose, onSearch }: DrawerProps) {
  const intl = useIntl()
  const titleId = useId()
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog === null) return
    if (!open) {
      if (dialog.open) dialog.close()
      return
    }
    if (!dialog.open) dialog.showModal()

    const root = document.documentElement
    root.classList.add('forma-scroll-locked')
    const desktop = window.matchMedia(desktopQuery)
    const closeOnDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) dialog.close()
    }
    desktop.addEventListener('change', closeOnDesktop)

    // No dialog.close() here: React runs a cleanup and the effect again in development, and closing would tell the
    // parent to close for real.
    return () => {
      desktop.removeEventListener('change', closeOnDesktop)
      root.classList.remove('forma-scroll-locked')
    }
  }, [open])

  // Closing the dialog here, and not by setting `open`, gives focus back to the opener right away, before a navigation
  // moves it to the new page's heading.
  const close = () => dialogRef.current?.close()

  return (
    <dialog
      ref={dialogRef}
      className={styles.drawer}
      aria-labelledby={titleId}
      onClose={onClose}
      // The panel covers the dialog box, so a click that lands on the dialog itself is a click on the backdrop.
      onClick={(event) => {
        if (event.target === event.currentTarget) close()
      }}
    >
      <div className={styles.panel}>
        <div className={styles.header}>
          <h2 id={titleId} className={styles.title}>
            {intl.formatMessage({ id: 'drawer.title' })}
          </h2>
          <button
            type="button"
            className={styles.close}
            aria-label={intl.formatMessage({ id: 'drawer.close' })}
            onClick={close}
          >
            <span aria-hidden="true">✕</span>
          </button>
        </div>
        {/* A touch screen has no keyboard to press the shortcut on, so it is not printed here. */}
        <SearchTrigger className={styles.search} showShortcut={false} onClick={onSearch} />
        <nav aria-label={intl.formatMessage({ id: 'nav.docs' })}>
          <ul className={styles.list}>
            {documentationLinks.map(({ path, labelId }) => (
              <li key={path}>
                <NavLink to={path} end className={styles.link} onClick={close}>
                  {intl.formatMessage({ id: labelId })}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <GitHubLink className={styles.link} />
        <ThemeSwitcher />
        <LanguageSwitcher />
      </div>
    </dialog>
  )
}
