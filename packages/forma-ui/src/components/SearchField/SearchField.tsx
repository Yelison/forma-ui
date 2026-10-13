import type { ComponentProps, KeyboardEvent } from 'react'
import { cx } from '../../lib/cx.js'
import { Field } from '../Field/Field.js'
import controlStyles from '../Field/control.module.css'
import { Icon } from '../Icon/Icon.js'
import styles from './SearchField.module.css'

/**
 * The props of {@link SearchField}: every native `input` attribute except `type`, `value` and `onChange`, which it
 * owns, plus the label, the value and its change handler.
 */
export interface SearchFieldProps extends Omit<ComponentProps<'input'>, 'type' | 'value' | 'onChange' | 'children'> {
  /** Accessible name of the field. A search box is named by its icon and placeholder for sighted people, so it is not drawn. */
  label: string
  /** The text of the search. The field is always controlled: it shows this value and nothing else. */
  value: string
  /** Called with the new text each time the person types, pastes or clears the field. */
  onValueChange: (value: string) => void
  /** Class name of the field container; `className` is applied to the input. */
  fieldClassName?: string
}

/**
 * A native `<input type="search">` with a magnifier, controlled by `value` and `onValueChange`. Its `label` names it
 * for screen readers and is not drawn: use it where the page already says what is searched.
 *
 * `Escape` clears a field that has text and goes no further: a search box inside a dialog or a popover empties first,
 * and only a second `Escape`, on an empty field, reaches what closes the dialog. The browser's own clear button is
 * hidden, since `Escape` does the same in every browser. A read-only field keeps its text on `Escape`, as it does when
 * typed into.
 */
export function SearchField({
  label,
  value,
  onValueChange,
  id,
  fieldClassName,
  className,
  onKeyDown,
  ...props
}: SearchFieldProps) {
  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape' && value && !props.readOnly) {
      event.preventDefault()
      event.stopPropagation()
      onValueChange('')
    }
    onKeyDown?.(event)
  }

  return (
    <Field label={label} hideLabel id={id} className={fieldClassName}>
      {(control) => (
        <div className={styles.wrapper}>
          <input
            {...control}
            // After the control, so that an `aria-invalid` or `aria-describedby` of the consumer is not replaced: a
            // search box has no hint or error of its own for the field to describe.
            {...props}
            type="search"
            className={cx(controlStyles.control, styles.input, className)}
            value={value}
            onChange={(event) => onValueChange(event.target.value)}
            onKeyDown={handleKeyDown}
          />
          <Icon name="search" className={styles.icon} />
        </div>
      )}
    </Field>
  )
}
