import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { IntlProvider } from 'react-intl'
import { describe, expect, it } from 'vitest'
import { messages } from '../../i18n'
import { markedMessages, renderInSite } from '../../../test/render'
import { untranslatedText } from '../../../test/untranslated'
import { ComponentExplorer } from './ComponentExplorer'

const codeOf = (component = 'Button') => screen.getByRole('figure', { name: `JSX · ${component}` })

// What the glossary keeps in every language: the names of the components and the values of their props.
const fixedTerms = ['Button', 'Input', 'Badge', 'primary', 'secondary', 'ghost', 'danger']

describe('ComponentExplorer', () => {
  it('opens on Button with the first variant, the real button and its code', () => {
    renderInSite(<ComponentExplorer />)

    expect(screen.getByRole('radio', { name: 'Button' })).toBeChecked()
    expect(within(screen.getByRole('group', { name: 'Preview of Button' })).getByRole('button')).toHaveTextContent(
      'Save changes',
    )
    expect(codeOf()).toHaveTextContent('<Button variant="primary"> Save changes </Button>')
    expect(screen.getByRole('combobox', { name: 'Variant' })).toHaveValue('primary')
  })

  it('groups the selector and the controls under a name', () => {
    renderInSite(<ComponentExplorer />)

    expect(screen.getByRole('group', { name: 'Component' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Properties' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Component explorer' })).toBeInTheDocument()
  })

  it('changes the specimen and its code together when a variant is chosen', async () => {
    renderInSite(<ComponentExplorer />)

    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Variant' }), 'danger')

    expect(codeOf()).toHaveTextContent('<Button variant="danger">')
    expect(screen.getByRole('button', { name: 'Save changes' })).toHaveClass('forma-button__danger')
  })

  it('shows the loading state with the label of the page, in the specimen and in the code', async () => {
    renderInSite(<ComponentExplorer />, { locale: 'es' })

    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Estado' }), 'Cargando')

    expect(screen.getByRole('button', { name: 'Guardando…' })).toHaveAttribute('aria-busy', 'true')
    expect(codeOf()).toHaveTextContent('loading loadingLabel="Guardando…" > Guardar cambios </Button>')
  })

  it('lists the proposed Button sizes disabled and marked as proposed, with the current height chosen', () => {
    renderInSite(<ComponentExplorer />)

    const size = screen.getByRole('combobox', { name: 'Size' })

    expect(size).toHaveValue('default')
    for (const proposed of ['32', '40', '48']) {
      expect(within(size).getByRole('option', { name: `${proposed} px · Proposed` })).toBeDisabled()
    }
    expect(within(size).getByRole('option', { name: 'Default' })).toBeEnabled()
  })

  it('moves to another component with the arrow keys, and shows its own controls and code', async () => {
    renderInSite(<ComponentExplorer />)

    await userEvent.tab()
    expect(screen.getByRole('radio', { name: 'Button' })).toHaveFocus()
    await userEvent.keyboard('{ArrowDown}')

    expect(screen.getByRole('radio', { name: 'Input' })).toBeChecked()
    expect(codeOf('Input')).toHaveTextContent('<Input label="Email" />')
    expect(screen.getByRole('textbox', { name: 'Email' })).toBeInTheDocument()
    expect(screen.queryByRole('combobox', { name: 'Variant' })).not.toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'State' })).toHaveValue('default')
  })

  it('offers Badge the tone and nothing else', async () => {
    renderInSite(<ComponentExplorer />)

    await userEvent.click(screen.getByRole('radio', { name: 'Badge' }))

    expect(screen.getAllByRole('combobox').map((control) => control.getAttribute('id'))).toHaveLength(1)
    expect(screen.getByRole('combobox', { name: 'Tone' })).toHaveValue('neutral')
    expect(codeOf('Badge')).toHaveTextContent('<Badge tone="neutral"> Draft </Badge>')
  })

  it('keeps a read-only input apart from a disabled one', async () => {
    renderInSite(<ComponentExplorer />)
    await userEvent.click(screen.getByRole('radio', { name: 'Input' }))

    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'State' }), 'Read-only')
    const readOnly = screen.getByRole('textbox', { name: 'Email' })
    expect(readOnly).toHaveAttribute('readonly')
    expect(readOnly).toBeEnabled()
    expect(readOnly).toHaveValue('ana@example.com')

    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'State' }), 'Disabled')
    expect(screen.getByRole('textbox', { name: 'Email' })).toBeDisabled()
    expect(codeOf('Input')).toHaveTextContent('disabled')
    expect(codeOf('Input')).not.toHaveTextContent('readOnly')
  })

  it('shows the value its code gives the field, not what the visitor typed in the specimen before', async () => {
    renderInSite(<ComponentExplorer />)
    await userEvent.click(screen.getByRole('radio', { name: 'Input' }))
    await userEvent.type(screen.getByRole('textbox', { name: 'Email' }), 'typed')

    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'State' }), 'Read-only')

    expect(screen.getByRole('textbox', { name: 'Email' })).toHaveValue('ana@example.com')
  })

  it('restores the defaults, in the controls, in the specimen and in the code, and keeps the focus on Reset', async () => {
    renderInSite(<ComponentExplorer />)
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Variant' }), 'ghost')
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'State' }), 'Disabled')

    await userEvent.click(screen.getByRole('button', { name: 'Reset' }))

    expect(screen.getByRole('combobox', { name: 'Variant' })).toHaveValue('primary')
    expect(screen.getByRole('combobox', { name: 'State' })).toHaveValue('default')
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeEnabled()
    expect(codeOf()).toHaveTextContent('<Button variant="primary"> Save changes </Button>')
    expect(screen.getByRole('button', { name: 'Reset' })).toHaveFocus()
  })

  it('does not reset the component that is selected to another one', async () => {
    renderInSite(<ComponentExplorer />)
    await userEvent.click(screen.getByRole('radio', { name: 'Input' }))
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'State' }), 'With error')

    await userEvent.click(screen.getByRole('button', { name: 'Reset' }))

    expect(screen.getByRole('radio', { name: 'Input' })).toBeChecked()
    expect(screen.queryByText('Enter a valid email address')).not.toBeInTheDocument()
  })

  describe('the announcement', () => {
    it.each([
      ['en', 'Variant', 'secondary', 'Variant: secondary. Code updated.'],
      ['es', 'Variante', 'secondary', 'Variante: secondary. Código actualizado.'],
    ] as const)('says in %s what a change did, and is empty until there is one', async (locale, name, value, said) => {
      renderInSite(<ComponentExplorer />, { locale })
      expect(screen.getByRole('status')).toBeEmptyDOMElement()

      await userEvent.selectOptions(screen.getByRole('combobox', { name }), value)

      expect(screen.getByRole('status')).toHaveTextContent(said)
    })

    it('is empty again after a change of language: it is not left in the voice of the old one', async () => {
      const explorer = <ComponentExplorer />
      const { rerender } = render(
        <IntlProvider locale="es" messages={messages.es}>
          {explorer}
        </IntlProvider>,
      )
      await userEvent.click(screen.getByRole('button', { name: 'Restablecer' }))
      expect(screen.getByRole('status')).toHaveTextContent('Propiedades restablecidas. Código actualizado.')

      rerender(
        <IntlProvider locale="en" messages={messages.en}>
          {explorer}
        </IntlProvider>,
      )

      expect(screen.getByRole('status')).toBeEmptyDOMElement()
    })

    it('names the component that was chosen, and what a reset did', async () => {
      renderInSite(<ComponentExplorer />)

      await userEvent.click(screen.getByRole('radio', { name: 'Badge' }))
      expect(screen.getByRole('status')).toHaveTextContent('Showing Badge. Code updated.')

      await userEvent.click(screen.getByRole('button', { name: 'Reset' }))
      expect(screen.getByRole('status')).toHaveTextContent('Properties reset. Code updated.')
    })

    it('does not read the code out: the region says that it changed, not what it says', async () => {
      renderInSite(<ComponentExplorer />)

      await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Variant' }), 'secondary')

      expect(screen.getByRole('status')).not.toHaveTextContent('<Button')
    })
  })

  it('writes no text of its own: every word on it is a message, a component name or a prop value', () => {
    const { container } = renderInSite(<ComponentExplorer />, { messages: markedMessages })

    expect(untranslatedText(container, fixedTerms)).toEqual([])
  })
})
