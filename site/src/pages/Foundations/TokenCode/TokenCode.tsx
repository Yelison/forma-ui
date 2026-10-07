import type { ReactNode } from 'react'
import styles from './TokenCode.module.css'

export interface TokenCodeProps {
  children: ReactNode
  /**
   * Lets the text break anywhere, for a value as long as a font stack. A token name is never broken: half of
   * `--color-nav` is not a name, so it stays whole and its line wraps around it.
   */
  breakable?: boolean
}

/** A token name or value in code: the site's monospace face, with the line-breaking rule that fits what it holds. */
export function TokenCode({ children, breakable = false }: TokenCodeProps) {
  return <code className={breakable ? styles.breakable : styles.name}>{children}</code>
}
