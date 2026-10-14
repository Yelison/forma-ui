import { Avatar, Button, Menu, type MenuItem } from '@yelison/forma-ui'
import { useState } from 'react'
import type { MenuWords } from './words'

export interface WorkspaceMenuProps {
  words: MenuWords
  /** Adds the field that filters the workspaces. */
  withSearch?: boolean
}

/**
 * A menu of options: the workspace of the person is the checked one, and the application keeps which one it is. A
 * workspace has two lines (its name and the person's role in it), so the menu is wide. The last row is an action that
 * the search field never hides.
 */
export function WorkspaceMenu({ words, withSearch = false }: WorkspaceMenuProps) {
  const { names, agent, admin, search, empty, all, label, trigger } = words.workspace
  const [current, setCurrent] = useState(0)
  const items: MenuItem[] = [
    ...names.map((name, index) => ({
      id: name,
      label: name,
      description: index === 0 ? admin : agent,
      leading: <Avatar name={name} size="small" decorative />,
      checked: index === current,
      searchable: true,
      onSelect: () => setCurrent(index),
    })),
    { id: 'all', label: all, separatorBefore: true, onSelect: () => {} },
  ]

  return (
    <Menu label={label} items={items} wide search={withSearch ? { label: search, emptyText: empty } : undefined}>
      {(props) => (
        <Button variant="secondary" {...props}>
          {trigger}
        </Button>
      )}
    </Menu>
  )
}
