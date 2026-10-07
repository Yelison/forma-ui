import type { DialogProps } from '@yelison/forma-ui'
import type { IntlShape } from 'react-intl'
import type { MessageId } from '../../i18n'
import { attribute } from '../jsx'
import type { Example, ExampleGroup } from '../types'
import { DialogExample, ProviderDialogExample } from './DialogExample'
import { ConfirmFooter } from './footers'

/** What an example says: the same text in the dialog on the page and in the JSX under it. */
interface Words {
  trigger: string
  title: string
  description: string
  cancel: string
  confirm: string
  /** The label of the field that the wide dialog holds. */
  field: string
}

/** What differs between the examples of the reference: the rest is the same dialog. */
interface Variation {
  size?: DialogProps['size']
  destructive?: boolean
  withField?: boolean
}

/** The state and the elements that open and fill a dialog, written as an application writes them. */
function dialogCode(words: Words, { size, destructive, withField }: Variation): string {
  const confirmVariant = destructive ? ' variant="danger"' : ''
  const closeIt = 'onClick={() => setOpen(false)}'
  const attributes = [
    'open={open}',
    'onClose={() => setOpen(false)}',
    attribute('title', words.title),
    attribute('description', words.description),
    attribute('size', size),
  ].filter((written) => written !== undefined)

  return [
    `const [open, setOpen] = useState(false)`,
    ``,
    `<Button variant="${destructive ? 'danger' : 'secondary'}" aria-haspopup="dialog" onClick={() => setOpen(true)}>`,
    `  ${words.trigger}`,
    `</Button>`,
    `<Dialog`,
    ...attributes.map((written) => `  ${written}`),
    `  footer={`,
    `    <>`,
    `      <Button variant="secondary" ${closeIt}>`,
    `        ${words.cancel}`,
    `      </Button>`,
    `      <Button${confirmVariant} ${closeIt}>`,
    `        ${words.confirm}`,
    `      </Button>`,
    `    </>`,
    `  }`,
    withField ? `>` : `/>`,
    ...(withField ? [`  <Input ${attribute('label', words.field)} />`, `</Dialog>`] : []),
  ].join('\n')
}

/** The JSX of the dialog whose close button reads a `FormaProvider`: the whole of it, so that it compiles as it is. */
function providerCode(closeLabel: string, title: string): string {
  return [
    `function CloseButton({ onClose }: { onClose: () => void }) {`,
    `  const { dialogClose } = useFormaStrings()`,
    `  return (`,
    `    <Button variant="secondary" onClick={onClose}>`,
    `      {dialogClose}`,
    `    </Button>`,
    `  )`,
    `}`,
    ``,
    `const [open, setOpen] = useState(false)`,
    `const close = () => setOpen(false)`,
    ``,
    `<FormaProvider strings={{ dialogClose: ${JSON.stringify(closeLabel)} }}>`,
    `  <Dialog open={open} onClose={close} ${attribute('title', title)} footer={<CloseButton onClose={close} />} />`,
    `</FormaProvider>`,
  ].join('\n')
}

/** A dialog that confirms an action, and its JSX, made from the same words so that the code never says something else. */
function confirmDialog(words: Words, variation: Variation = {}): Pick<Example, 'element' | 'code'> {
  return {
    element: (
      <DialogExample
        trigger={words.trigger}
        title={words.title}
        description={words.description}
        size={variation.size}
        destructive={variation.destructive}
        field={variation.withField ? words.field : undefined}
        footer={(close) => (
          <ConfirmFooter
            close={close}
            cancel={words.cancel}
            confirm={words.confirm}
            destructive={variation.destructive}
          />
        )}
      />
    ),
    code: dialogCode(words, variation),
  }
}

/** The examples of the reference of Dialog, with their text in the language of `intl`. */
export function dialogExamples(intl: IntlShape): { usage: Example; groups: readonly ExampleGroup[] } {
  const say = (id: MessageId) => intl.formatMessage({ id })
  const confirm: Words = {
    trigger: say('catalog.sample.confirmTrigger'),
    title: say('catalog.sample.confirmTitle'),
    description: say('catalog.sample.dialogDescription'),
    cancel: say('catalog.sample.cancel'),
    confirm: say('catalog.sample.save'),
    field: say('catalog.sample.inputLabel'),
  }
  const destructive: Words = {
    ...confirm,
    trigger: say('catalog.sample.deleteTrigger'),
    title: say('catalog.sample.deleteTitle'),
    confirm: say('catalog.sample.delete'),
  }
  const closeLabel = say('docs.dialog.sample.close')

  return {
    usage: { label: { code: 'Dialog' }, ...confirmDialog(confirm) },
    groups: [
      {
        id: 'states',
        title: 'detail.section.states',
        description: 'docs.dialog.states.description',
        examples: [
          {
            label: { message: 'docs.dialog.state.default' },
            hint: say('docs.dialog.state.defaultHint'),
            ...confirmDialog(confirm),
          },
          {
            label: { message: 'catalog.state.destructive' },
            hint: say('docs.dialog.state.destructiveHint'),
            ...confirmDialog(destructive, { destructive: true }),
          },
        ],
      },
      {
        id: 'sizes',
        title: 'detail.section.sizes',
        description: 'docs.dialog.sizes.description',
        examples: [
          { label: { code: 'size="default"' }, ...confirmDialog(confirm, { size: 'default' }) },
          {
            label: { code: 'size="wide"' },
            hint: say('docs.dialog.size.wideHint'),
            ...confirmDialog(confirm, { size: 'wide', withField: true }),
          },
        ],
      },
      {
        id: 'strings',
        title: 'docs.dialog.strings.title',
        description: 'docs.dialog.strings.description',
        examples: [
          {
            label: { message: 'docs.dialog.strings.label' },
            element: (
              <ProviderDialogExample
                closeLabel={closeLabel}
                trigger={say('docs.dialog.sample.stringsTrigger')}
                title={say('docs.dialog.sample.stringsTitle')}
                description={say('catalog.sample.dialogDescription')}
              />
            ),
            code: providerCode(closeLabel, say('docs.dialog.sample.stringsTitle')),
          },
        ],
      },
    ],
  }
}
