import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { codeOf, renderReference, sectionsOfPage, textOutsideMessages } from '../referenceTestUtils'

const region = (name: string) => within(screen.getByRole('region', { name }))

describe('the reference of Tabs', () => {
  it('lists its sections: the states, the controlled one and the usual ones', () => {
    renderReference('Tabs')

    expect(screen.getByRole('heading', { level: 1, name: 'Tabs' })).toBeInTheDocument()
    expect(sectionsOfPage()).toEqual(['States', 'Controlled', 'Usage', 'API', 'Accessibility', 'Limitations'])
  })

  it('shows the tabs working: the first one selected by default, and the one of defaultValue in the second', () => {
    renderReference('Tabs')

    const [first, second] = region('States').getAllByRole('tablist')
    expect(within(first!.parentElement!).getByRole('tab', { selected: true })).toHaveTextContent('Overview')
    expect(within(second!.parentElement!).getByRole('tab', { selected: true })).toHaveTextContent('Activity')
    expect(within(second!.parentElement!).getByRole('tabpanel')).toHaveTextContent('The latest changes.')
  })

  it('moves between the tabs of an example with the keyboard', async () => {
    renderReference('Tabs')
    const [first] = region('States').getAllByRole('tablist')

    await userEvent.click(within(first!).getByRole('tab', { name: 'Overview' }))
    await userEvent.keyboard('{ArrowRight}')

    expect(within(first!).getByRole('tab', { name: 'Activity' })).toHaveFocus()
    expect(within(first!.parentElement!).getByRole('tabpanel')).toHaveTextContent('The latest changes.')
  })

  it('shows the state of the parent under a controlled example, which follows the tab that is selected', async () => {
    renderReference('Tabs')
    const controlled = region('Controlled')
    expect(controlled.getByText('Selected: files')).toBeInTheDocument()

    await userEvent.click(controlled.getByRole('tab', { name: 'Overview' }))

    expect(controlled.getByText('Selected: overview')).toBeInTheDocument()
    expect(controlled.getByRole('tabpanel')).toHaveTextContent('A summary of the project.')
  })

  it('prints the JSX of what it shows, with the words of the examples', () => {
    renderReference('Tabs')

    expect(codeOf('States')).toContain("{ id: 'activity', label: 'Activity', content: 'The latest changes.' },")
    expect(codeOf('States')).toContain('defaultValue="activity"')
    expect(codeOf('Controlled')).toContain('value={value}')
    expect(codeOf('Controlled')).toContain('<p>Selected: {value}</p>')
  })

  it('documents every prop of Tabs and the three fields of an item', () => {
    renderReference('Tabs')

    const api = within(screen.getByRole('region', { name: 'API' }))
    expect(api.getByRole('heading', { name: 'Props of Tabs' })).toBeInTheDocument()
    expect(api.getByRole('heading', { name: 'Fields of each item (TabItem)' })).toBeInTheDocument()
    const documented = api.getAllByRole('listitem').map((item) => item.firstElementChild?.textContent)
    expect(documented).toEqual([
      'label',
      'items',
      'value',
      'defaultValue',
      'onChange',
      'className',
      'id',
      'label',
      'content',
    ])
  })

  it('says in its limitations that the selected tab differs by color only', () => {
    renderReference('Tabs')

    expect(region('Limitations').getByText(/told apart by color only/)).toBeInTheDocument()
  })

  it('writes the page and its JSX in Spanish', () => {
    renderReference('Tabs', 'es')

    expect(screen.getByRole('region', { name: 'Controlado' })).toBeInTheDocument()
    expect(screen.getAllByRole('tab', { name: 'Actividad' }).length).toBeGreaterThan(0)
    expect(codeOf('Controlado')).toContain('<p>Seleccionada: {value}</p>')
    expect(codeOf('Estados')).toContain("{ id: 'files', label: 'Archivos', content: 'Los documentos adjuntos.' },")
  })

  it('writes nothing of its own on the page: every text comes from a message', () => {
    expect(textOutsideMessages('Tabs', ['TabItem', 'defaultValue="activity"', 'value, onChange'])).toEqual([])
  })
})
