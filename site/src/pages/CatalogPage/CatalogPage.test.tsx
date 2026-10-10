import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { markedMessages, renderInSite } from '../../../test/render'
import { untranslatedText } from '../../../test/untranslated'
import { routes } from '../../routes'
import { CatalogPage } from './CatalogPage'

const route = routes.find((candidate) => candidate.key === 'components')!
const renderCatalog = (options?: Parameters<typeof renderInSite>[1]) =>
  renderInSite(<CatalogPage route={route} />, options)

const rowNames = () => screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent)
const row = (name: string) => screen.getByRole('region', { name })

describe('CatalogPage', () => {
  it('has a row for each family of the library, in reading order, and none for what the library does not have yet', () => {
    renderCatalog()

    expect(screen.getByRole('heading', { level: 1, name: 'Components' })).toBeInTheDocument()
    expect(rowNames()).toEqual(['Button', 'Input', 'Radio', 'Badge', 'Icon', 'Tabs', 'Tooltip', 'Dialog'])
    for (const planned of ['Checkbox', 'Switch', 'NavItem']) {
      expect(screen.queryByRole('heading', { name: planned })).not.toBeInTheDocument()
    }
  })

  it('shows the error of the Input specimen, linked to its input, without announcing it', () => {
    renderCatalog()

    const input = within(row('Input')).getByRole('textbox', { name: 'Full name', description: 'Enter your full name.' })
    expect(input).toBeInvalid()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('links each row to the reference of its family, and says so when a family has none yet', () => {
    renderCatalog()

    expect(within(row('Button')).getByRole('link', { name: /View the Button reference/ })).toHaveAttribute(
      'href',
      '/docs/components/button/',
    )
    expect(within(row('Dialog')).getByRole('link', { name: /View the Dialog reference/ })).toHaveAttribute(
      'href',
      '/docs/components/dialog/',
    )
    expect(within(row('Icon')).queryByRole('link')).not.toBeInTheDocument()
    expect(within(row('Icon')).getByText('Reference page coming soon')).toBeInTheDocument()
  })

  it('links the row of Button to the reference of IconButton too, which the row shows', () => {
    renderCatalog()

    const links = within(row('Button')).getAllByRole('link')
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/docs/components/button/',
      '/docs/components/icon-button/',
    ])
    expect(links[1]).toHaveAccessibleName(/View the IconButton reference/)
  })

  describe('the specimens', () => {
    it('show the four variants of Button, each one labeled, and its disabled, loading and icon-only forms', () => {
      renderCatalog()

      const button = within(row('Button'))
      for (const variant of ['primary', 'secondary', 'ghost', 'danger']) {
        const specimen = button.getByText(`variant="${variant}"`).closest('li')!
        expect(within(specimen).getByRole('button', { name: 'Continue' })).toBeEnabled()
      }
      const disabled = button.getByText('Disabled').closest('li')!
      expect(within(disabled).getByRole('button', { name: 'Continue' })).toBeDisabled()
      expect(button.getByRole('button', { name: 'Saving…' })).toHaveAttribute('aria-busy', 'true')
      expect(button.getByRole('button', { name: 'Settings' })).toBeInTheDocument()
    })

    it('tell disabled from read-only in Input, and show its error where a screen reader reads it', () => {
      renderCatalog()

      const input = within(row('Input'))
      const fields = input.getAllByRole('textbox', { name: 'Full name' })
      expect(fields).toHaveLength(5)
      expect(fields.filter((field) => field.hasAttribute('disabled'))).toHaveLength(1)
      expect(fields.filter((field) => field.hasAttribute('readonly'))).toHaveLength(1)
      expect(input.getByRole('textbox', { description: 'Enter your full name.' })).toBeInvalid()
    })

    it('show Tabs with three panels, once with the first tab selected and once with the second', async () => {
      renderCatalog()

      const tabs = within(row('Tabs'))
      const lists = tabs.getAllByRole('tablist', { name: 'Project sections' })
      expect(lists).toHaveLength(2)
      const [first, second] = lists.map((list) => within(list.parentElement!))
      expect(first!.getByRole('tab', { selected: true })).toHaveTextContent('Overview')
      expect(second!.getByRole('tab', { selected: true })).toHaveTextContent('Activity')

      await userEvent.click(first!.getByRole('tab', { name: 'Files' }))
      expect(first!.getByRole('tabpanel')).toHaveTextContent('The attached documents.')
      expect(second!.getByRole('tabpanel')).toHaveTextContent('The latest changes.')
    })

    it('show Radio as three groups that work apart: none selected, one selected and one with a disabled option', async () => {
      renderCatalog()

      const groups = within(row('Radio')).getAllByRole('group', { name: 'Plan' })
      expect(groups).toHaveLength(3)
      const [empty, preselected, disabled] = groups.map((group) => within(group))
      expect(empty!.getAllByRole('radio').filter((radio) => (radio as HTMLInputElement).checked)).toHaveLength(0)
      expect(preselected!.getByRole('radio', { name: 'Team' })).toBeChecked()
      expect(disabled!.getByRole('radio', { name: 'Business' })).toBeDisabled()

      await userEvent.click(empty!.getByRole('radio', { name: 'Business' }))
      expect(empty!.getByRole('radio', { name: 'Business' })).toBeChecked()
      expect(preselected!.getByRole('radio', { name: 'Team' })).toBeChecked()
      expect(disabled!.getByRole('radio', { name: 'Free' })).toBeChecked()
    })

    it('open a Dialog from its button, and close it with its own button', async () => {
      renderCatalog()

      await userEvent.click(within(row('Dialog')).getByRole('button', { name: 'Delete item' }))
      const dialog = screen.getByRole('dialog', { name: 'Delete this item?' })
      expect(dialog).toHaveAccessibleDescription('Review the action before continuing.')

      await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }))
      expect(screen.queryByRole('dialog', { name: 'Delete this item?' })).not.toBeInTheDocument()
    })

    it('are written in the language of the page', () => {
      renderCatalog({ locale: 'es' })

      expect(screen.getByRole('heading', { level: 1, name: 'Componentes' })).toBeInTheDocument()
      expect(within(row('Button')).getByRole('button', { name: 'Guardando…' })).toBeInTheDocument()
      expect(within(row('Dialog')).getByRole('button', { name: 'Eliminar elemento' })).toBeInTheDocument()
    })

    it('have no text that a translation does not reach', () => {
      const { container } = renderCatalog({ messages: markedMessages })

      // The names of the components, and the props and values that a label quotes, are code and are never translated.
      const code = /^(variant|tone|icon)="[\w-]+"$|^(IconButton|search|plus|check|arrow|bell|settings|menu|home)$/
      const componentNames = ['Button', 'Input', 'Radio', 'Badge', 'Icon', 'Tabs', 'Tooltip', 'Dialog']
      expect(untranslatedText(container, componentNames).filter((text) => !code.test(text))).toEqual([])
    })
  })

  describe('the filters', () => {
    it('start with every family and say how many there are', () => {
      renderCatalog()

      expect(screen.getByRole('radio', { name: 'All' })).toBeChecked()
      expect(screen.getByRole('status')).toHaveTextContent(/^Showing 8 components$/)
    })

    it('offer the categories in the order of the design, with Navigation after Forms', () => {
      renderCatalog()

      const categories = within(screen.getByRole('group', { name: 'Category' }))
      expect(
        categories.getAllByRole('radio').map((radio) => (radio as HTMLInputElement).labels?.[0]?.textContent),
      ).toEqual(['All', 'Actions', 'Forms', 'Navigation', 'Display', 'Feedback'])
    })

    it('keep only the families of a category, and announce the new count', async () => {
      renderCatalog()

      await userEvent.click(screen.getByRole('radio', { name: 'Feedback' }))

      expect(rowNames()).toEqual(['Tooltip', 'Dialog'])
      expect(screen.getByRole('status')).toHaveTextContent(/^Showing 2 components$/)
    })

    it('keep Input and Radio under Forms', async () => {
      renderCatalog()

      await userEvent.click(screen.getByRole('radio', { name: 'Forms' }))

      expect(rowNames()).toEqual(['Input', 'Radio'])
      expect(screen.getByRole('status')).toHaveTextContent(/^Showing 2 components$/)
    })

    it('keep only Tabs under Navigation, which the design has between Forms and Feedback', async () => {
      renderCatalog()

      await userEvent.click(screen.getByRole('radio', { name: 'Navigation' }))

      expect(rowNames()).toEqual(['Tabs'])
      expect(within(row('Tabs')).getByRole('link', { name: /View the Tabs reference/ })).toHaveAttribute(
        'href',
        '/docs/components/tabs/',
      )
    })

    it('can be operated from the keyboard, with the arrows moving through the categories', async () => {
      renderCatalog()
      screen.getByRole('radio', { name: 'All' }).focus()

      await userEvent.keyboard('{ArrowRight}')

      expect(screen.getByRole('radio', { name: 'Actions' })).toBeChecked()
      expect(rowNames()).toEqual(['Button'])
      expect(screen.getByRole('status')).toHaveTextContent(/^Showing 1 component$/)
    })

    it('narrow the list by name, ignoring case, and find IconButton in the row of Button', async () => {
      renderCatalog()

      await userEvent.type(screen.getByRole('textbox', { name: 'Filter by name' }), 'iconbutton')

      expect(rowNames()).toEqual(['Button'])
    })

    it('say that nothing matches, and clear the filters from there with focus on the first one', async () => {
      renderCatalog()
      await userEvent.click(screen.getByRole('radio', { name: 'Forms' }))
      await userEvent.type(screen.getByRole('textbox', { name: 'Filter by name' }), 'badge')

      expect(screen.getByText('No component matches these filters.')).toBeInTheDocument()
      expect(screen.getByRole('status')).toHaveTextContent(/^Showing 0 components$/)
      expect(screen.queryAllByRole('heading', { level: 2 })).toEqual([])

      await userEvent.click(screen.getByRole('button', { name: 'Clear filters' }))

      expect(rowNames()).toHaveLength(8)
      expect(screen.getByRole('radio', { name: 'All' })).toBeChecked()
      expect(screen.getByRole('textbox', { name: 'Filter by name' })).toHaveValue('')
      expect(screen.getByRole('textbox', { name: 'Filter by name' })).toHaveFocus()
    })

    it('count in the language of the page', async () => {
      renderCatalog({ locale: 'es' })
      expect(screen.getByRole('status')).toHaveTextContent(/^Mostrando 8 componentes$/)

      await userEvent.click(screen.getByRole('radio', { name: 'Acciones' }))

      expect(screen.getByRole('status')).toHaveTextContent(/^Mostrando 1 componente$/)
    })

    it('keep what was typed in a specimen while its row is out of the list', async () => {
      renderCatalog()
      const field = () => within(row('Input')).getAllByRole('textbox', { name: 'Full name' }).at(0)!
      await userEvent.type(field(), 'Luz')

      await userEvent.click(screen.getByRole('radio', { name: 'Feedback' }))
      expect(screen.queryByRole('region', { name: 'Input' })).not.toBeInTheDocument()
      await userEvent.click(screen.getByRole('radio', { name: 'All' }))

      expect(field()).toHaveValue('Luz')
    })
  })
})
