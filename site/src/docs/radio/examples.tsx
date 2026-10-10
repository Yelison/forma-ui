import type { IntlShape } from 'react-intl'
import type { MessageId } from '../../i18n'
import { attribute, quote, selfClosingTag } from '../jsx'
import type { Example, ExampleGroup } from '../types'
import { ControlledRadioExample } from './ControlledRadioExample'
import { RadioGroupExample, type RadioOption } from './RadioGroupExample'

/** The words of the group, in the language of the page: the same text in the radios and in the JSX under them. */
interface Words {
  legend: string
  options: RadioOption[]
}

/** The name that the JSX shares between the options. The live groups take their own, so that each one stays a group. */
const groupName = 'plan'

/** The JSX of a group: a fieldset, its legend and a `Radio` for each option, with the props an example adds to each. */
function groupCode({ legend, options }: Words, extras: (value: string) => readonly (string | undefined)[] = () => []) {
  const radios = options.flatMap(({ value, label }) =>
    selfClosingTag('Radio', [
      attribute('name', groupName),
      attribute('value', value),
      attribute('label', label),
      ...extras(value),
    ])
      .split('\n')
      .map((line) => `  ${line}`),
  )
  return ['<fieldset>', `  <legend>${legend}</legend>`, ...radios, '</fieldset>'].join('\n')
}

/** The examples of the reference of Radio, with their text in the language of `intl`. */
export function radioExamples(intl: IntlShape): { usage: Example; groups: readonly ExampleGroup[] } {
  const say = (id: MessageId) => intl.formatMessage({ id })
  const words: Words = {
    legend: say('catalog.sample.radio.legend'),
    options: (['free', 'team', 'business'] as const).map((value) => ({
      value,
      label: say(`catalog.sample.radio.${value}`),
    })),
  }
  const selected = (value: string) => intl.formatMessage({ id: 'docs.radio.sample.selected' }, { value })

  return {
    usage: {
      label: { code: 'Radio' },
      element: <RadioGroupExample {...words} />,
      code: groupCode(words),
    },
    groups: [
      {
        id: 'states',
        title: 'detail.section.states',
        description: 'docs.radio.states.description',
        examples: [
          {
            label: { message: 'catalog.state.default' },
            hint: say('docs.radio.state.defaultHint'),
            element: <RadioGroupExample {...words} />,
            code: groupCode(words),
          },
          {
            label: { code: 'defaultChecked' },
            hint: say('docs.radio.state.defaultCheckedHint'),
            element: <RadioGroupExample {...words} defaultValue="team" />,
            code: groupCode(words, (value) => [attribute('defaultChecked', value === 'team' || undefined)]),
          },
          {
            label: { message: 'catalog.state.disabled' },
            hint: say('docs.radio.state.disabledHint'),
            element: <RadioGroupExample {...words} defaultValue="free" disabledValue="business" />,
            code: groupCode(words, (value) => [
              attribute('defaultChecked', value === 'free' || undefined),
              attribute('disabled', value === 'business' || undefined),
            ]),
          },
        ],
      },
      {
        id: 'controlled',
        title: 'docs.radio.controlled.title',
        description: 'docs.radio.controlled.description',
        examples: [
          {
            label: { code: 'checked, onChange' },
            hint: say('docs.radio.controlled.hint'),
            element: <ControlledRadioExample {...words} initialValue="team" selected={selected} />,
            code: [
              `const [value, setValue] = useState(${quote('team')})`,
              ``,
              groupCode(words, (value) => [
                `checked={value === ${quote(value)}}`,
                `onChange={() => setValue(${quote(value)})}`,
              ]),
              `<p>${intl.formatMessage({ id: 'docs.radio.sample.selected' }, { value: '{value}' })}</p>`,
            ].join('\n'),
          },
        ],
      },
    ],
  }
}
