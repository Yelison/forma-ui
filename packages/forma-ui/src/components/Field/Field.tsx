/// <reference types="vite/client" />
import { useId, type ReactNode } from 'react'
import { cx } from '../../lib/cx.js'
import styles from './Field.module.css'

/** The props that bind a control to the label, hint and error of its {@link Field}. */
export interface FieldControlProps {
  /** Id that links the control to its label. */
  id: string
  /** Ids of the hint, the error and any other text that describes the control. */
  'aria-describedby'?: string
  /** `true` when there is an error; left undefined otherwise. */
  'aria-invalid'?: true
}

/** The props of {@link Field}. */
export interface FieldProps {
  /** Visible label of the control. */
  label: ReactNode
  /** Permanent help text under the control. */
  hint?: ReactNode
  /**
   * Error message; marks the control as invalid and is announced when it appears. It is the only thing that sets
   * `aria-invalid`: a consumer value for that attribute is overwritten.
   */
  error?: ReactNode
  /** Id of the control; one is generated when omitted. */
  id?: string
  /** Extra ids that describe the control, after the error and the hint. */
  describedBy?: string
  /** Class name of the field container. */
  className?: string
  /** Receives the linking props and returns the control. */
  children: (control: FieldControlProps) => ReactNode
}

/** A label, hint and error linked to a control through its id and `aria-describedby`. */
export function Field({ label, hint, error, id, describedBy: extraDescribedBy, className, children }: FieldProps) {
  const generatedId = useId()
  const controlId = id ?? generatedId
  const hintId = hint ? `${controlId}-hint` : undefined
  const errorId = error ? `${controlId}-error` : undefined
  // The error comes first so a screen reader announces what is wrong before the permanent help.
  const describedBy = [errorId, hintId, extraDescribedBy].filter(Boolean).join(' ') || undefined

  return (
    <div className={cx(styles.field, className)}>
      <label className={styles.label} htmlFor={controlId}>
        {label}
      </label>
      {children({
        id: controlId,
        'aria-describedby': describedBy,
        'aria-invalid': error ? true : undefined,
      })}
      {error && (
        <p id={errorId} className={styles.error} role="alert">
          {error}
        </p>
      )}
      {hint && (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}
    </div>
  )
}
