import type { ComponentProps } from 'react'
import { cx } from '../../lib/cx.js'
import { Icon, type IconName } from '../Icon/index.js'
import styles from './IconButton.module.css'

/** Props of {@link IconButton}: the native `button` attributes, without `children`, plus the icon and its name. */
export interface IconButtonProps extends Omit<ComponentProps<'button'>, 'children'> {
  /** The icon to draw, or several to draw side by side, overlapping, as one glyph, such as a double arrow. */
  icon: IconName | readonly IconName[]
  /** Mirrors the icon horizontally, so one drawing serves two directions. Defaults to `false`. */
  flip?: boolean
  /** The accessible name. Required: the button has no visible text, so without it a screen reader has nothing to say. */
  label: string
}

/**
 * A square button that holds only an icon. `type` is `button` unless set.
 *
 * `label` names the button for screen readers; show it as a tooltip too, so that sighted users can read it.
 */
export function IconButton({ icon, flip = false, label, className, type = 'button', ...props }: IconButtonProps) {
  const names = typeof icon === 'string' ? [icon] : icon

  return (
    <button {...props} type={type} aria-label={label} className={cx(styles.iconButton, className)}>
      <span className={cx(styles.icons, flip && styles.flip)}>
        {/* The names can repeat (a double arrow), and the list never reorders: the position is its identity. */}
        {names.map((name, position) => (
          <Icon key={position} name={name} />
        ))}
      </span>
    </button>
  )
}
