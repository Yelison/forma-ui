import { Icon } from '@yelison/forma-ui'
import type { Ref } from 'react'
import { useIntl } from 'react-intl'
import { searchShortcut } from '../shortcut'
import styles from './SearchTrigger.module.css'

export interface SearchTriggerProps {
  /** Opens the search. */
  onClick: () => void
  /** Whether to print the shortcut. A touch screen has no keyboard to press it with, so the drawer leaves it out. */
  showShortcut?: boolean
  /**
   * Shows only the icon below 1024 px, where the top bar has no room for the words: the name stays, for assistive
   * technology. Defaults to `false`.
   */
  collapsible?: boolean
  /** The class that places the trigger: the top bar and the drawer each have their own. */
  className?: string
  ref?: Ref<HTMLButtonElement>
}

/** The button that opens the search, with the shortcut of the platform printed on it. */
export function SearchTrigger({
  onClick,
  showShortcut = true,
  collapsible = false,
  className,
  ref,
}: SearchTriggerProps) {
  const intl = useIntl()
  const { modifier, keyShortcuts } = searchShortcut()
  const name = intl.formatMessage({ id: 'search.trigger' })

  return (
    <button
      ref={ref}
      type="button"
      className={[styles.trigger, collapsible && styles.collapsible, className].filter(Boolean).join(' ')}
      // The words are not shown when the bar is short of room: the name is then what says what the button does.
      aria-label={name}
      aria-haspopup="dialog"
      aria-keyshortcuts={keyShortcuts}
      onClick={onClick}
    >
      <Icon name="search" size={16} />
      <span className={styles.label}>{name}</span>
      {showShortcut && (
        <kbd className={styles.shortcut} aria-hidden="true">
          {modifier} K
        </kbd>
      )}
    </button>
  )
}
