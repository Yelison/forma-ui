import { useId, useRef, useState, type ToggleEvent } from 'react'
import { useIntl } from 'react-intl'
import { localeNames, locales, useLocale, type Locale } from '../../i18n'
import styles from './LanguageSwitcher.module.css'

export interface LanguageSwitcherProps {
  /** The class that places the switcher: the top bar and the drawer each have their own. */
  className?: string
}

/**
 * The language of the site: a button that shows the language in use and opens a short list with every language, each
 * named in itself. The list is a popover, so the browser draws it above the page and closes it on Escape or on a click
 * outside, and gives focus back to the button. A choice applies at once, and the change is said in a live region of its
 * own: the drawer is a modal dialog, which leaves the rest of the page inert, so a region that is out of the dialog
 * would not be heard.
 */
export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const intl = useIntl()
  const { locale, setLocale } = useLocale()
  const listId = useId()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const currentRef = useRef<HTMLButtonElement>(null)
  // Whether a pointer is pressed on the switcher. A ref: nothing on screen depends on it.
  const pressedRef = useRef(false)
  const [open, setOpen] = useState(false)
  // The language this switcher last changed the page to. It only counts while it is still the language in use: once
  // another switcher changes it, this one's words are stale, and must go so that saying them again is a change.
  const [announced, setAnnounced] = useState<Locale | null>(null)

  function choose(next: Locale) {
    if (next === locale) return
    setLocale(next)
    setAnnounced(next)
  }

  // The press is over when the pointer is released or cancelled anywhere on the page: one that starts on the switcher
  // and ends outside it sends the switcher nothing.
  function markPressed() {
    pressedRef.current = true
    const done = new AbortController()
    const release = () => {
      pressedRef.current = false
      done.abort()
    }
    document.addEventListener('pointerup', release, { signal: done.signal })
    document.addEventListener('pointercancel', release, { signal: done.signal })
  }

  function handleToggle(event: ToggleEvent<HTMLUListElement>) {
    const isOpen = event.newState === 'open'
    setOpen(isOpen)
    // A keyboard user who opened the list starts in it, on the language in use.
    if (isOpen) currentRef.current?.focus()
  }

  return (
    <div
      className={className === undefined ? styles.switcher : `${styles.switcher} ${className}`}
      onPointerDown={markPressed}
    >
      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        popoverTarget={listId}
        aria-expanded={open}
        // The words on the button are part of its name, which also says what it is for.
        aria-label={intl.formatMessage({ id: 'language.trigger' })}
      >
        <span lang={locale}>{localeNames[locale]}</span>
        <span aria-hidden="true">▾</span>
      </button>
      <ul
        id={listId}
        popover="auto"
        className={styles.list}
        aria-label={intl.formatMessage({ id: 'language.label' })}
        onToggle={handleToggle}
        // Tab out of the list leaves it open over the page: close it, unless focus is on its way back to the button.
        // Where a press does not focus a button (WebKit, Firefox on macOS) the option that has focus loses it for no
        // element at all while a pointer is pressed, and the click that follows has to find the list open: that is the
        // only blur a press excuses. Tab names the element it goes to, so it still closes the list.
        onBlur={(event) => {
          const next = event.relatedTarget
          if (next === null && pressedRef.current) return
          if (next instanceof Node && (event.currentTarget.contains(next) || triggerRef.current?.contains(next))) return
          event.currentTarget.hidePopover()
        }}
      >
        {locales.map((code) => (
          <li key={code}>
            <button
              ref={code === locale ? currentRef : undefined}
              type="button"
              lang={code}
              className={styles.option}
              aria-current={code === locale ? 'true' : undefined}
              popoverTarget={listId}
              popoverTargetAction="hide"
              onClick={() => choose(code)}
            >
              {localeNames[code]}
              {/* The language in use is marked by more than color. */}
              {code === locale && <span aria-hidden="true">✓</span>}
            </button>
          </li>
        ))}
      </ul>
      <span role="status" className="forma-visually-hidden">
        {announced === locale ? intl.formatMessage({ id: 'language.changed' }) : ''}
      </span>
    </div>
  )
}
