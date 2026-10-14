import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createIntl } from 'react-intl'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'
import type { Locale } from '../../i18n'
import { messages } from '../../../test/messages'
import { menuDoc } from '.'
import { codeOf, renderReference, sectionsOfPage, textOutsideMessages } from '../referenceTestUtils'

const region = (name: string) => within(screen.getByRole('region', { name }))

describe('the reference of Menu', () => {
  it('lists its sections: the states, the search, the triggers and the usual ones', () => {
    renderReference('Menu')

    expect(screen.getByRole('heading', { level: 1, name: 'Menu' })).toBeInTheDocument()
    expect(sectionsOfPage()).toEqual(['States', 'Search', 'Triggers', 'Usage', 'API', 'Accessibility', 'Limitations'])
  })

  it('opens the menu of actions with the keyboard, with a disabled item, a separator and a danger item', async () => {
    renderReference('Menu')
    const [trigger] = region('States').getAllByRole('button', { name: 'Actions' })

    trigger!.focus()
    await userEvent.keyboard('{ArrowDown}')

    const menu = screen.getByRole('menu', { name: 'Ticket actions' })
    expect(within(menu).getAllByRole('menuitem')).toHaveLength(5)
    expect(screen.getByRole('menuitem', { name: 'Assign owner' })).toHaveFocus()
    expect(screen.getByRole('menuitem', { name: 'Change priority' })).not.toHaveAttribute('aria-disabled')
    expect(screen.getByRole('separator')).toBeInTheDocument()
    await userEvent.keyboard('{Escape}')
    expect(trigger).toHaveFocus()
  })

  it('disables an item and explains why in a note that describes the menu', async () => {
    renderReference('Menu')
    const triggers = region('States').getAllByRole('button', { name: 'Actions' })

    await userEvent.click(triggers[2]!)

    expect(screen.getByRole('menuitem', { name: 'Change priority' })).toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByRole('menu')).toHaveAccessibleDescription('Only an admin can change the priority.')
    const code = codeOf('States')
    expect(code).toContain("{ id: 'priority', label: 'Change priority', disabled: true, onSelect: changePriority },")
    expect(code).toContain('note="Only an admin can change the priority."')
  })

  it('names an option by its label and describes it with the role, and the choice moves to the chosen one', async () => {
    renderReference('Menu')

    await userEvent.click(region('States').getByRole('button', { name: 'Workspace' }))
    const northwind = screen.getByRole('menuitemradio', { name: 'Northwind' })

    expect(northwind).toHaveAccessibleDescription('Agent')
    expect(screen.getByRole('menuitemradio', { name: 'Acme Studio' })).toBeChecked()
    await userEvent.click(northwind)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    await userEvent.click(region('States').getByRole('button', { name: 'Workspace' }))
    expect(screen.getByRole('menuitemradio', { name: 'Northwind' })).toBeChecked()
  })

  it('filters the workspaces by the text, ignoring accents, and says when none matches', async () => {
    renderReference('Menu')

    await userEvent.click(region('Search').getByRole('button', { name: 'Workspace' }))
    await userEvent.keyboard('disen')

    expect(screen.getAllByRole('menuitemradio').map((option) => option.textContent)).toEqual(
      expect.arrayContaining([expect.stringContaining('Lumen Diseño')]),
    )
    expect(screen.getAllByRole('menuitemradio')).toHaveLength(1)
    expect(screen.getByRole('menuitem', { name: 'Your workspaces' })).toBeInTheDocument()
    await userEvent.clear(screen.getByRole('searchbox', { name: 'Search workspaces' }))
    await userEvent.keyboard('zzz')
    // The page has live regions of its own: the one of the menu is the one that says it.
    expect(screen.getAllByRole('status').map((status) => status.textContent)).toContain('No workspace matches.')
    expect(codeOf('Search')).toContain("search={{ label: 'Search workspaces', emptyText: 'No workspace matches.' }}")
  })

  it('opens from an IconButton that keeps its name, and from a FilterChip that is not a toggle', async () => {
    renderReference('Menu')
    const triggers = region('Triggers')

    await userEvent.click(triggers.getByRole('button', { name: 'More actions' }))
    expect(screen.getByRole('menu', { name: 'Ticket actions' })).toBeInTheDocument()
    await userEvent.keyboard('{Escape}')

    const chip = triggers.getByRole('button', { name: 'Status: All' })
    expect(chip).not.toHaveAttribute('aria-pressed')
    expect(chip).toHaveAttribute('aria-haspopup', 'menu')
    await userEvent.click(chip)
    await userEvent.click(screen.getByRole('menuitemradio', { name: 'Open' }))
    expect(chip).toHaveAccessibleName('Status: Open')
    expect(chip).toHaveFocus()
  })

  it('shows the JSX of each trigger', () => {
    renderReference('Menu')

    const code = codeOf('Triggers')
    expect(code).toContain('<IconButton icon="more" label="More actions" {...trigger} />')
    expect(code).toContain('<FilterChip selected={status !== 0} {...trigger}>')
    expect(code).toContain('Status: {options[status]}')
  })

  it('documents its own props, and the shapes of an item, of the search and of the trigger', () => {
    renderReference('Menu')

    const rows = within(screen.getByRole('region', { name: 'API' })).getAllByRole('listitem')
    const names = rows.map((item) => item.firstElementChild?.textContent)
    expect(names.slice(0, 7)).toEqual(['label', 'items', 'placement', 'search', 'note', 'wide', 'children'])
    expect(names).toEqual(
      expect.arrayContaining(['separatorBefore', 'searchable', 'emptyText', 'aria-haspopup', 'onKeyDown']),
    )
  })

  it('writes the page, its labels and its JSX in Spanish', async () => {
    renderReference('Menu', 'es')

    expect(screen.getByRole('region', { name: 'Búsqueda' })).toBeInTheDocument()
    await userEvent.click(region('Disparadores').getByRole('button', { name: 'Más acciones' }))
    expect(screen.getByRole('menu', { name: 'Acciones del ticket' })).toBeInTheDocument()
    expect(codeOf('Búsqueda')).toContain("search={{ label: 'Buscar espacio', emptyText: 'Ningún espacio coincide.' }}")
    expect(codeOf('Búsqueda')).not.toContain('Search workspaces')
  })

  it('names the handler of the destructive row by its action, not by its id', () => {
    renderReference('Menu')

    expect(codeOf('States')).toContain(
      "{ id: 'delete', label: 'Delete ticket', tone: 'danger', onSelect: deleteTicket },",
    )
  })

  // What the page shows, and what the copy button copies, has to be code that parses: an example that does not is a
  // mistake that a reader finds only after pasting it. `delete` as the name of a handler, for one, does not. The page
  // shows the code of one example at a time, so the examples are read where they are made, in each language.
  it.each<Locale>(['en', 'es'])('writes JavaScript that parses in every example, in %s', (locale) => {
    const { usage, groups } = menuDoc.examples(createIntl({ locale, messages: messages[locale] }))
    const examples = [usage, ...groups.flatMap((group) => group.examples)].flatMap(({ code }) => (code ? [code] : []))

    expect(examples.length).toBeGreaterThanOrEqual(7)
    for (const code of [menuDoc.importCode, ...examples]) {
      const parts = code.split('\n\n')
      // Declarations first and the JSX last, which is how a component writes them; an import stands alone.
      const source = code.startsWith('import ')
        ? code
        : `function Example() {\n${parts.slice(0, -1).join('\n\n')}\nreturn (\n${parts.at(-1)}\n)\n}`
      const { diagnostics } = ts.transpileModule(source, {
        fileName: 'example.tsx',
        reportDiagnostics: true,
        compilerOptions: { jsx: ts.JsxEmit.ReactJSX },
      })
      expect(
        diagnostics?.map(({ messageText }) => ts.flattenDiagnosticMessageText(messageText, ' ')),
        code,
      ).toEqual([])
    }
  })

  it('writes nothing of its own on the page: every text comes from a message', () => {
    expect(
      textOutsideMessages('Menu', [
        'checked',
        'disabled',
        'note',
        'search',
        'IconButton',
        'FilterChip',
        'MenuItem',
        'MenuSearch',
        'MenuTriggerProps',
      ]),
    ).toEqual([])
  })
})
