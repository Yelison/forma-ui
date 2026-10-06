/// <reference types="vite/client" />
import type { ComponentProps } from 'react'
import { cx } from '../../lib/cx.js'
import styles from './Badge.module.css'

/** The color roles a badge can take. */
export type BadgeTone = 'blue' | 'green' | 'amber' | 'red' | 'neutral'

/** Props of {@link Badge}: the native `span` attributes plus the tone. */
export interface BadgeProps extends ComponentProps<'span'> {
  /** Color of the badge. Defaults to `neutral`. */
  tone?: BadgeTone
}

/**
 * A short label that tags an item with a status or category.
 *
 * The tone only colors the badge: its text must say the same thing, because color alone does not convey meaning.
 */
export function Badge({ tone = 'neutral', className, ...props }: BadgeProps) {
  return <span className={cx(styles.badge, styles[tone], className)} {...props} />
}
