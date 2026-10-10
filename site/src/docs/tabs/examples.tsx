import { Tabs } from '@yelison/forma-ui'
import type { IntlShape } from 'react-intl'
import type { MessageId } from '../../i18n'
import { attribute, quote, selfClosingTag } from '../jsx'
import type { Example, ExampleGroup } from '../types'
import { ControlledTabsExample } from './ControlledTabsExample'

/** The words of the tabs, in the language of the page: the same text in the tabs and in the JSX under them. */
interface Words {
  label: string
  items: { id: string; label: string; content: string }[]
}

/** The `items` that every example shares, written as an application writes them. */
function itemsCode({ items }: Words): string {
  const written = items.map(
    ({ id, label, content }) => `  { id: ${quote(id)}, label: ${quote(label)}, content: ${quote(content)} },`,
  )
  return ['const items = [', ...written, ']'].join('\n')
}

/** The JSX of a `Tabs` over the shared items, with the props an example adds to `label` and `items`. */
function tabsCode(words: Words, props: readonly (string | undefined)[] = []): string {
  return selfClosingTag('Tabs', [attribute('label', words.label), 'items={items}', ...props])
}

/** The examples of the reference of Tabs, with their text in the language of `intl`. */
export function tabsExamples(intl: IntlShape): { usage: Example; groups: readonly ExampleGroup[] } {
  const say = (id: MessageId) => intl.formatMessage({ id })
  const words: Words = {
    label: say('catalog.sample.tabs.label'),
    items: (['overview', 'activity', 'files'] as const).map((id) => ({
      id,
      label: say(`catalog.sample.tabs.${id}`),
      content: say(`catalog.sample.tabs.${id}Content`),
    })),
  }
  const selected = (value: string) => intl.formatMessage({ id: 'docs.tabs.sample.selected' }, { value })

  return {
    usage: {
      label: { code: 'Tabs' },
      element: <Tabs label={words.label} items={words.items} />,
      code: `${itemsCode(words)}\n\n${tabsCode(words)}`,
    },
    groups: [
      {
        id: 'states',
        title: 'detail.section.states',
        description: 'docs.tabs.states.description',
        examples: [
          {
            label: { message: 'catalog.state.default' },
            hint: say('docs.tabs.state.defaultHint'),
            element: <Tabs label={words.label} items={words.items} />,
            code: `${itemsCode(words)}\n\n${tabsCode(words)}`,
          },
          {
            label: { code: 'defaultValue="activity"' },
            hint: say('docs.tabs.state.defaultValueHint'),
            element: <Tabs label={words.label} items={words.items} defaultValue="activity" />,
            code: tabsCode(words, [attribute('defaultValue', 'activity')]),
          },
        ],
      },
      {
        id: 'controlled',
        title: 'docs.tabs.controlled.title',
        description: 'docs.tabs.controlled.description',
        examples: [
          {
            label: { code: 'value, onChange' },
            hint: say('docs.tabs.controlled.hint'),
            element: (
              <ControlledTabsExample label={words.label} items={words.items} initialValue="files" selected={selected} />
            ),
            code: [
              `const [value, setValue] = useState('files')`,
              ``,
              tabsCode(words, ['value={value}', 'onChange={setValue}']),
              `<p>${intl.formatMessage({ id: 'docs.tabs.sample.selected' }, { value: '{value}' })}</p>`,
            ].join('\n'),
          },
        ],
      },
    ],
  }
}
