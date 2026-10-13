import { cx } from '../../lib/cx.js'
import styles from './Button.module.css'

/** The visual weights a button can take. */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

/**
 * The heights a button can take. `default` is `--button-height` (42 px) and `compact` is `--button-height-compact`
 * (36 px). Below 768 px both are `--touch-target`, so a compact button never falls under the package's touch minimum.
 */
export type ButtonSize = 'default' | 'compact'

/** The options that decide how a button looks, shared by `Button` and by `buttonClassName`. */
export interface ButtonStyleOptions {
  /** Visual weight of the button. Defaults to `primary`. */
  variant?: ButtonVariant
  /** Height of the button. Defaults to `default`. */
  size?: ButtonSize
  /** Makes the button fill the width of its container. Defaults to `false`. */
  block?: boolean
  /** Extra class names, added after the library's own. */
  className?: string
}

/**
 * Returns the class names of a button, for an element that is not a `Button` but must look like one, such as a link.
 *
 * The result only styles the element: a link keeps its own semantics and its own keyboard behavior.
 */
export function buttonClassName({
  variant = 'primary',
  size = 'default',
  block = false,
  className,
}: ButtonStyleOptions = {}) {
  // `default` adds no class: the markup of a button without `size` is the one it had before the option existed.
  return cx(styles.button, styles[variant], size === 'compact' && styles.compact, block && styles.block, className)
}
