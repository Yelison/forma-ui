import type { ComponentProps, ReactNode } from 'react'
import { cx } from '../../lib/cx.js'
import choice from '../shared/choice.module.css'
import styles from './Radio.module.css'

/**
 * The props of {@link Radio}: every native `input` attribute except `type` and `children`, plus the label. They go to
 * the `input`, with one exception: `className` goes to the `label`, which is the element that holds the box and the
 * text.
 */
export interface RadioProps extends Omit<ComponentProps<'input'>, 'type' | 'children'> {
  /** The text of the option. It is the accessible name of the radio, and a click on it selects the option. */
  label: ReactNode
}

/**
 * One option of a group of radios, on a native `<input type="radio">` inside its `<label>`.
 *
 * A group is several `Radio`s with the same `name`, inside a `<fieldset>` whose `<legend>` says what the group
 * chooses: the browser then moves between them with the arrow keys, checks the focused one and keeps one in the tab
 * order, and a screen reader announces the legend with each option. Control the group by giving each option `checked`
 * and `onChange`, or leave it uncontrolled with `defaultChecked` on the one that starts selected.
 *
 * `disabled` removes an option from the tab order and the arrow keys and dims it; it is for an option that is not
 * available. A native radio has no read-only state.
 */
export function Radio({ label, className, ...props }: RadioProps) {
  return (
    <label className={cx(choice.choice, className)}>
      <span className={choice.box}>
        <input {...props} type="radio" className={cx(choice.input, styles.input)} />
        <span className={cx(choice.mark, styles.dot)} aria-hidden="true" />
      </span>
      <span>{label}</span>
    </label>
  )
}
