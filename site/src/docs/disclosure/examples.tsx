import type { IntlShape } from 'react-intl'
import type { MessageId } from '../../i18n'
import { attribute, quote } from '../jsx'
import type { Example, ExampleGroup } from '../types'
import { ControlledDisclosure } from './ControlledDisclosure'
import { DetailsDisclosure } from './DetailsDisclosure'
import { FolderDisclosure } from './FolderDisclosure'
import { RenameBurst } from './RenameBurst'
import { disclosureWords, type DisclosureWords } from './words'

/** The JSX of an inline disclosure, from the words that the live one has. */
function detailsCode({ summary, region }: { summary: string; region: string }, extra: string[] = []): string {
  return [
    `<Disclosure ${[attribute('summary', summary), ...extra].join(' ')}>`,
    `  <p>${region}</p>`,
    `</Disclosure>`,
  ].join('\n')
}

function controlledCode({ controlled }: DisclosureWords): string {
  return [
    `const [open, setOpen] = useState(false)`,
    ``,
    `<Disclosure ${attribute('summary', controlled.summary)} open={open} onOpenChange={setOpen}>`,
    `  <p>${controlled.region}</p>`,
    `  <Button variant="secondary" onClick={() => setOpen(false)}>`,
    `    ${controlled.done}`,
    `  </Button>`,
    `</Disclosure>`,
  ].join('\n')
}

function folderCode({ folder }: DisclosureWords): string {
  const { summary, documents, menu } = folder
  return [
    `<Disclosure`,
    `  variant="section"`,
    `  headingLevel={3}`,
    `  ${attribute('summary', summary)}`,
    `  defaultOpen`,
    `  actions={`,
    `    <Menu`,
    `      ${attribute('label', menu.label)}`,
    `      items={[`,
    `        { id: 'rename', label: ${quote(menu.rename)}, onSelect: renameFolder },`,
    `        { id: 'delete', label: ${quote(menu.delete)}, tone: 'danger', separatorBefore: true, onSelect: deleteFolder },`,
    `      ]}`,
    `    >`,
    `      {(trigger) => <IconButton icon="more" ${attribute('label', menu.label)} {...trigger} />}`,
    `    </Menu>`,
    `  }`,
    `>`,
    `  <ul>`,
    ...documents.map((document) => `    <li>${document}</li>`),
    `  </ul>`,
    `</Disclosure>`,
  ].join('\n')
}

function burstCode({ burst }: DisclosureWords): string {
  const { document, sentenceCode, show, list, people } = burst
  // The live sentence has a link where the code has the element that makes it.
  const written = sentenceCode(`<a href="/documents/brand-voice">${document}</a>`)
  return [
    `<DisclosureRoot>`,
    `  <div className="row">`,
    `    <Avatar name=${quote(people[0])} size="small" decorative />`,
    `    <p id="rename-sentence">${written}</p>`,
    `    <DisclosureButton aria-describedby="rename-sentence">${show}</DisclosureButton>`,
    `  </div>`,
    `  <DisclosureRegion>`,
    `    <ul ${attribute('aria-label', list)}>`,
    ...people.map((person) => `      <li>${person}</li>`),
    `    </ul>`,
    `  </DisclosureRegion>`,
    `</DisclosureRoot>`,
  ].join('\n')
}

/** The examples of the reference of Disclosure, with their text in the language of `intl`. */
export function disclosureExamples(intl: IntlShape): { usage: Example; groups: readonly ExampleGroup[] } {
  const say = (id: MessageId) => intl.formatMessage({ id })
  const words = disclosureWords(intl)

  return {
    usage: {
      label: { code: 'Disclosure' },
      element: <DetailsDisclosure words={words} />,
      code: detailsCode(words.details),
    },
    groups: [
      {
        id: 'variants',
        title: 'docs.disclosure.group.variants.title',
        description: 'docs.disclosure.group.variants.description',
        examples: [
          {
            label: { code: 'variant="inline"' },
            hint: say('docs.disclosure.hint.inline'),
            element: <DetailsDisclosure words={words} />,
            code: detailsCode(words.details),
          },
          {
            label: { code: 'variant="section"' },
            hint: say('docs.disclosure.hint.section'),
            element: <FolderDisclosure words={words} />,
            code: folderCode(words),
          },
        ],
      },
      {
        id: 'states',
        title: 'detail.section.states',
        description: 'docs.disclosure.group.states.description',
        examples: [
          {
            label: { code: 'defaultOpen' },
            hint: say('docs.disclosure.hint.defaultOpen'),
            element: <DetailsDisclosure words={words} defaultOpen />,
            code: detailsCode(words.details, ['defaultOpen']),
          },
          {
            label: { code: 'open, onOpenChange' },
            hint: say('docs.disclosure.hint.controlled'),
            element: <ControlledDisclosure words={words} />,
            code: controlledCode(words),
          },
          {
            label: { code: 'disabled' },
            hint: say('docs.disclosure.hint.disabled'),
            element: <DetailsDisclosure words={words} disabled />,
            code: detailsCode(words.disabled, ['buttonProps={{ disabled: true }}']),
          },
        ],
      },
      {
        id: 'parts',
        title: 'docs.disclosure.group.parts.title',
        description: 'docs.disclosure.group.parts.description',
        examples: [
          {
            label: { code: 'DisclosureRoot' },
            hint: say('docs.disclosure.hint.parts'),
            element: <RenameBurst words={words} />,
            code: burstCode(words),
          },
        ],
      },
    ],
  }
}
