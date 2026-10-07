import { Field, Input } from '@yelison/forma-ui'
import type { IntlShape } from 'react-intl'
import type { MessageId } from '../../i18n'
import { attribute, selfClosingTag } from '../jsx'
import type { Example, ExampleGroup } from '../types'

/** The props that an example sets: values that JSX can print. */
interface InputExampleProps {
  label: string
  hint?: string
  error?: string
  defaultValue?: string
  disabled?: true
  readOnly?: true
}

/** The input and its JSX, made from the same props so that the code never says something else than the preview. */
function inputExample(props: InputExampleProps): Pick<Example, 'element' | 'code'> {
  const { label, hint, error, defaultValue, disabled, readOnly } = props
  return {
    element: <Input {...props} />,
    code: selfClosingTag('Input', [
      attribute('label', label),
      attribute('hint', hint),
      attribute('error', error),
      attribute('defaultValue', defaultValue),
      attribute('disabled', disabled),
      attribute('readOnly', readOnly),
    ]),
  }
}

/** The examples of the reference of Input, with their text in the language of `intl`. */
export function inputExamples(intl: IntlShape): { usage: Example; groups: readonly ExampleGroup[] } {
  const say = (id: MessageId) => intl.formatMessage({ id })
  const label = say('catalog.sample.inputLabel')
  const hint = say('catalog.sample.inputHint')
  const error = say('catalog.sample.inputError')
  const value = say('catalog.sample.inputValue')
  const options = [say('docs.input.field.optionFree'), say('docs.input.field.optionTeam')]

  return {
    usage: { label: { code: 'Input' }, ...inputExample({ label, hint }) },
    groups: [
      {
        id: 'states',
        title: 'detail.section.states',
        description: 'docs.input.states.description',
        note: { id: 'docs.input.states.note' },
        examples: [
          { label: { message: 'catalog.state.default' }, ...inputExample({ label }) },
          // Focus is what the keyboard does to the input, so it is the live input, and it has the JSX of the default one.
          {
            label: { message: 'docs.input.state.focus' },
            hint: say('docs.input.state.focusHint'),
            element: <Input label={label} />,
          },
          { label: { message: 'catalog.state.hint' }, ...inputExample({ label, hint }) },
          { label: { message: 'catalog.state.error' }, ...inputExample({ label, error }) },
          { label: { message: 'docs.input.state.both' }, ...inputExample({ label, hint, error }) },
          {
            label: { message: 'catalog.state.disabled' },
            hint: say('docs.input.state.disabledHint'),
            ...inputExample({ label, defaultValue: value, disabled: true }),
          },
          {
            label: { message: 'catalog.state.readOnly' },
            hint: say('docs.input.state.readOnlyHint'),
            ...inputExample({ label, defaultValue: value, readOnly: true }),
          },
        ],
      },
      {
        id: 'field',
        title: 'docs.input.field.title',
        description: 'docs.input.field.description',
        note: { id: 'docs.input.field.note' },
        examples: [
          {
            label: { code: 'Field' },
            element: (
              <Field label={say('docs.input.field.label')} hint={say('docs.input.field.hint')}>
                {(control) => (
                  <select {...control}>
                    {options.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                )}
              </Field>
            ),
            code: [
              `<Field ${attribute('label', say('docs.input.field.label'))} ${attribute('hint', say('docs.input.field.hint'))}>`,
              `  {(control) => (`,
              `    <select {...control}>`,
              ...options.map((option) => `      <option>${option}</option>`),
              `    </select>`,
              `  )}`,
              `</Field>`,
            ].join('\n'),
          },
        ],
      },
    ],
  }
}
