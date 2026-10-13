import type { ComponentProps, ReactNode } from 'react'
import { cx } from '../../lib/cx.js'
import { Field, type FieldProps } from '../Field/Field.js'
import controlStyles from '../Field/control.module.css'
import { Icon } from '../Icon/Icon.js'
import styles from './Select.module.css'

/** The props of {@link Select}: every native `select` attribute, plus the label, hint and error of its field. */
export interface SelectProps extends ComponentProps<'select'> {
  /** Visible label of the field. */
  label: ReactNode
  /** Permanent help text under the field. */
  hint?: ReactNode
  /**
   * Error message; marks the field as invalid. It is the only thing that sets `aria-invalid`: a consumer value for
   * that attribute is overwritten.
   */
  error?: ReactNode
  /**
   * Whether the error is announced when it appears: `'assertive'` (the default) as an alert, `'off'` not at all. Use
   * `'off'` for a specimen or a page that mounts fields with an error nobody caused, never in a form that people fill
   * in. The error describes the select in both cases. It is the `announce` of `Field`, which has the details.
   */
  announce?: FieldProps['announce']
  /** Class name of the field container; `className` is applied to the select. */
  fieldClassName?: string
}

/**
 * A native `<select>` with its label, hint and error, drawn like `Input` with a chevron. The browser keeps its
 * keyboard, its screen-reader behavior and, on a phone, its own picker. The options are its children, as in HTML.
 *
 * A select has no read-only state: `disabled` leaves the tab order and is not submitted. To make it unavailable for a
 * moment without taking its focus, such as while a change is saved, set `aria-disabled="true"`: it is dimmed and still
 * focusable, but it is up to you to ignore the changes it reports.
 */
export function Select({
  label,
  hint,
  error,
  announce,
  id,
  fieldClassName,
  className,
  children,
  ...props
}: SelectProps) {
  return (
    <Field
      label={label}
      hint={hint}
      error={error}
      announce={announce}
      id={id}
      describedBy={props['aria-describedby']}
      className={fieldClassName}
    >
      {(control) => (
        <div className={styles.wrapper}>
          <select className={cx(controlStyles.control, styles.select, className)} {...props} {...control}>
            {children}
          </select>
          <Icon name="chevron" className={styles.chevron} />
        </div>
      )}
    </Field>
  )
}
