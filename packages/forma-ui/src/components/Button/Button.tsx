import type { ComponentProps, MouseEvent, ReactNode } from 'react'
import { useFormaStrings } from '../../provider/index.js'
import { Icon, type IconName } from '../Icon/index.js'
import { buttonClassName, type ButtonStyleOptions } from './buttonClassName.js'
import styles from './Button.module.css'

/** Props of {@link Button}: the native `button` attributes plus the style options and the loading state. */
export interface ButtonProps extends ComponentProps<'button'>, ButtonStyleOptions {
  /** Icon shown before the content. A spinner takes its place while `loading`. */
  icon?: IconName
  /** Ignores clicks and shows `loadingLabel` in place of the content while an action runs. Defaults to `false`. */
  loading?: boolean
  /**
   * Content that replaces the button's own while `loading`, and so its accessible name. Without it the button shows
   * the `buttonLoading` string of the closest `FormaProvider`, or `Loading…` when there is none.
   */
  loadingLabel?: ReactNode
}

/**
 * A button for an action. `type` is `button` unless set, so a button inside a form does not submit it by accident.
 *
 * While `loading` the button stays focusable: it is `aria-disabled` and `aria-busy`, not `disabled`, because a
 * disabled button drops out of the tab order and a keyboard user would lose their place. Use `disabled` for an action
 * that is not available at all.
 */
export function Button({
  variant,
  block,
  className,
  icon,
  loading = false,
  loadingLabel,
  type = 'button',
  onClick,
  children,
  ...props
}: ButtonProps) {
  const { buttonLoading } = useFormaStrings()

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    if (loading) {
      // The button is not `disabled`, so a `type="submit"` one would still submit its form.
      event.preventDefault()
      return
    }
    onClick?.(event)
  }

  return (
    <button
      {...props}
      type={type}
      className={buttonClassName({ variant, block, className })}
      aria-busy={loading || props['aria-busy']}
      aria-disabled={loading || props['aria-disabled']}
      onClick={handleClick}
    >
      {loading ? <span className={styles.spinner} aria-hidden="true" /> : icon && <Icon name={icon} />}
      {loading ? (loadingLabel ?? buttonLoading) : children}
    </button>
  )
}
