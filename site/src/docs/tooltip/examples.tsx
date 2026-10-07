import { Button, IconButton, Tooltip, type TooltipPlacement } from '@yelison/forma-ui'
import type { IntlShape } from 'react-intl'
import type { MessageId } from '../../i18n'
import type { Example, ExampleGroup } from '../types'
import { attribute } from '../jsx'
import { TooltipInDialog } from './TooltipInDialog'

const placements = ['right', 'bottom-start', 'bottom-end'] as const satisfies readonly TooltipPlacement[]

/** What the tooltip of an example says and what its button is called: the same on the page and in its JSX. */
interface Words {
  trigger: string
  tip: string
}

/** The JSX of a tooltip on a button. A prop that is not set is left out, so the code says what the example does. */
function buttonTooltipCode({ trigger, tip }: Words, props: readonly (string | undefined)[] = []): string {
  const attributes = [attribute('content', tip), ...props].filter((written) => written !== undefined)
  return [
    `<Tooltip ${attributes.join(' ')}>`,
    `  {(trigger) => (`,
    `    <Button variant="secondary" {...trigger}>`,
    `      ${trigger}`,
    `    </Button>`,
    `  )}`,
    `</Tooltip>`,
  ].join('\n')
}

/** A tooltip on a button, and its JSX, made from the same words so that the code never says something else. */
function buttonTooltip(words: Words, placement: TooltipPlacement, disabled = false): Pick<Example, 'element' | 'code'> {
  const props = [
    placement === 'right' ? undefined : attribute('placement', placement),
    attribute('disabled', disabled || undefined),
  ]
  return {
    element: (
      <Tooltip content={words.tip} placement={placement} disabled={disabled}>
        {(trigger) => (
          <Button variant="secondary" {...trigger}>
            {words.trigger}
          </Button>
        )}
      </Tooltip>
    ),
    code: buttonTooltipCode(words, props),
  }
}

/** What the dialog of the pattern says. */
interface DialogWords {
  trigger: string
  title: string
  description: string
  field: string
  action: string
  tip: string
  cancel: string
}

/** The JSX of `TooltipInDialog`, written as an application writes it, from the words that the live example has. */
function dialogCode({ trigger, title, description, field, action, tip, cancel }: DialogWords): string {
  const close = 'onClick={() => setOpen(false)}'
  return [
    `const [open, setOpen] = useState(false)`,
    ``,
    `<Button variant="secondary" aria-haspopup="dialog" onClick={() => setOpen(true)}>`,
    `  ${trigger}`,
    `</Button>`,
    `<Dialog`,
    `  open={open}`,
    `  onClose={() => setOpen(false)}`,
    `  ${attribute('title', title)}`,
    `  ${attribute('description', description)}`,
    `  footer={`,
    `    <>`,
    `      <Button variant="secondary" ${close}>`,
    `        ${cancel}`,
    `      </Button>`,
    `      <Tooltip ${attribute('content', tip)} placement="bottom-end">`,
    `        {(trigger) => (`,
    `          <Button {...trigger} ${close}>`,
    `            ${action}`,
    `          </Button>`,
    `        )}`,
    `      </Tooltip>`,
    `    </>`,
    `  }`,
    `>`,
    `  <Input ${attribute('label', field)} />`,
    `</Dialog>`,
  ].join('\n')
}

/** The examples of the reference of Tooltip, with their text in the language of `intl`. */
export function tooltipExamples(intl: IntlShape): { usage: Example; groups: readonly ExampleGroup[] } {
  const say = (id: MessageId) => intl.formatMessage({ id })
  const words = { trigger: say('catalog.sample.tooltipTrigger'), tip: say('catalog.sample.tooltipContent') }
  const add = say('docs.iconButton.sample.add')
  const dialogWords: DialogWords = {
    trigger: say('docs.tooltip.dialog.trigger'),
    title: say('docs.tooltip.dialog.title'),
    description: say('catalog.sample.dialogDescription'),
    field: say('catalog.sample.inputLabel'),
    action: say('catalog.sample.save'),
    tip: say('docs.tooltip.dialog.tip'),
    cancel: say('catalog.sample.cancel'),
  }

  return {
    usage: { label: { code: 'Tooltip' }, ...buttonTooltip(words, 'right') },
    groups: [
      {
        id: 'states',
        title: 'detail.section.states',
        description: 'docs.tooltip.states.description',
        examples: [
          {
            label: { message: 'docs.tooltip.state.pointer' },
            hint: say('docs.tooltip.state.pointerHint'),
            ...buttonTooltip(words, 'bottom-start'),
          },
          // The keyboard, and Escape, are what a person does to the same tooltip, so they are live tooltips with the JSX
          // of the first one.
          {
            label: { message: 'docs.tooltip.state.keyboard' },
            hint: say('docs.tooltip.state.keyboardHint'),
            element: buttonTooltip(words, 'bottom-start').element,
          },
          {
            label: { message: 'docs.tooltip.state.escape' },
            hint: say('docs.tooltip.state.escapeHint'),
            element: buttonTooltip(words, 'bottom-start').element,
          },
          {
            label: { message: 'docs.tooltip.state.disabled' },
            hint: say('docs.tooltip.state.disabledHint'),
            ...buttonTooltip(words, 'bottom-start', true),
          },
        ],
      },
      {
        id: 'placement',
        title: 'docs.tooltip.placement.title',
        description: 'docs.tooltip.placement.description',
        examples: placements.map((placement) => ({
          label: { code: `placement="${placement}"` },
          ...buttonTooltip(words, placement),
        })),
      },
      {
        id: 'patterns',
        title: 'docs.tooltip.patterns.title',
        description: 'docs.tooltip.patterns.description',
        examples: [
          {
            label: { message: 'docs.tooltip.pattern.icon' },
            element: (
              <Tooltip content={add} describe={false}>
                {(trigger) => <IconButton icon="plus" label={add} {...trigger} />}
              </Tooltip>
            ),
            code: [
              `<Tooltip ${attribute('content', add)} describe={false}>`,
              `  {(trigger) => <IconButton icon="plus" ${attribute('label', add)} {...trigger} />}`,
              `</Tooltip>`,
            ].join('\n'),
          },
          {
            label: { message: 'docs.tooltip.pattern.dialog' },
            hint: say('docs.tooltip.pattern.dialogHint'),
            element: <TooltipInDialog {...dialogWords} />,
            code: dialogCode(dialogWords),
          },
        ],
      },
    ],
  }
}
