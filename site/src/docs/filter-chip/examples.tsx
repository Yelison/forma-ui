import { FilterChip } from '@yelison/forma-ui'
import type { IntlShape } from 'react-intl'
import type { MessageId } from '../../i18n'
import { attribute, quote } from '../jsx'
import { permissionKeys, statusKeys } from './options'
import type { Example, ExampleGroup } from '../types'
import { ChipRow } from './ChipRow'
import { StatusFilter } from './StatusFilter'

/** A toggle chip and its JSX, made from the same props. */
function toggleExample(label: string, props: { selected?: true; disabled?: true }): Pick<Example, 'element' | 'code'> {
  const written = [attribute('selected', props.selected), attribute('disabled', props.disabled)].filter(
    (one) => one !== undefined,
  )
  return {
    element: (
      <FilterChip selected={props.selected} disabled={props.disabled}>
        {label}
      </FilterChip>
    ),
    code: `<FilterChip${written.map((one) => ` ${one}`).join('')}>${label}</FilterChip>`,
  }
}

/**
 * A popup chip that opens what it announces, with the JSX of the chip alone: the state around it (`open`, `status`) is
 * in the example of the popup below.
 */
function popupExample(
  statuses: readonly string[],
  label: string,
  selected: boolean,
  initialValue?: string,
): Pick<Example, 'element' | 'code'> {
  return {
    element: <StatusFilter options={statuses} initialValue={initialValue} />,
    code: `<FilterChip aria-haspopup="dialog" aria-expanded={open}${selected ? ' selected' : ''}>${label}</FilterChip>`,
  }
}

/** The examples of the reference of FilterChip, with their text in the language of `intl`. */
export function filterChipExamples(intl: IntlShape): { usage: Example; groups: readonly ExampleGroup[] } {
  const say = (id: MessageId) => intl.formatMessage({ id })
  const legend = say('catalog.sample.permission.legend')
  const permissions = permissionKeys.map((key) => say(`catalog.sample.permission.${key}`))
  const [everyone = '', canEdit = ''] = permissions
  const statuses = statusKeys.map((key) => say(`catalog.sample.status.${key}`))
  const [allStatuses = '', openStatus = ''] = statuses
  const chip = (value: string) => intl.formatMessage({ id: 'catalog.sample.status.chip' }, { value })

  const groupCode = [
    `const options = [${permissions.map(quote).join(', ')}]`,
    `const [permission, setPermission] = useState(options[0])`,
    ``,
    `<div role="group" aria-label=${JSON.stringify(legend)}>`,
    `  {options.map((option) => (`,
    `    <FilterChip key={option} selected={option === permission} onClick={() => setPermission(option)}>`,
    `      {option}`,
    `    </FilterChip>`,
    `  ))}`,
    `</div>`,
  ].join('\n')

  const popupCode = [
    `const [open, setOpen] = useState(false)`,
    `const [status, setStatus] = useState(${quote(allStatuses)})`,
    ``,
    `<FilterChip`,
    `  aria-haspopup="dialog"`,
    `  aria-expanded={open}`,
    `  selected={status !== ${quote(allStatuses)}}`,
    `  onClick={() => setOpen(true)}`,
    `>`,
    `  ${chip('{status}')}`,
    `</FilterChip>`,
    `{/* ${say('docs.filterChip.popup.comment')} */}`,
  ].join('\n')

  return {
    usage: {
      label: { code: 'FilterChip' },
      element: <ChipRow label={legend} options={permissions} initialValue={everyone} />,
      code: groupCode,
    },
    groups: [
      {
        id: 'states',
        title: 'detail.section.states',
        description: 'docs.filterChip.states.description',
        examples: [
          {
            label: { message: 'docs.filterChip.state.toggle' },
            hint: say('docs.filterChip.state.toggleHint'),
            ...toggleExample(canEdit, {}),
          },
          {
            label: { code: 'selected' },
            hint: say('docs.filterChip.state.selectedHint'),
            ...toggleExample(canEdit, { selected: true }),
          },
          {
            label: { message: 'catalog.state.disabled' },
            hint: say('docs.filterChip.state.disabledHint'),
            ...toggleExample(canEdit, { disabled: true }),
          },
          {
            label: { code: 'aria-haspopup' },
            hint: say('docs.filterChip.state.popupHint'),
            ...popupExample(statuses, chip(allStatuses), false),
          },
          {
            label: { code: 'aria-haspopup, selected' },
            hint: say('docs.filterChip.state.popupSelectedHint'),
            ...popupExample(statuses, chip(openStatus), true, openStatus),
          },
        ],
      },
      {
        id: 'group',
        title: 'docs.filterChip.group.title',
        description: 'docs.filterChip.group.description',
        examples: [
          {
            label: { code: 'role="group"' },
            hint: say('docs.filterChip.group.hint'),
            element: <ChipRow label={legend} options={permissions} initialValue={everyone} />,
            code: groupCode,
          },
          {
            label: { message: 'catalog.state.disabled' },
            hint: say('docs.filterChip.group.disabledHint'),
            element: <ChipRow label={legend} options={permissions} initialValue={everyone} disabledOption={canEdit} />,
          },
        ],
      },
      {
        id: 'popup',
        title: 'docs.filterChip.popup.title',
        description: 'docs.filterChip.popup.description',
        examples: [
          {
            label: { code: 'aria-haspopup="dialog"' },
            hint: say('docs.filterChip.popup.hint'),
            element: <StatusFilter options={statuses} />,
            code: popupCode,
          },
        ],
      },
    ],
  }
}
