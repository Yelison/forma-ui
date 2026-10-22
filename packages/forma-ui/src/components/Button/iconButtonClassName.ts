import { cx } from '../../lib/cx.js'
import styles from './IconButton.module.css'

/** The options that decide how an icon button looks, shared by `IconButton` and by `iconButtonClassName`. */
export interface IconButtonStyleOptions {
  /** Extra class names, added after the library's own. */
  className?: string
}

/**
 * Returns the class names of an icon button, for an element that is not an `IconButton` but must look like one, such as
 * a link.
 *
 * The result only styles the element: a link keeps its own semantics, and the caller must give it an accessible name,
 * such as an `aria-label`, because the icon has no text.
 */
export function iconButtonClassName({ className }: IconButtonStyleOptions = {}) {
  return cx(styles.iconButton, className)
}
