import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { messages } from '../../i18n'
import { codeOf, renderReference, sectionsOfPage, textOutsideMessages } from '../referenceTestUtils'

describe('the reference of Input', () => {
  it('lists its sections: the states, Field and the usual ones', () => {
    renderReference('Input')

    expect(screen.getByRole('heading', { level: 1, name: 'Input' })).toBeInTheDocument()
    expect(sectionsOfPage()).toEqual(['States', 'Field', 'Usage', 'API', 'Accessibility', 'Limitations'])
  })

  it('shows the states that the library has, each one a field with its label and its JSX', () => {
    renderReference('Input')

    const states = screen.getByRole('region', { name: 'States' })
    expect(within(states).getAllByRole('textbox', { name: 'Full name' })).toHaveLength(7)
    for (const state of ['Default', 'Focus', 'With hint', 'With error', 'Hint and error', 'Disabled', 'Read-only']) {
      expect(within(states).getByText(state)).toBeInTheDocument()
    }
    const code = codeOf('States')
    expect(code).toContain('<Input label="Full name" />')
    expect(code).toContain('<Input label="Full name" hint="As it appears on your ID." />')
    expect(code).toContain('error="Enter your full name."')
    expect(code).toContain('defaultValue="Ana Pérez"\n  readOnly\n/>')
  })

  it('tells disabled from read-only: one leaves the tab order, the other keeps the focus', () => {
    renderReference('Input')

    const [disabled, readOnly] = within(screen.getByRole('region', { name: 'States' })).getAllByDisplayValue(
      'Ana Pérez',
    )
    expect(disabled).toBeDisabled()
    expect(disabled).not.toHaveAttribute('readonly')
    expect(readOnly).toBeEnabled()
    expect(readOnly).toHaveAttribute('readonly')
  })

  it('links the hint and the error to the input, the error first', () => {
    renderReference('Input')

    const states = within(screen.getByRole('region', { name: 'States' }))
    const both = states.getAllByRole('textbox', { name: 'Full name' })[4]
    expect(both).toHaveAccessibleDescription('Enter your full name. As it appears on your ID.')
    expect(both).toBeInvalid()
  })

  it('shows Field around a control of the consumer, linked to its label and hint', () => {
    renderReference('Input')

    const field = within(screen.getByRole('region', { name: 'Field' }))
    const select = field.getByRole('combobox', { name: 'Plan' })
    expect(select).toHaveAccessibleDescription('You can change it later.')
    expect(codeOf('Field')).toContain('<select {...control}>')
  })

  it('writes a text with a double quote into the JSX as an expression, so that the code still compiles', () => {
    renderReference('Input', 'en', {
      ...messages.en,
      'catalog.sample.inputLabel': 'Say "name"',
      'docs.input.field.hint': 'A "hint"',
    })

    expect(codeOf('States')).toContain('<Input label={"Say \\"name\\""} />')
    expect(codeOf('Field')).toContain('hint={"A \\"hint\\""}')
  })

  it('says that Input is 40 px high, and 44 px below 768 px of width', () => {
    renderReference('Input')

    expect(within(screen.getByRole('region', { name: 'Limitations' })).getByText(/40 px high/)).toHaveTextContent(
      '44 px below 768 px of width',
    )
  })

  it('documents the props of Input, the attributes that it changes and the props of Field', () => {
    renderReference('Input')

    const api = within(screen.getByRole('region', { name: 'API' }))
    expect(api.getByRole('heading', { name: 'Props of Input' })).toBeInTheDocument()
    expect(api.getByRole('heading', { name: 'Props of Field' })).toBeInTheDocument()
    const documented = api.getAllByRole('listitem').map((item) => item.firstElementChild?.textContent)
    expect(documented).toEqual([
      'label',
      'hint',
      'error',
      'fieldClassName',
      'id',
      'aria-describedby',
      'aria-invalid',
      'className',
      'label',
      'hint',
      'error',
      'id',
      'describedBy',
      'className',
      'children',
    ])
  })

  it('writes the page, its labels and its JSX in Spanish', () => {
    renderReference('Input', 'es')

    expect(screen.getByRole('region', { name: 'Estados' })).toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: 'Estados' })).getByText('Solo lectura')).toBeInTheDocument()
    expect(codeOf('Estados')).toContain('<Input\n  label="Nombre completo"\n  hint="Como aparece en tu documento."\n/>')
  })

  it('writes nothing of its own on the page: every text comes from a message', () => {
    expect(textOutsideMessages('Input', ['Field'])).toEqual([])
  })
})
