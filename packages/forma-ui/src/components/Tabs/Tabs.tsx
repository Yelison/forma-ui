import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import styles from './Tabs.module.css'

/** One tab of {@link Tabs} and the panel it controls. */
export interface TabItem {
  /** Identifies the tab. It is the value that `value`, `defaultValue` and `onChange` use, and it must be unique. */
  id: string
  /** The content of the tab's button. Keep it to text and icons: the arrow keys are handled for the whole tab list. */
  label: ReactNode
  /** The content of the panel. Only the panel of the selected tab renders it. */
  content: ReactNode
}

/** Props of {@link Tabs}. */
export interface TabsProps {
  /** The accessible name of the tab list, which says what the tabs switch between. */
  label: string
  /** The tabs, in order, each with its panel. */
  items: TabItem[]
  /** The selected tab, which makes the component controlled: it changes only when this prop does. */
  value?: string
  /** The tab that starts selected when `value` is not set. Defaults to the first one. */
  defaultValue?: string
  /** Called with the `id` of the tab the user selects, by click or with the keyboard. */
  onChange?: (id: string) => void
  /** Extra class names for the element that wraps the tab list and the panels. */
  className?: string
}

/**
 * Tabs that show one panel at a time, following the ARIA tabs pattern. The arrow keys move between the tabs and wrap
 * around, `Home` and `End` go to the first and the last, and only the selected tab is in the tab order: `Tab` leaves
 * the list for the panel.
 *
 * The activation is automatic: moving to a tab with the keyboard selects it and calls `onChange`, so the panel matches
 * the focused tab. The exception is a controlled parent that refuses the change: the focus still goes to the tab, and
 * the selection stays where it was. Use it when showing a panel is cheap; a panel that is slow to load is better served
 * by a control that waits for `Enter`.
 *
 * It is controlled when `value` is set and uncontrolled otherwise. A `value` that matches no tab selects the first
 * one, so the list is never left without a selected tab.
 */
export function Tabs({ label, items, value, defaultValue, onChange, className }: TabsProps) {
  const baseId = useId()
  const [internalValue, setInternalValue] = useState(defaultValue ?? items[0]?.id)
  const requested = value ?? internalValue
  const selected = items.some((item) => item.id === requested) ? requested : items[0]?.id
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  function select(index: number) {
    const item = items[index]
    if (!item) return
    setInternalValue(item.id)
    onChange?.(item.id)
    tabRefs.current[index]?.focus()
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    // A shortcut of the browser or the system, such as Alt+ArrowLeft for «back», is not ours to take.
    if (event.altKey || event.ctrlKey || event.metaKey) return
    const current = items.findIndex((item) => item.id === selected)
    const last = items.length - 1
    const next = {
      ArrowRight: current === last ? 0 : current + 1,
      ArrowLeft: current === 0 ? last : current - 1,
      Home: 0,
      End: last,
    }[event.key]
    if (next === undefined) return
    event.preventDefault()
    select(next)
  }

  return (
    <div className={className}>
      <div role="tablist" aria-label={label} className={styles.list} onKeyDown={onKeyDown}>
        {items.map((item, index) => {
          const isSelected = item.id === selected
          return (
            <button
              key={item.id}
              ref={(node) => {
                tabRefs.current[index] = node
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${item.id}`}
              aria-selected={isSelected}
              aria-controls={`${baseId}-panel-${item.id}`}
              tabIndex={isSelected ? 0 : -1}
              className={styles.tab}
              onClick={() => select(index)}
            >
              {item.label}
            </button>
          )
        })}
      </div>
      {items.map((item) => (
        <div
          key={item.id}
          role="tabpanel"
          id={`${baseId}-panel-${item.id}`}
          aria-labelledby={`${baseId}-tab-${item.id}`}
          // The panel is the next stop after the tab list, so a keyboard user can scroll it and a screen reader can
          // reach its content even when it holds nothing focusable.
          tabIndex={0}
          hidden={item.id !== selected}
          className={styles.panel}
        >
          {item.id === selected && item.content}
        </div>
      ))}
    </div>
  )
}
