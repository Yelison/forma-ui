import type { ComponentProps, ReactNode } from 'react'
import { cx } from '../../lib/cx.js'
import type { BadgeTone } from '../Badge/index.js'
import styles from './Alert.module.css'

/** The color roles an alert can take: the four of {@link BadgeTone} that carry a meaning (information, success, warning, error). */
export type AlertTone = Extract<BadgeTone, 'blue' | 'green' | 'amber' | 'red'>

/** Props of {@link Alert}: the native `div` attributes, except `title`, which is the visible heading of the alert. */
export interface AlertProps extends Omit<ComponentProps<'div'>, 'title'> {
  /** Color of the alert. Defaults to `blue`. */
  tone?: AlertTone
  /** The heading of the alert, always visible. */
  title: ReactNode
  /**
   * Makes the alert a live region: `role="alert"` for the `red` tone and `role="status"` for the others. Use it only for
   * a message that appears after an action; one that is there when the page loads should not interrupt a screen reader.
   * Screen readers announce what changes inside a region that already exists, so keep the `Alert` mounted and change its
   * `title` and `children` when the message arrives. An `Alert` that is added to the page together with its message may
   * go unannounced, `status` ones above all. Defaults to `false`.
   */
  live?: boolean
}

/**
 * A message that stays on the page, with a heading and an optional body. The `children` are the body and can hold a
 * `Button` or a link for an action.
 *
 * The tone only colors it: the title must say the same thing, because color alone does not convey meaning.
 */
export function Alert({ tone = 'blue', title, live = false, className, children, ...props }: AlertProps) {
  const liveRole = tone === 'red' ? 'alert' : 'status'
  return (
    <div className={cx(styles.alert, styles[tone], className)} role={live ? liveRole : undefined} {...props}>
      <p className={styles.title}>{title}</p>
      {children && <div className={styles.body}>{children}</div>}
    </div>
  )
}
