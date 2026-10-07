import { useId, useRef, useState, type ToggleEvent } from 'react'
import styles from './PopoverSwitcher.module.css'

/** One choice of a switcher. */
export interface SwitcherOption<Value extends string> {
  /** The value this option stands for, passed to `onChange`. */
  value: Value
  /** What the option and, while it is the one in use, the button say. */
  label: string
  /** The language of the label, when it is not the one of the page: each language names itself. */
  lang?: string
}

export interface PopoverSwitcherProps<Value extends string> {
  /** The class that places the switcher: the top bar and the drawer each have their own. */
  className?: string
  /** The name of the button. It also says what the switcher is for, and its words include the visible label. */
  triggerLabel: string
  /** The name of the list of options. */
  listLabel: string
  /** Every option, in the order of the list. */
  options: readonly SwitcherOption<Value>[]
  /** The option in use. */
  value: Value
  /** Called with the option chosen, unless it is the one in use. */
  onChange: (value: Value) => void
  /** What the live region says after a change made here, written for the option in use. */
  announcement: string
  /**
   * What the live region says instead while there is something to tell that is not a change: a choice that could not
   * be applied. Leave it out, or empty, for the region to say only the announcement.
   */
  notice?: string
}

/**
 * A button that shows the option in use and opens a short list of every option, the shared body of the language and
 * theme switchers. The list is a popover, so the browser draws it above the page and closes it on Escape or on a click
 * outside, and gives focus back to the button. A choice applies at once, and the change is said in a live region of its
 * own: the drawer is a modal dialog, which leaves the rest of the page inert, so a region that is out of the dialog
 * would not be heard.
 */
export function PopoverSwitcher<Value extends string>({
  className,
  triggerLabel,
  listLabel,
  options,
  value,
  onChange,
  announcement,
  notice,
}: PopoverSwitcherProps<Value>) {
  const listId = useId()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const currentRef = useRef<HTMLButtonElement>(null)
  // Whether a pointer is pressed on the switcher. A ref: nothing on screen depends on it.
  const pressedRef = useRef(false)
  const [open, setOpen] = useState(false)
  // The option this switcher last changed the page to. It only counts while it is still the one in use: once another
  // switcher changes it, this one's words are stale, and must go so that saying them again is a change.
  const [announced, setAnnounced] = useState<Value | null>(null)
  // The option and the words of the last render. Words that change while the option does not are the same news said in
  // another language (the page changed language after this switcher spoke): a screen reader would hear a change that
  // did not happen, so they go too. Comparing with the last render, and not in an effect, keeps it to one render.
  const [previous, setPrevious] = useState({ value, announcement })
  if (previous.value !== value || previous.announcement !== announcement) {
    setPrevious({ value, announcement })
    if (previous.value === value) setAnnounced(null)
  }

  const current = options.find((option) => option.value === value)

  function choose(next: Value) {
    if (next === value) return
    onChange(next)
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
    // A keyboard user who opened the list starts in it, on the option in use.
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
        aria-label={triggerLabel}
      >
        <span lang={current?.lang}>{current?.label}</span>
        <span aria-hidden="true">▾</span>
      </button>
      <ul
        id={listId}
        popover="auto"
        className={styles.list}
        aria-label={listLabel}
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
        {options.map((option) => (
          <li key={option.value}>
            <button
              ref={option.value === value ? currentRef : undefined}
              type="button"
              lang={option.lang}
              className={styles.option}
              aria-current={option.value === value ? 'true' : undefined}
              popoverTarget={listId}
              popoverTargetAction="hide"
              onClick={() => choose(option.value)}
            >
              {option.label}
              {/* The option in use is marked by more than color. */}
              {option.value === value && <span aria-hidden="true">✓</span>}
            </button>
          </li>
        ))}
      </ul>
      <span role="status" className="forma-visually-hidden">
        {notice || (announced === value ? announcement : '')}
      </span>
    </div>
  )
}
