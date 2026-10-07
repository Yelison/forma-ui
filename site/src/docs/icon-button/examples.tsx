import { IconButton, Tooltip, type IconName } from '@yelison/forma-ui'
import type { IntlShape } from 'react-intl'
import type { MessageId } from '../../i18n'
import type { Example, ExampleGroup } from '../types'

/** An icon, or the icons that make one glyph, as JSX prints them: `'plus'` and `{['arrow', 'arrow']}`. */
const iconCode = (icon: IconName | readonly IconName[]) =>
  typeof icon === 'string' ? `icon="${icon}"` : `icon={[${icon.map((name) => `'${name}'`).join(', ')}]}`

/** The longest tag that stays on one line, as in `formatJsx`; past it every attribute gets a line of its own. */
const inlineTagLength = 60

interface IconButtonExampleProps {
  icon: IconName | readonly IconName[]
  label: string
  flip?: true
  disabled?: true
}

/** The button and its JSX, made from the same props so that the code never says something else than the preview. */
function iconButtonExample({ icon, label, flip, disabled }: IconButtonExampleProps): Pick<Example, 'element' | 'code'> {
  const attributes = [iconCode(icon), flip && 'flip', disabled && 'disabled', `label="${label}"`].filter(Boolean)
  const oneLine = `<IconButton ${attributes.join(' ')} />`
  return {
    element: <IconButton icon={icon} flip={flip} disabled={disabled} label={label} />,
    code:
      oneLine.length <= inlineTagLength
        ? oneLine
        : `<IconButton\n${attributes.map((attribute) => `  ${attribute}`).join('\n')}\n/>`,
  }
}

/** The examples of the reference of IconButton, with their text in the language of `intl`. */
export function iconButtonExamples(intl: IntlShape): { usage: Example; groups: readonly ExampleGroup[] } {
  const say = (id: MessageId) => intl.formatMessage({ id })
  const add = say('docs.iconButton.sample.add')
  const collapse = say('docs.iconButton.sample.collapse')
  const expand = say('docs.iconButton.sample.expand')
  const plus = { icon: 'plus', label: add } as const

  return {
    usage: { label: { code: 'IconButton' }, ...iconButtonExample(plus) },
    groups: [
      {
        id: 'icons',
        title: 'docs.iconButton.icons.title',
        description: 'docs.iconButton.icons.description',
        examples: [
          { label: { code: 'icon="plus"' }, ...iconButtonExample(plus) },
          {
            label: { code: `icon={['arrow', 'arrow']}` },
            ...iconButtonExample({ icon: ['arrow', 'arrow'], label: collapse }),
          },
          {
            label: { code: 'flip' },
            ...iconButtonExample({ icon: ['arrow', 'arrow'], flip: true, label: expand }),
          },
        ],
      },
      {
        id: 'states',
        title: 'detail.section.states',
        description: 'docs.iconButton.states.description',
        examples: [
          { label: { message: 'docs.iconButton.state.default' }, ...iconButtonExample(plus) },
          // Hover and focus are what the pointer and the keyboard do to a button, so they are the live button, and they
          // have the JSX of the default one.
          {
            label: { message: 'docs.iconButton.state.hover' },
            hint: say('docs.iconButton.state.hoverHint'),
            element: <IconButton icon="plus" label={add} />,
          },
          {
            label: { message: 'docs.iconButton.state.focus' },
            hint: say('docs.iconButton.state.focusHint'),
            element: <IconButton icon="plus" label={add} />,
          },
          { label: { message: 'docs.iconButton.state.disabled' }, ...iconButtonExample({ ...plus, disabled: true }) },
        ],
      },
      {
        id: 'tooltip',
        title: 'docs.iconButton.tooltip.title',
        description: 'docs.iconButton.tooltip.description',
        examples: [
          {
            label: { message: 'docs.iconButton.tooltip.label' },
            element: (
              <Tooltip content={add} describe={false}>
                {(trigger) => <IconButton icon="plus" label={add} {...trigger} />}
              </Tooltip>
            ),
            code: [
              `<Tooltip content="${add}" describe={false}>`,
              `  {(trigger) => <IconButton icon="plus" label="${add}" {...trigger} />}`,
              `</Tooltip>`,
            ].join('\n'),
          },
        ],
      },
    ],
  }
}
