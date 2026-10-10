import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { codeOf, renderReference, sectionsOfPage, textOutsideMessages } from '../referenceTestUtils'

const region = (name: string) => within(screen.getByRole('region', { name }))

describe('the reference of Radio', () => {
  it('lists its sections: the states, the controlled one and the usual ones', () => {
    renderReference('Radio')

    expect(screen.getByRole('heading', { level: 1, name: 'Radio' })).toBeInTheDocument()
    expect(sectionsOfPage()).toEqual(['States', 'Controlled', 'Usage', 'API', 'Accessibility', 'Limitations'])
  })

  it('shows every group as a fieldset with its legend, so that its options are one named group', () => {
    renderReference('Radio')

    const groups = region('States').getAllByRole('group', { name: 'Plan' })
    expect(groups).toHaveLength(3)
    for (const group of groups) expect(within(group).getAllByRole('radio')).toHaveLength(3)
  })

  it('keeps the selection of each group apart, though every group of the page has the same options', async () => {
    renderReference('Radio')
    const [first, second] = region('States').getAllByRole('group', { name: 'Plan' })

    await userEvent.click(within(first!).getByRole('radio', { name: 'Business' }))

    expect(within(first!).getByRole('radio', { name: 'Business' })).toBeChecked()
    expect(within(second!).getByRole('radio', { name: 'Team' })).toBeChecked()
    expect(within(second!).getByRole('radio', { name: 'Business' })).not.toBeChecked()
  })

  it('starts the second group with Team selected and the third with Business disabled', () => {
    renderReference('Radio')
    const [, preselected, disabled] = region('States').getAllByRole('group', { name: 'Plan' })

    expect(within(preselected!).getByRole('radio', { name: 'Team' })).toBeChecked()
    expect(within(disabled!).getByRole('radio', { name: 'Free' })).toBeChecked()
    expect(within(disabled!).getByRole('radio', { name: 'Business' })).toBeDisabled()
  })

  it('moves between the options of a group with the arrow keys, skipping the disabled one', async () => {
    renderReference('Radio')
    const disabled = region('States').getAllByRole('group', { name: 'Plan' })[2]!

    await userEvent.click(within(disabled).getByRole('radio', { name: 'Free' }))
    await userEvent.keyboard('{ArrowDown}')

    expect(within(disabled).getByRole('radio', { name: 'Team' })).toHaveFocus()
    await userEvent.keyboard('{ArrowDown}')
    expect(within(disabled).getByRole('radio', { name: 'Free' })).toHaveFocus()
  })

  it('shows the state of the parent under the controlled example, which follows the option that is selected', async () => {
    renderReference('Radio')
    const controlled = region('Controlled')
    expect(controlled.getByText('Selected: team')).toBeInTheDocument()

    await userEvent.click(controlled.getByRole('radio', { name: 'Free' }))

    expect(controlled.getByText('Selected: free')).toBeInTheDocument()
    expect(controlled.getByRole('radio', { name: 'Free' })).toBeChecked()
  })

  it('prints the JSX of what it shows: a fieldset, its legend and one Radio for each option', () => {
    renderReference('Radio')

    expect(codeOf('States')).toContain('<fieldset>\n  <legend>Plan</legend>')
    expect(codeOf('States')).toContain('<Radio name="plan" value="team" label="Team" />')
    expect(codeOf('States')).toContain('defaultChecked')
    expect(codeOf('States')).toContain('disabled')
    expect(codeOf('Controlled')).toContain("checked={value === 'free'}")
    expect(codeOf('Controlled')).toContain('<p>Selected: {value}</p>')
  })

  it('documents the label, the class name that goes to the label and the other attributes', () => {
    renderReference('Radio')

    const api = within(screen.getByRole('region', { name: 'API' }))
    expect(api.getByRole('heading', { name: 'Props of Radio' })).toBeInTheDocument()
    const documented = api.getAllByRole('listitem').map((item) => item.firstElementChild?.textContent)
    expect(documented).toEqual(['label', 'className'])
    expect(api.getAllByRole('listitem')[1]).toHaveTextContent(/^className.*Added to the label/)
  })

  it('says in its limitations that a radio cannot be read-only and that its border is faint', () => {
    renderReference('Radio')

    expect(region('Limitations').getByText(/no read-only radio/)).toBeInTheDocument()
    expect(region('Limitations').getByText(/faint against the page/)).toBeInTheDocument()
  })

  it('writes the page and its JSX in Spanish', () => {
    renderReference('Radio', 'es')

    expect(screen.getByRole('region', { name: 'Controlado' })).toBeInTheDocument()
    expect(screen.getAllByRole('radio', { name: 'Equipo' }).length).toBeGreaterThan(0)
    expect(codeOf('Controlado')).toContain('<p>Seleccionada: {value}</p>')
    expect(codeOf('Estados')).toContain('<Radio name="plan" value="business" label="Empresa" />')
  })

  it('writes nothing of its own on the page: every text comes from a message', () => {
    expect(textOutsideMessages('Radio', ['defaultChecked', 'checked, onChange'])).toEqual([])
  })
})
