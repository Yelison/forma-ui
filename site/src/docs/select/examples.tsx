import { Select } from '@yelison/forma-ui'
import type { IntlShape } from 'react-intl'
import type { MessageId } from '../../i18n'
import { attribute } from '../jsx'
import type { Example, ExampleGroup } from '../types'

/** The props that an example sets: values that JSX can print. */
interface SelectExampleProps {
  label: string
  hint?: string
  error?: string
  defaultValue: string
  disabled?: true
  'aria-disabled'?: 'true'
}

/** The words of the options, in the language of the page: the same text in the select and in the JSX under it. */
interface Option {
  value: string
  label: string
}

/** The opening tag of the select, one attribute to a line, since a select always has children after it. */
function openingTag(props: SelectExampleProps) {
  const written = [
    attribute('label', props.label),
    attribute('hint', props.hint),
    attribute('error', props.error),
    attribute('defaultValue', props.defaultValue),
    attribute('disabled', props.disabled),
    attribute('aria-disabled', props['aria-disabled']),
  ].filter((one) => one !== undefined)
  const oneLine = `<Select ${written.join(' ')}>`
  return oneLine.length <= 60 ? oneLine : ['<Select', ...written.map((one) => `  ${one}`), '>'].join('\n')
}

/**
 * The select and its JSX, made from the same props. The preview is silenced with `announce="off"` and the code is not:
 * the page mounts its errors when it opens and nobody caused them, but the code is what a form copies, and a form
 * must announce its errors.
 */
function selectExample(props: SelectExampleProps, options: readonly Option[]): Pick<Example, 'element' | 'code'> {
  return {
    element: (
      <Select {...props} announce="off">
        {options.map(({ value, label }) => (
          <option key={value} value={value} disabled={value === ''}>
            {label}
          </option>
        ))}
      </Select>
    ),
    code: [
      openingTag(props),
      ...options.map(
        ({ value, label }) => `  <option value="${value}"${value === '' ? ' disabled' : ''}>${label}</option>`,
      ),
      `</Select>`,
    ].join('\n'),
  }
}

/** The examples of the reference of Select, with their text in the language of `intl`. */
export function selectExamples(intl: IntlShape): { usage: Example; groups: readonly ExampleGroup[] } {
  const say = (id: MessageId) => intl.formatMessage({ id })
  const label = say('catalog.sample.selectLabel')
  const hint = say('catalog.sample.selectHint')
  const error = say('catalog.sample.selectError')
  const options: Option[] = [
    { value: 'low', label: say('catalog.sample.select.low') },
    { value: 'medium', label: say('catalog.sample.select.medium') },
    { value: 'high', label: say('catalog.sample.select.high') },
  ]
  // The placeholder is an option nobody can choose back: it is what an unanswered, required select shows.
  const withPlaceholder: Option[] = [{ value: '', label: say('catalog.sample.select.placeholder') }, ...options]

  return {
    usage: { label: { code: 'Select' }, ...selectExample({ label, hint, defaultValue: 'medium' }, options) },
    groups: [
      {
        id: 'states',
        title: 'detail.section.states',
        description: 'docs.select.states.description',
        note: { id: 'docs.select.states.note' },
        examples: [
          { label: { message: 'catalog.state.default' }, ...selectExample({ label, defaultValue: 'medium' }, options) },
          // Focus is what the keyboard does to the select, so it is the live select, and it has the JSX of the default one.
          {
            label: { message: 'docs.select.state.focus' },
            hint: say('docs.select.state.focusHint'),
            element: (
              <Select label={label} defaultValue="medium">
                {options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            ),
          },
          {
            label: { message: 'catalog.state.hint' },
            ...selectExample({ label, hint, defaultValue: 'medium' }, options),
          },
          {
            label: { message: 'catalog.state.error' },
            ...selectExample({ label, error, defaultValue: '' }, withPlaceholder),
          },
          {
            label: { message: 'catalog.state.disabled' },
            hint: say('docs.select.state.disabledHint'),
            ...selectExample({ label, defaultValue: 'medium', disabled: true }, options),
          },
          {
            label: { code: 'aria-disabled' },
            hint: say('docs.select.state.ariaDisabledHint'),
            ...selectExample({ label, defaultValue: 'medium', 'aria-disabled': 'true' }, options),
          },
        ],
      },
    ],
  }
}
