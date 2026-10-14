import { Button, IconButton, Menu, type MenuItem } from '@yelison/forma-ui'
import type { MenuWords } from './words'

export interface ActionsMenuProps {
  words: MenuWords
  /** Makes «Change priority» unavailable. */
  priorityDisabled?: boolean
  /** Explains, under the list, why an action is unavailable. */
  withNote?: boolean
  /** What opens the menu: a button with text, or an icon button with the `more` icon. */
  trigger?: 'button' | 'icon'
}

const noop = () => {}

/** The items of the ticket menu, in the order of its JSX: a plain action, a disabled one, a separator and a danger one. */
export function actionItems(
  { assign, priority, resolve, archive, delete: remove }: MenuWords,
  priorityDisabled: boolean,
) {
  return [
    { id: 'assign', label: assign, onSelect: noop },
    { id: 'priority', label: priority, disabled: priorityDisabled, onSelect: noop },
    { id: 'resolve', label: resolve, onSelect: noop },
    { id: 'archive', label: archive, separatorBefore: true, onSelect: noop },
    { id: 'delete', label: remove, tone: 'danger', onSelect: noop },
  ] satisfies MenuItem[]
}

/** The menu of the actions of a ticket, as the live half of the examples of the states and of the triggers. */
export function ActionsMenu({
  words,
  priorityDisabled = false,
  withNote = false,
  trigger = 'button',
}: ActionsMenuProps) {
  return (
    <Menu label={words.label} items={actionItems(words, priorityDisabled)} note={withNote ? words.note : undefined}>
      {(props) =>
        trigger === 'icon' ? (
          <IconButton icon="more" label={words.more} {...props} />
        ) : (
          <Button variant="secondary" {...props}>
            {words.trigger}
          </Button>
        )
      }
    </Menu>
  )
}
