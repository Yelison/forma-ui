import { act, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { messages } from '../../i18n'
import { codeOf, renderReference, sectionsOfPage, textOutsideMessages } from '../referenceTestUtils'

describe('the reference of IconButton', () => {
  it('lists its sections: the icons, the states, the pairing with a Tooltip and the usual ones', () => {
    renderReference('IconButton')

    expect(screen.getByRole('heading', { level: 1, name: 'IconButton' })).toBeInTheDocument()
    expect(sectionsOfPage()).toEqual([
      'Icons',
      'States',
      'With a Tooltip',
      'Usage',
      'API',
      'Accessibility',
      'Limitations',
    ])
  })

  it('shows one icon, several icons as one glyph and a mirrored glyph, each named and with its JSX', () => {
    renderReference('IconButton')

    const icons = screen.getByRole('region', { name: 'Icons' })
    expect(within(icons).getByRole('button', { name: 'Add' })).toBeVisible()
    expect(within(icons).getByRole('button', { name: 'Collapse the sidebar' })).toBeVisible()
    expect(within(icons).getByRole('button', { name: 'Expand the sidebar' })).toBeVisible()
    const code = codeOf('Icons')
    expect(code).toContain('<IconButton icon="plus" label="Add" />')
    expect(code).toContain(`<IconButton\n  icon={['arrow', 'arrow']}\n  label="Collapse the sidebar"\n/>`)
    expect(code).toContain(`<IconButton\n  icon={['arrow', 'arrow']}\n  flip\n  label="Expand the sidebar"\n/>`)
  })

  it('shows the states that the library has, and only the disabled one cannot be used', () => {
    renderReference('IconButton')

    const states = screen.getByRole('region', { name: 'States' })
    for (const state of ['Default', 'Hover', 'Focus', 'Disabled']) {
      expect(within(states).getByText(state)).toBeInTheDocument()
    }
    const buttons = within(states).getAllByRole('button', { name: 'Add' })
    expect(buttons.map((button) => button.hasAttribute('disabled'))).toEqual([false, false, false, true])
    expect(codeOf('States')).toContain('<IconButton icon="plus" disabled label="Add" />')
  })

  it('shows its label as a Tooltip that opens with the keyboard and does not name the button twice', async () => {
    renderReference('IconButton')
    const pairing = screen.getByRole('region', { name: 'With a Tooltip' })
    const button = within(pairing).getByRole('button', { name: 'Add' })

    act(() => button.focus())

    expect(await screen.findByRole('tooltip')).toHaveTextContent('Add')
    expect(button).not.toHaveAttribute('aria-describedby')
    expect(codeOf('With a Tooltip')).toContain('describe={false}')
  })

  it('writes a text with a double quote into the JSX as an expression, so that the code still compiles', () => {
    renderReference('IconButton', 'en', { ...messages.en, 'docs.iconButton.sample.add': 'Say "add"' })

    const code = codeOf('With a Tooltip')
    expect(code).toContain('<Tooltip content={"Say \\"add\\""} describe={false}>')
    expect(code).toContain('label={"Say \\"add\\""}')
  })

  it('documents the three props of the library and the native attributes that IconButton changes', () => {
    renderReference('IconButton')

    const api = screen.getByRole('region', { name: 'API' })
    const documented = within(api)
      .getAllByRole('listitem')
      .map((item) => item.firstElementChild?.textContent)
    expect(documented).toEqual(['icon', 'flip', 'label', 'type', 'aria-label', 'className'])
    expect(within(api).getByRole('heading', { name: 'Props of IconButton' })).toBeInTheDocument()
  })

  it('writes the page, its labels and its JSX in Spanish', () => {
    renderReference('IconButton', 'es')

    expect(screen.getByRole('region', { name: 'Iconos' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Con un Tooltip' })).toBeInTheDocument()
    expect(codeOf('Iconos')).toContain('<IconButton icon="plus" label="Añadir" />')
    expect(screen.getAllByRole('button', { name: 'Contraer la barra lateral' }).length).toBeGreaterThan(0)
  })

  it('writes nothing of its own on the page: every text comes from a message', () => {
    expect(textOutsideMessages('IconButton', [])).toEqual([])
  })
})
