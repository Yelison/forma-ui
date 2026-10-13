import type { ComponentProps } from 'react'
import { cx } from '../../lib/cx.js'
import styles from './Badge.module.css'

/** The color roles a badge can take. */
export type BadgeTone = 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'neutral'

/** Props of {@link Badge}: the native `span` attributes plus the tone and the shape. */
export interface BadgeProps extends ComponentProps<'span'> {
  /** Color of the badge. Defaults to `neutral`. */
  tone?: BadgeTone
  /** Outline of the badge: `default` has the corners of a control. `pill` rounds the ends completely and keeps the height. Defaults to `default`. */
  shape?: 'default' | 'pill'
}

/**
 * A short label that tags an item with a status or category.
 *
 * The tone only colors the badge: its text must say the same thing, because color alone does not convey meaning.
 */
export function Badge({ tone = 'neutral', shape = 'default', className, ...props }: BadgeProps) {
  return <span className={cx(styles.badge, styles[tone], shape === 'pill' && styles.pill, className)} {...props} />
}
