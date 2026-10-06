/// <reference types="vite/client" />
import type { ComponentProps, ReactNode } from 'react'
import { cx } from '../../lib/cx.js'
import { Field } from '../Field/Field.js'
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
  /** Class name of the field container; `className` is applied to the input. */
  fieldClassName?: string
}

/** A native text input with its label, hint and error. `disabled` and `readOnly` are different states. */
export function Input({ label, hint, error, id, fieldClassName, className, ...props }: InputProps) {
  return (
    <Field
      label={label}
      hint={hint}
      error={error}
      id={id}
      describedBy={props['aria-describedby']}
      className={fieldClassName}
    >
      {(control) => <input className={cx(controlStyles.control, className)} {...props} {...control} />}
    </Field>
  )
}
