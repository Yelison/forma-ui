import type { ComponentProps } from 'react'
import { cx } from '../../lib/cx.js'
import { Icon } from '../Icon/Icon.js'
import { useDisclosureContext } from './context.js'
import styles from './Disclosure.module.css'

/**
 * Props of {@link DisclosureButton}: the native `button` attributes (`aria-describedby`, `aria-label`, `id`,
 * `disabled`…), except the ones the disclosure owns. Use `onOpenChange` of the disclosure instead of `onClick`.
 */
export interface DisclosureButtonProps extends Omit<
  ComponentProps<'button'>,
  'type' | 'aria-expanded' | 'aria-controls' | 'onClick' | 'ref'
> {
  /**
   * Which side of the summary the chevron goes: `end` for a line of text, `start` for the heading of a section.
   * Defaults to `end`.
   */
  chevron?: 'start' | 'end'
}

/**
 * The button that opens and closes its disclosure, with the chevron that turns when it opens. Its children are the
 * summary: text, or a row of nodes. They go inside a `button`, so they must not hold a link or another control.
 */
export function DisclosureButton({ chevron = 'end', className, children, ...props }: DisclosureButtonProps) {
  const { open, toggle, regionId, buttonRef } = useDisclosureContext('DisclosureButton')
  const icon = <Icon name="chevron" className={styles.chevron} />
  return (
    <button
      ref={buttonRef}
      className={cx(styles.button, className)}
      {...props}
      // After the spread: a value that reaches the button at run time, past the type, does not become a second source.
      type="button"
      aria-expanded={open}
      aria-controls={regionId}
      onClick={toggle}
    >
      {chevron === 'start' && icon}
      {children}
      {chevron === 'end' && icon}
    </button>
  )
}
