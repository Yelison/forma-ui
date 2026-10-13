import type { IntlShape } from 'react-intl'
import type { MessageId } from '../../i18n'
import { attribute, quote, selfClosingTag } from '../jsx'
import type { Example, ExampleGroup } from '../types'
import { SearchFieldExample } from './SearchFieldExample'

/** The state that the JSX of every example reads, as `useState` writes it. */
const stateLine = (initial: string) => `const [query, setQuery] = useState(${quote(initial)})`

/** The words of the examples, in the language of the page: the same text in the field and in the JSX under it. */
interface Words {
  label: string
  placeholder: string
}

/** The JSX of a field: the three props it needs, the ones an example adds, and the state that backs it. */
function searchCode({ label, placeholder }: Words, initial: string, extras: readonly (string | undefined)[] = []) {
  return [
    stateLine(initial),
    ``,
    selfClosingTag('SearchField', [
      attribute('label', label),
      `value={query}`,
      `onValueChange={setQuery}`,
      attribute('placeholder', placeholder),
      ...extras,
    ]),
  ].join('\n')
}

/** The examples of the reference of SearchField, with their text in the language of `intl`. */
export function searchFieldExamples(intl: IntlShape): { usage: Example; groups: readonly ExampleGroup[] } {
  const say = (id: MessageId) => intl.formatMessage({ id })
  const words: Words = {
    label: say('catalog.sample.searchLabel'),
    placeholder: say('catalog.sample.searchPlaceholder'),
  }
  const text = say('catalog.sample.searchValue')
  const reading = (value: string) =>
    intl.formatMessage({ id: 'docs.searchField.sample.reading' }, { length: value.length, value })

  return {
    usage: {
      label: { code: 'SearchField' },
      element: <SearchFieldExample {...words} />,
      code: searchCode(words, ''),
    },
    groups: [
      {
        id: 'states',
        title: 'detail.section.states',
        description: 'docs.searchField.states.description',
        examples: [
          {
            label: { message: 'catalog.state.default' },
            hint: say('docs.searchField.state.defaultHint'),
            element: <SearchFieldExample {...words} />,
            code: searchCode(words, ''),
          },
          {
            label: { code: 'value' },
            hint: say('docs.searchField.state.valueHint'),
            element: <SearchFieldExample {...words} initialValue={text} />,
            code: searchCode(words, text),
          },
          {
            label: { message: 'catalog.state.disabled' },
            hint: say('docs.searchField.state.disabledHint'),
            element: <SearchFieldExample {...words} initialValue={text} disabled />,
            code: searchCode(words, text, [attribute('disabled', true)]),
          },
          {
            label: { message: 'catalog.state.readOnly' },
            hint: say('docs.searchField.state.readOnlyHint'),
            element: <SearchFieldExample {...words} initialValue={text} readOnly />,
            code: searchCode(words, text, [attribute('readOnly', true)]),
          },
        ],
      },
      {
        id: 'controlled',
        title: 'docs.searchField.controlled.title',
        description: 'docs.searchField.controlled.description',
        examples: [
          {
            label: { code: 'value, onValueChange' },
            hint: say('docs.searchField.controlled.hint'),
            element: <SearchFieldExample {...words} reading={reading} />,
            code: [
              searchCode(words, ''),
              `<p>${intl.formatMessage({ id: 'docs.searchField.sample.reading' }, { length: 1, value: '{query}' })}</p>`,
            ].join('\n'),
          },
        ],
      },
    ],
  }
}
