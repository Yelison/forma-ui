import type { IntlShape } from 'react-intl'
import type { MessageId } from '../../i18n'
import type { Example, ExampleGroup } from '../types'
import { attribute, quote } from '../jsx'
import { ActionsMenu } from './ActionsMenu'
import { StatusMenu } from './StatusMenu'
import { WorkspaceMenu } from './WorkspaceMenu'
import { menuWords, type MenuWords } from './words'

interface ActionsOptions {
  priorityDisabled?: boolean
  withNote?: boolean
  trigger?: 'button' | 'icon'
}

/** The JSX of `ActionsMenu`, written as an application writes it, from the words that the live menu has. */
function actionsCode(words: MenuWords, { priorityDisabled, withNote, trigger = 'button' }: ActionsOptions): string {
  const row = (id: string, label: string, props = '') =>
    `  { id: '${id}', label: ${quote(label)},${props} onSelect: ${id} },`
  const menuProps = [
    attribute('label', words.label),
    'items={items}',
    withNote ? attribute('note', words.note) : undefined,
  ].filter((written) => written !== undefined)
  const opener =
    trigger === 'icon'
      ? [`  {(trigger) => <IconButton icon="more" ${attribute('label', words.more)} {...trigger} />}`]
      : [
          `  {(trigger) => (`,
          `    <Button variant="secondary" {...trigger}>`,
          `      ${words.trigger}`,
          `    </Button>`,
          `  )}`,
        ]
  return [
    `const items = [`,
    row('assign', words.assign),
    row('priority', words.priority, priorityDisabled ? ' disabled: true,' : ''),
    row('resolve', words.resolve),
    row('archive', words.archive, ' separatorBefore: true,'),
    row('delete', words.delete, " tone: 'danger',"),
    `]`,
    ``,
    `<Menu ${menuProps.join(' ')}>`,
    ...opener,
    `</Menu>`,
  ].join('\n')
}

/** The JSX of `WorkspaceMenu`: options with a role under each name, a check on the current one and, optionally, a search. */
function workspaceCode(words: MenuWords, withSearch: boolean): string {
  const { names, admin, agent, label, search, empty, all, trigger } = words.workspace
  const searchProp = `  search={{ label: ${quote(search)}, emptyText: ${quote(empty)} }}`
  return [
    `const workspaces = [`,
    `  { name: ${quote(names[0])}, role: ${quote(admin)} },`,
    `  { name: ${quote(names[1])}, role: ${quote(agent)} },`,
    `  { name: ${quote(names[2])}, role: ${quote(agent)} },`,
    `]`,
    `const [current, setCurrent] = useState(0)`,
    ``,
    `<Menu`,
    `  ${attribute('label', label)}`,
    `  wide`,
    ...(withSearch ? [searchProp] : []),
    `  items={[`,
    `    ...workspaces.map(({ name, role }, index) => ({`,
    `      id: name,`,
    `      label: name,`,
    `      description: role,`,
    `      leading: <Avatar name={name} size="small" decorative />,`,
    `      checked: index === current,`,
    `      searchable: true,`,
    `      onSelect: () => setCurrent(index),`,
    `    })),`,
    `    { id: 'all', label: ${quote(all)}, separatorBefore: true, onSelect: openWorkspaces },`,
    `  ]}`,
    `>`,
    `  {(trigger) => (`,
    `    <Button variant="secondary" {...trigger}>`,
    `      ${trigger}`,
    `    </Button>`,
    `  )}`,
    `</Menu>`,
  ].join('\n')
}

/** The JSX of `StatusMenu`: a filter chip as the trigger, whose label carries the chosen value. */
function statusCode(words: MenuWords, chip: (value: string) => string): string {
  const { label, options } = words.status
  return [
    `const options = [${options.map(quote).join(', ')}]`,
    `const [status, setStatus] = useState(0)`,
    ``,
    `<Menu`,
    `  ${attribute('label', label)}`,
    `  placement="bottom-start"`,
    `  items={options.map((option, index) => ({`,
    `    id: option,`,
    `    label: option,`,
    `    checked: index === status,`,
    `    onSelect: () => setStatus(index),`,
    `  }))}`,
    `>`,
    `  {(trigger) => (`,
    `    <FilterChip selected={status !== 0} {...trigger}>`,
    `      ${chip('{options[status]}')}`,
    `    </FilterChip>`,
    `  )}`,
    `</Menu>`,
  ].join('\n')
}

/** The examples of the reference of Menu, with their text in the language of `intl`. */
export function menuExamples(intl: IntlShape): { usage: Example; groups: readonly ExampleGroup[] } {
  const say = (id: MessageId) => intl.formatMessage({ id })
  const words = menuWords(intl)
  const chip = (value: string) => intl.formatMessage({ id: 'catalog.sample.status.chip' }, { value })

  const actions = (options: ActionsOptions = {}): Pick<Example, 'element' | 'code'> => ({
    element: <ActionsMenu words={words} {...options} />,
    code: actionsCode(words, options),
  })

  return {
    usage: { label: { code: 'Menu' }, ...actions() },
    groups: [
      {
        id: 'states',
        title: 'detail.section.states',
        description: 'docs.menu.states.description',
        examples: [
          { label: { message: 'docs.menu.state.default' }, hint: say('docs.menu.hint.default'), ...actions() },
          {
            label: { code: 'disabled' },
            hint: say('docs.menu.hint.disabled'),
            ...actions({ priorityDisabled: true }),
          },
          {
            label: { code: 'note' },
            hint: say('docs.menu.hint.note'),
            ...actions({ priorityDisabled: true, withNote: true }),
          },
          {
            label: { code: 'checked' },
            hint: say('docs.menu.hint.checked'),
            element: <WorkspaceMenu words={words} />,
            code: workspaceCode(words, false),
          },
        ],
      },
      {
        id: 'search',
        title: 'docs.menu.group.search.title',
        description: 'docs.menu.group.search.description',
        examples: [
          {
            label: { code: 'search' },
            hint: say('docs.menu.hint.search'),
            element: <WorkspaceMenu words={words} withSearch />,
            code: workspaceCode(words, true),
          },
        ],
      },
      {
        id: 'triggers',
        title: 'docs.menu.group.triggers.title',
        description: 'docs.menu.group.triggers.description',
        examples: [
          {
            label: { code: 'IconButton' },
            hint: say('docs.menu.hint.iconButton'),
            ...actions({ trigger: 'icon' }),
          },
          {
            label: { code: 'FilterChip' },
            hint: say('docs.menu.hint.filterChip'),
            element: <StatusMenu words={words} />,
            code: statusCode(words, chip),
          },
        ],
      },
    ],
  }
}
