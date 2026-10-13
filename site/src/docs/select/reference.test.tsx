import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { codeOf, renderReference, sectionsOfPage, textOutsideMessages } from '../referenceTestUtils'

const region = (name: string) => within(screen.getByRole('region', { name }))

describe('the reference of Select', () => {
  it('lists its sections: the states and the usual ones', () => {
    renderReference('Select')

    expect(screen.getByRole('heading', { level: 1, name: 'Select' })).toBeInTheDocument()
    expect(sectionsOfPage()).toEqual(['States', 'Usage', 'API', 'Accessibility', 'Limitations'])
  })

  it('shows the states that the library has, each one a select with its label and its JSX', () => {
    renderReference('Select')

    const states = region('States')
    expect(states.getAllByRole('combobox', { name: 'Priority' })).toHaveLength(6)
    for (const state of ['Default', 'Focus', 'With hint', 'With error', 'Disabled']) {
      expect(states.getByText(state)).toBeInTheDocument()
    }
    const code = codeOf('States')
    expect(code).toContain('<Select label="Priority" defaultValue="medium">\n  <option value="low">Low</option>')
    expect(code).toContain('hint="Sets the order of the queue."')
    expect(code).toContain('error="Choose a priority."')
    expect(code).toContain('<option value="" disabled>Select an option</option>')
  })

  it('shows its error without announcing it, so that opening the page is silent', () => {
    renderReference('Select')

    const invalid = region('States')
      .getAllByRole('combobox')
      .filter((select) => select.getAttribute('aria-invalid') === 'true')
    expect(invalid).toHaveLength(1)
    expect(invalid[0]).toHaveAccessibleDescription('Choose a priority.')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('tells disabled from unavailable: one leaves the tab order, the other keeps the focus', async () => {
    renderReference('Select')
    const [disabled, unavailable] = region('States').getAllByRole('combobox').slice(-2)

    expect(disabled).toBeDisabled()
    expect(unavailable).toBeEnabled()
    expect(unavailable).toHaveAttribute('aria-disabled', 'true')
    await userEvent.click(unavailable!)
    expect(unavailable).toHaveFocus()
  })

  it('picks an option, as a native select does', async () => {
    renderReference('Select')
    const [first] = region('States').getAllByRole('combobox', { name: 'Priority' })

    await userEvent.selectOptions(first!, 'High')

    expect(first).toHaveValue('high')
  })

  it('documents the props of Select and the attributes that it changes', () => {
    renderReference('Select')

    const api = region('API')
    expect(api.getByRole('heading', { name: 'Props of Select' })).toBeInTheDocument()
    expect(api.getAllByRole('listitem').map((item) => item.firstElementChild?.textContent)).toEqual([
      'label',
      'hint',
      'error',
      'announce',
      'fieldClassName',
      'id',
      'aria-describedby',
      'aria-invalid',
      'aria-disabled',
      'className',
      'children',
    ])
  })

  it('says in its limitations that a select cannot be read-only and that aria-disabled stops nothing', () => {
    renderReference('Select')

    expect(region('Limitations').getByText(/no read-only select/)).toBeInTheDocument()
    expect(region('Limitations').getByText(/does not stop a change/)).toBeInTheDocument()
  })

  it('writes the page, its labels and its JSX in Spanish', () => {
    renderReference('Select', 'es')

    expect(screen.getByRole('region', { name: 'Estados' })).toBeInTheDocument()
    expect(region('Estados').getAllByRole('combobox', { name: 'Prioridad' })).toHaveLength(6)
    expect(codeOf('Estados')).toContain('<option value="high">Alta</option>')
  })

  it('writes nothing of its own on the page: every text comes from a message', () => {
    expect(textOutsideMessages('Select', ['aria-disabled'])).toEqual([])
  })
})
