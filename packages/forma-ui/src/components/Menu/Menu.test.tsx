import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentProps } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { Menu, type MenuItem } from './Menu'

function renderMenu(overrides: Partial<Record<string, () => void>> = {}) {
  const items: MenuItem[] = [
    { id: 'assign', label: 'Assign owner', onSelect: overrides.assign ?? vi.fn() },
    { id: 'priority', label: 'Change priority', onSelect: vi.fn(), disabled: true },
    { id: 'resolve', label: 'Mark as resolved', onSelect: overrides.resolve ?? vi.fn() },
    { id: 'delete', label: 'Delete ticket', tone: 'danger', onSelect: vi.fn() },
  ]
  render(
    <>
      <Menu label="Ticket actions" items={items}>
        {(trigger) => <button {...trigger}>Actions</button>}
      </Menu>
      <p>Outside</p>
      <button>After</button>
    </>,
  )
  return screen.getByRole('button', { name: 'Actions' })
}

describe('Menu', () => {
  it('opens with the keyboard and focuses the first item', async () => {
    const trigger = renderMenu()
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    trigger.focus()
    await userEvent.keyboard('{ArrowDown}')
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('menu', { name: 'Ticket actions' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Assign owner' })).toHaveFocus()
  })

  it('opens on the last item with the up arrow', async () => {
    const trigger = renderMenu()
    trigger.focus()
    await userEvent.keyboard('{ArrowUp}')
    expect(screen.getByRole('menuitem', { name: 'Delete ticket' })).toHaveFocus()
  })

  it('points the trigger at the menu only while it is open', async () => {
    const trigger = renderMenu()
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu')
    expect(trigger).not.toHaveAttribute('aria-controls')
    await userEvent.click(trigger)
    expect(trigger).toHaveAttribute('aria-controls', screen.getByRole('menu').id)
  })

  it('skips disabled items, wraps around and jumps to an item by its first letter', async () => {
    const trigger = renderMenu()
    await userEvent.click(trigger)
    await userEvent.keyboard('{ArrowDown}')
    expect(screen.getByRole('menuitem', { name: 'Mark as resolved' })).toHaveFocus()
    await userEvent.keyboard('{ArrowDown}{ArrowDown}')
    expect(screen.getByRole('menuitem', { name: 'Assign owner' })).toHaveFocus()
    await userEvent.keyboard('d')
    expect(screen.getByRole('menuitem', { name: 'Delete ticket' })).toHaveFocus()
    await userEvent.keyboard('{Home}')
    expect(screen.getByRole('menuitem', { name: 'Assign owner' })).toHaveFocus()
    await userEvent.keyboard('{End}')
    expect(screen.getByRole('menuitem', { name: 'Delete ticket' })).toHaveFocus()
  })

  it('does not select a disabled item, and announces it as disabled', async () => {
    const trigger = renderMenu()
    await userEvent.click(trigger)
    const disabled = screen.getByRole('menuitem', { name: 'Change priority' })
    expect(disabled).toHaveAttribute('aria-disabled', 'true')
    await userEvent.click(disabled)
    expect(screen.getByRole('menu')).toBeInTheDocument()
  })

  it('runs the action, closes and returns the focus to the trigger', async () => {
    const resolve = vi.fn()
    const trigger = renderMenu({ resolve })
    await userEvent.click(trigger)
    await userEvent.click(screen.getByRole('menuitem', { name: 'Mark as resolved' }))
    expect(resolve).toHaveBeenCalledOnce()
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it('closes with Escape and when the pointer goes down outside', async () => {
    const trigger = renderMenu()
    await userEvent.click(trigger)
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
    await userEvent.click(trigger)
    await userEvent.click(screen.getByText('Outside'))
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  // The focus goes to the trigger before the browser moves it, so Tab lands on what follows the trigger and not on `body`.
  it('closes with Tab and the focus moves on from the trigger', async () => {
    const trigger = renderMenu()
    await userEvent.click(trigger)
    await userEvent.keyboard('{Tab}')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'After' })).toHaveFocus()
  })

  it('marks a destructive item without relying on its label', async () => {
    const trigger = renderMenu()
    await userEvent.click(trigger)
    expect(screen.getByRole('menuitem', { name: 'Delete ticket' }).className).toMatch(/danger/)
  })
})

describe('Menu inside a modal dialog', () => {
  it('mounts inside the dialog so that it stays visible in the top layer', async () => {
    render(
      <dialog open>
        <Menu label="Actions" items={[{ id: 'a', label: 'One', onSelect: vi.fn() }]}>
          {(trigger) => <button {...trigger}>Open</button>}
        </Menu>
      </dialog>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Open' }))
    expect(screen.getByRole('menu').closest('dialog')).not.toBeNull()
  })
})

describe('Menu with option rows, a search field and a note', () => {
  const spaces: MenuItem[] = [
    { id: 'a', label: 'Acme Studio', description: 'Admin', checked: true, searchable: true, onSelect: vi.fn() },
    { id: 'b', label: 'Northwind', description: 'Agent', checked: false, searchable: true, onSelect: vi.fn() },
    { id: 'c', label: 'Lumen Diseño', description: 'Agent', checked: false, searchable: true, onSelect: vi.fn() },
    { id: 'spaces', label: 'Your workspaces', separatorBefore: true, onSelect: vi.fn() },
  ]

  function renderSpaces(props: Partial<ComponentProps<typeof Menu>> = {}) {
    render(
      <Menu label="Switch workspace" items={spaces} {...props}>
        {(trigger) => <button {...trigger}>Workspace</button>}
      </Menu>,
    )
    return screen.getByRole('button', { name: 'Workspace' })
  }

  it('makes the options menuitemradio with the chosen one checked, and opens on it', async () => {
    const trigger = renderSpaces()
    await userEvent.click(trigger)
    const rows = screen.getAllByRole('menuitemradio')
    expect(rows.map((row) => row.getAttribute('aria-checked'))).toEqual(['true', 'false', 'false'])
    expect(screen.getByRole('separator')).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Your workspaces' })).toBeInTheDocument()
    await vi.waitFor(() => expect(rows[0]).toHaveFocus())
  })

  // The name is the label, and the description is a description: joining them into one name ("Northwind, Agent") would
  // build a sentence out of two strings, and a screen reader would read the role as part of the workspace's name.
  it('names an option by its label and describes it with its second line', async () => {
    await userEvent.click(renderSpaces())
    const northwind = screen.getByRole('menuitemradio', { name: 'Northwind' })
    expect(northwind).toHaveAccessibleName('Northwind')
    expect(northwind).toHaveAccessibleDescription('Agent')
  })

  it('leaves a decorative `leading` box out of the name', async () => {
    render(
      <Menu
        label="Switch workspace"
        items={[{ id: 'a', label: 'Northwind', leading: <span>NW</span>, onSelect: vi.fn() }]}
      >
        {(trigger) => <button {...trigger}>Workspace</button>}
      </Menu>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Workspace' }))
    expect(screen.getByRole('menuitem')).toHaveAccessibleName('Northwind')
  })

  it('does not count the separator as an item: the arrow keys skip it', async () => {
    const trigger = renderSpaces()
    trigger.focus()
    await userEvent.keyboard('{ArrowUp}')
    expect(screen.getByRole('menuitem', { name: 'Your workspaces' })).toHaveFocus()
    await userEvent.keyboard('{ArrowUp}')
    expect(screen.getByRole('menuitemradio', { name: /^Lumen/ })).toHaveFocus()
  })

  it('filters only the `searchable` items, ignoring accents, and what is typed does not trigger the first-letter jump', async () => {
    renderSpaces({ search: { label: 'Search workspaces', emptyText: 'Nothing matches.' } })
    await userEvent.click(screen.getByRole('button', { name: 'Workspace' }))
    const search = screen.getByRole('searchbox', { name: 'Search workspaces' })
    expect(screen.getByRole('menu')).not.toContainElement(search)
    await vi.waitFor(() => expect(search).toHaveFocus())
    await userEvent.keyboard('disen')
    expect(screen.getAllByRole('menuitemradio')).toHaveLength(1)
    expect(screen.getByRole('menuitemradio', { name: 'Lumen Diseño' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Your workspaces' })).toBeInTheDocument()
    expect(search).toHaveValue('disen')
  })

  it('moves from the search field down to the list with the arrow', async () => {
    renderSpaces({ search: { label: 'Search workspaces', emptyText: 'Nothing matches.' } })
    await userEvent.click(screen.getByRole('button', { name: 'Workspace' }))
    await vi.waitFor(() => expect(screen.getByRole('searchbox')).toHaveFocus())
    await userEvent.keyboard('{ArrowDown}')
    expect(screen.getByRole('menuitemradio', { name: 'Acme Studio' })).toHaveFocus()
  })

  // A live region that is added already filled is not announced: the node has to be there, empty, before the text.
  it('announces that nothing matches in a live region that was already in the menu', async () => {
    renderSpaces({ search: { label: 'Search workspaces', emptyText: 'Nothing matches.' } })
    await userEvent.click(screen.getByRole('button', { name: 'Workspace' }))
    const status = screen.getByRole('status')
    expect(status).toBeEmptyDOMElement()
    await userEvent.keyboard('zzz')
    expect(screen.getByRole('status')).toBe(status)
    expect(status).toHaveTextContent('Nothing matches.')
    await userEvent.keyboard('{Backspace}{Backspace}{Backspace}')
    expect(status).toBeEmptyDOMElement()
  })

  it('has no live region without a search field', async () => {
    await userEvent.click(renderSpaces())
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('clears the search with the first Escape and closes with the second, so it is empty when it opens again', async () => {
    const trigger = renderSpaces({ search: { label: 'Search workspaces', emptyText: 'Nothing matches.' } })
    await userEvent.click(trigger)
    await userEvent.keyboard('lumen')
    await userEvent.keyboard('{Escape}')
    expect(screen.getByRole('searchbox')).toHaveValue('')
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
    await userEvent.click(trigger)
    expect(screen.getByRole('searchbox', { name: 'Search workspaces' })).toHaveValue('')
    expect(screen.getAllByRole('menuitemradio')).toHaveLength(3)
  })

  it('closes with Tab from the search field, and the focus moves on from the trigger', async () => {
    render(
      <>
        <Menu
          label="Switch workspace"
          items={spaces}
          search={{ label: 'Search workspaces', emptyText: 'Nothing matches.' }}
        >
          {(trigger) => <button {...trigger}>Workspace</button>}
        </Menu>
        <button>After</button>
      </>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Workspace' }))
    await userEvent.keyboard('{Tab}')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'After' })).toHaveFocus()
  })

  it('describes the menu with the note, so that it is heard why an item is disabled', async () => {
    const trigger = renderSpaces({ note: 'It is your only workspace' })
    await userEvent.click(trigger)
    expect(screen.getByRole('menu')).toHaveAccessibleDescription('It is your only workspace')
  })
})
