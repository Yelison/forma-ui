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
   * Error message; marks the control as invalid and describes it. It is announced when it appears, unless `announce`
   * says otherwise. It is the only thing that sets `aria-invalid`: a consumer value for that attribute is overwritten.
   */
  error?: ReactNode
  /**
   * Whether the error is announced when it appears. `'assertive'`, the default, renders it with `role="alert"`, so a
   * screen reader interrupts to read it: right for a real form, where the error answers what the user just did.
   *
   * `'off'` renders plain text: nothing is announced, and the control stays invalid and described by the error.
   * Use it where an error is shown without anyone having caused it, such as a documentation specimen or a
   * catalogue that mounts several invalid fields on load. Do not use it in a form that people fill in: they would
   * not hear that their input was rejected.
   */
  announce?: 'assertive' | 'off'
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
export function Field({
  label,
  hint,
  error,
  announce = 'assertive',
  id,
  describedBy: extraDescribedBy,
  className,
  children,
}: FieldProps) {
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
        // Only an explicit 'off' silences it: a value that is not in the type, from untyped code, must not make a real
        // form stop announcing its errors without a sign.
        <p id={errorId} className={styles.error} role={announce === 'off' ? undefined : 'alert'}>
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
