import type { ComponentProps } from 'react'
import { cx } from '../../lib/cx.js'
import { Icon } from '../Icon/Icon.js'
import styles from './FilterChip.module.css'

/**
 * The props of {@link FilterChip}: every native `button` attribute except `aria-pressed`, which the chip owns: it comes
 * from `selected`, so that the state has one source.
 */
export interface FilterChipProps extends Omit<ComponentProps<'button'>, 'aria-pressed'> {
  /**
   * Marks the filter as applied. On a chip that opens something (`aria-haspopup`) it only changes how the chip looks, so
   * its label must carry the value, such as "Status: Open". On any other chip it is also the toggle state, announced as
   * pressed.
   */
  selected?: boolean
}

// `aria-haspopup` is `false` by default and for the string "false"; every other value (`menu`, `listbox`, `dialog`,
// `tree`, `grid`, `true`) says that the button opens something.
function opensPopup(value: FilterChipProps['aria-haspopup']): boolean {
  return value !== undefined && value !== false && value !== 'false'
}

/**
 * A filter control that comes in two modes, chosen by `aria-haspopup`.
 *
 * With `aria-haspopup` it is the trigger of the options of a filter, drawn with a chevron: the application opens them
 * (give it `aria-expanded` too), and `selected` says that a value is applied. No `aria-pressed` is added, since a
 * button that opens something is not a toggle.
 *
 * Without it, it is a toggle button with `aria-pressed` taken from `selected`, and no chevron. A row of them is a
 * single-choice filter without panels: put them in a `role="group"` that has an accessible name, and keep which one is
 * `selected` in the state of the application.
 */
export function FilterChip({ selected = false, className, children, type = 'button', ...props }: FilterChipProps) {
  const popup = opensPopup(props['aria-haspopup'])
  return (
    <button
      type={type}
      className={cx(styles.chip, selected && styles.selected, className)}
      {...props}
      // After the spread: a value that reaches the chip at run time, past the type, does not become a second source.
      aria-pressed={popup ? undefined : selected}
    >
      {children}
      {popup && <Icon name="chevron" className={styles.chevron} />}
    </button>
  )
}
