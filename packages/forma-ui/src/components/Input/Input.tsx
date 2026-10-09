import type { ComponentProps, ReactNode } from 'react'
import { cx } from '../../lib/cx.js'
import { Field, type FieldProps } from '../Field/Field.js'
import controlStyles from '../Field/control.module.css'

/** The props of {@link Input}: every native `input` attribute, plus the label, hint and error of its field. */
export interface InputProps extends Omit<ComponentProps<'input'>, 'children'> {
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
   * in. The error describes the input in both cases. It is the `announce` of `Field`, which has the details.
   */
  announce?: FieldProps['announce']
  /** Class name of the field container; `className` is applied to the input. */
  fieldClassName?: string
}

/** A native text input with its label, hint and error. `disabled` and `readOnly` are different states. */
export function Input({ label, hint, error, announce, id, fieldClassName, className, ...props }: InputProps) {
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
      {(control) => <input className={cx(controlStyles.control, className)} {...props} {...control} />}
    </Field>
  )
}
