import {
  Fragment,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { cx } from '../../lib/cx.js'
import { normalizeText } from '../../lib/normalizeText.js'
import type { Placement } from '../../lib/position.js'
import { useFloating } from '../../lib/useFloating.js'
import { Icon, type IconName } from '../Icon/Icon.js'
import { SearchField } from '../SearchField/SearchField.js'
import styles from './Menu.module.css'

/** One row of a {@link Menu}. */
export interface MenuItem {
  /** Stable identifier of the item. */
  id: string
  /** The text of the item, and its accessible name. */
  label: string
  /** Optional icon next to the text. */
  icon?: IconName
  /** Visual tone; `danger` marks a destructive action. */
  tone?: 'default' | 'danger'
  /** When `true` the item cannot be selected and the arrow keys skip it. It stays in the menu, announced as disabled. */
  disabled?: boolean
  /** A second, smaller line under the text (for example the role in each workspace). It describes the item. */
  description?: string
  /** Decorative content before the text (for example the initials box of a workspace). It is not part of the name. */
  leading?: ReactNode
  /**
   * Makes the item an option of a group: `true` is the chosen one and carries a check mark, `false` the others. The
   * role becomes `menuitemradio`, since one option of the group is chosen. Without it the item is a plain action.
   */
  checked?: boolean
  /** Draws a separator before the item. */
  separatorBefore?: boolean
  /** When `true` the search field of the menu (`search`) filters the item by its text. The other items are always shown. */
  searchable?: boolean
  /** The full name for the pointer, for when a long label is cut with "…". */
  title?: string
  /** Called when the item is selected, after the menu has closed and the focus is back on the trigger. */
  onSelect: () => void
}

/** The search field of a {@link Menu}. The library has no text of its own for it: both strings come from the application. */
export interface MenuSearch {
  /** Accessible name of the field, also its placeholder. */
  label: string
  /** What the menu says, in a live region, when no searchable item matches. */
  emptyText: string
}

/**
 * What {@link Menu} hands to its `children` render prop: spread all of it on the trigger element, a `Button`, an
 * `IconButton` or a `FilterChip` (which draws its chevron when it sees `aria-haspopup`).
 *
 * `ref`, `onClick` and `onKeyDown` replace the ones the element has: call your own handlers from inside the ones you
 * pass, and merge a ref yourself.
 */
export interface MenuTriggerProps {
  /** Registers the element that anchors the menu. */
  ref: (node: HTMLElement | null) => void
  /** Says that the trigger opens a menu. */
  'aria-haspopup': 'menu'
  /** Whether the menu is open. */
  'aria-expanded': boolean
  /** The id of the menu while it is open. */
  'aria-controls'?: string
  /** Opens or closes the menu. */
  onClick: (event: MouseEvent<HTMLElement>) => void
  /** Opens the menu with the down arrow (first item) or the up arrow (last item). */
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void
}

/** Props of {@link Menu}. */
export interface MenuProps {
  /** Accessible name of the menu. */
  label: string
  /** The items of the menu, in order. */
  items: MenuItem[]
  /** Where the menu goes relative to its trigger. It flips above when it does not fit below. Defaults to `bottom-end`. */
  placement?: Extract<Placement, 'bottom-start' | 'bottom-end'>
  /** A field to filter the `searchable` items. It sits above the list, outside the `role="menu"`. */
  search?: MenuSearch
  /** An explanation under the list; the menu takes it as its description (for example why some actions are disabled). */
  note?: string
  /** A wider menu, for rows with two lines. */
  wide?: boolean
  /** Receives the props of the trigger, which must be spread on the trigger element. */
  children: (trigger: MenuTriggerProps) => ReactNode
}

/**
 * A menu of actions that follows the ARIA menu button pattern: the arrow keys, `Home` and `End`, a first-letter jump,
 * `Escape` and `Tab`. It opens in a portal next to its trigger, inside the closest `<dialog>` when there is one, and
 * returns the focus to the trigger when it closes.
 *
 * An item that closes the menu (a selection, `Escape`, `Tab`) hands the focus back first, so it is never lost on the
 * page. Pressing outside closes it without moving the focus: it went where the person pressed.
 */
export function Menu({ label, items, placement = 'bottom-end', search, note, wide, children }: MenuProps) {
  const menuId = useId()
  const noteId = useId()
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [query, setQuery] = useState('')
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([])
  const searchRef = useRef<HTMLInputElement>(null)
  const { anchor, setAnchor, floating, setFloating, style, positioned, portalContainer } = useFloating<
    HTMLElement,
    HTMLDivElement
  >(open, placement)

  // The filter only touches the `searchable` items: the actions of the footer (for example "Your workspaces") stay.
  const needle = search ? normalizeText(query.trim()) : ''
  const visible = needle
    ? items.filter((item) => !item.searchable || normalizeText(item.label).includes(needle))
    : items
  const noMatches = search !== undefined && needle !== '' && !visible.some((item) => item.searchable)

  const enabledIndexes = visible.flatMap((item, index) => (item.disabled ? [] : [index]))

  const close = useCallback(
    (restoreFocus: boolean) => {
      setOpen(false)
      setQuery('')
      if (restoreFocus) anchor?.focus()
    },
    [anchor],
  )

  function openAt(edge: 'first' | 'last') {
    // With a chosen option (the current workspace) it opens on it, like a native group of options.
    const checked = edge === 'first' ? visible.findIndex((item) => item.checked && !item.disabled) : -1
    const index =
      checked >= 0 ? checked : edge === 'first' ? enabledIndexes[0] : enabledIndexes[enabledIndexes.length - 1]
    setActiveIndex(index ?? 0)
    setOpen(true)
  }

  const searchFocused = useRef(false)
  useEffect(() => {
    if (!open) searchFocused.current = false
    // The menu is hidden until it is placed, and a hidden element cannot take focus.
    if (!open || !positioned || document.activeElement === searchRef.current) return
    // With a search field the focus starts on it (that is what it is for); typing does not move it to the list.
    if (search && !searchFocused.current) {
      searchFocused.current = true
      searchRef.current?.focus()
      return
    }
    itemRefs.current[activeIndex]?.focus()
  }, [open, positioned, activeIndex, search])

  useEffect(() => {
    if (!open) return
    function onPointerDown(event: PointerEvent) {
      if (event.target instanceof Node && (floating?.contains(event.target) || anchor?.contains(event.target))) return
      close(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open, close, anchor, floating])

  // From the item that has the focus, which can be a disabled one that a click reached, to the next enabled item in that
  // direction, wrapping around at the ends.
  function move(step: 1 | -1) {
    const next =
      step === 1
        ? (enabledIndexes.find((index) => index > activeIndex) ?? enabledIndexes[0])
        : (enabledIndexes.findLast((index) => index < activeIndex) ?? enabledIndexes[enabledIndexes.length - 1])
    if (next !== undefined) setActiveIndex(next)
  }

  function onMenuKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    switch (event.key) {
      case 'ArrowDown':
        move(1)
        break
      case 'ArrowUp':
        move(-1)
        break
      case 'Home':
        setActiveIndex(enabledIndexes[0] ?? 0)
        break
      case 'End':
        setActiveIndex(enabledIndexes[enabledIndexes.length - 1] ?? 0)
        break
      case 'Escape':
        close(true)
        break
      case 'Tab':
        // The focus goes to the trigger first and the browser's own Tab moves on from there, so it lands on what follows
        // the trigger (or precedes it, with Shift) and not on `body`, where the portal would leave it.
        close(true)
        return
      default: {
        if (event.key.length !== 1 || event.ctrlKey || event.metaKey || event.altKey) return
        const letter = event.key.toLowerCase()
        const match = enabledIndexes.find((index) => visible[index]?.label.toLowerCase().startsWith(letter))
        if (match === undefined) return
        setActiveIndex(match)
      }
    }
    event.preventDefault()
  }

  // The search field is outside the `role="menu"`: a text field is not a menu item, and its letters would go to the
  // first-letter jump. The down arrow goes down to the list, `Escape` closes and `Tab` leaves.
  function onSearchKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'ArrowDown' && enabledIndexes.length > 0) {
      event.preventDefault()
      setActiveIndex(enabledIndexes[0] ?? 0)
      itemRefs.current[enabledIndexes[0] ?? 0]?.focus()
    } else if (event.key === 'Escape') {
      // `SearchField` takes the first `Escape` to clear its text and stops it there, so one that arrives here is on an
      // empty field. Preventing the default keeps a modal `<dialog>` around the menu from closing with it.
      event.preventDefault()
      close(true)
    } else if (event.key === 'Tab') {
      close(true)
    }
  }

  function select(item: MenuItem) {
    if (item.disabled) return
    close(true)
    item.onSelect()
  }

  return (
    <>
      {children({
        ref: setAnchor,
        'aria-haspopup': 'menu',
        'aria-expanded': open,
        'aria-controls': open ? menuId : undefined,
        onClick: () => (open ? close(false) : openAt('first')),
        onKeyDown: (event) => {
          if (event.key === 'ArrowDown') {
            event.preventDefault()
            openAt('first')
          } else if (event.key === 'ArrowUp') {
            event.preventDefault()
            openAt('last')
          }
        },
      })}
      {open &&
        createPortal(
          <div ref={setFloating} className={cx(styles.menu, wide && styles.wide)} style={style}>
            {search && (
              <div className={styles.search} onKeyDown={onSearchKeyDown}>
                <SearchField
                  ref={searchRef}
                  label={search.label}
                  placeholder={search.label}
                  value={query}
                  onValueChange={(value) => {
                    setQuery(value)
                    setActiveIndex(0)
                  }}
                />
              </div>
            )}
            <div
              id={menuId}
              role="menu"
              aria-label={label}
              aria-describedby={note ? noteId : undefined}
              className={styles.list}
              onKeyDown={onMenuKeyDown}
            >
              {visible.map((item, index) => {
                const labelId = `${menuId}-label-${index}`
                const descriptionId = `${menuId}-description-${index}`
                return (
                  <Fragment key={item.id}>
                    {item.separatorBefore && index > 0 && <div role="separator" className={styles.separator} />}
                    <button
                      ref={(node) => {
                        itemRefs.current[index] = node
                      }}
                      type="button"
                      role={item.checked === undefined ? 'menuitem' : 'menuitemradio'}
                      aria-checked={item.checked}
                      tabIndex={index === activeIndex ? 0 : -1}
                      aria-disabled={item.disabled || undefined}
                      // The name is the label alone: the second line describes the item, and a `leading` box is decoration.
                      aria-labelledby={labelId}
                      aria-describedby={item.description ? descriptionId : undefined}
                      title={item.title}
                      className={cx(
                        styles.item,
                        item.tone === 'danger' && styles.danger,
                        item.checked && styles.checked,
                      )}
                      onClick={() => select(item)}
                      // A click gives a disabled item the focus too: the arrows go on from where the focus is.
                      onFocus={() => setActiveIndex(index)}
                    >
                      {item.leading}
                      {item.icon && <Icon name={item.icon} />}
                      {item.description ? (
                        // Two lines: the label is cut with "…" when it is long (`title` has the whole name).
                        <span className={styles.text}>
                          <span id={labelId} className={styles.label}>
                            {item.label}
                          </span>
                          <span id={descriptionId} className={styles.description}>
                            {item.description}
                          </span>
                        </span>
                      ) : (
                        // One line: a long label wraps, as plain text in a button does.
                        <span id={labelId}>{item.label}</span>
                      )}
                      {item.checked && <Icon name="check" className={styles.mark} />}
                    </button>
                  </Fragment>
                )
              })}
            </div>
            {/* Mounted for as long as there is a search, and filled only when nothing matches: a live region that is born
                with its text is not announced, one that is filled is. */}
            {search && (
              <p role="status" className={styles.empty}>
                {noMatches ? search.emptyText : null}
              </p>
            )}
            {note && (
              <p id={noteId} className={styles.note}>
                {note}
              </p>
            )}
          </div>,
          portalContainer,
        )}
    </>
  )
}
