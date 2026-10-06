import { cx } from '../../lib/cx.js'
import styles from './Button.module.css'

/** The visual weights a button can take. */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

/** The options that decide how a button looks, shared by `Button` and by `buttonClassName`. */
export interface ButtonStyleOptions {
  /** Visual weight of the button. Defaults to `primary`. */
  variant?: ButtonVariant
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
export function buttonClassName({ variant = 'primary', block = false, className }: ButtonStyleOptions = {}) {
  return cx(styles.button, styles[variant], block && styles.block, className)
}
