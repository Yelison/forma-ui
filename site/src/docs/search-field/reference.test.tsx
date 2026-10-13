import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { codeOf, renderReference, sectionsOfPage, textOutsideMessages } from '../referenceTestUtils'

const region = (name: string) => within(screen.getByRole('region', { name }))

describe('the reference of SearchField', () => {
  it('lists its sections: the states, the controlled one and the usual ones', () => {
    renderReference('SearchField')

    expect(screen.getByRole('heading', { level: 1, name: 'SearchField' })).toBeInTheDocument()
    expect(sectionsOfPage()).toEqual(['States', 'Controlled', 'Usage', 'API', 'Accessibility', 'Limitations'])
  })

  it('shows the four states, each a search box named by its label that keeps its own text', () => {
    renderReference('SearchField')

    const boxes = region('States').getAllByRole('searchbox', { name: 'Search the library' })
    expect(boxes.map((box) => (box as HTMLInputElement).value)).toEqual(['', 'button', 'button', 'button'])
    expect(boxes[2]).toBeDisabled()
    expect(boxes[3]).toHaveAttribute('readonly')
  })

  it('clears a field with Escape, and only that field', async () => {
    renderReference('SearchField')
    const [, withText, , readOnly] = region('States').getAllByRole('searchbox', { name: 'Search the library' })

    await userEvent.click(withText!)
    await userEvent.keyboard('{Escape}')
    expect(withText).toHaveValue('')

    await userEvent.click(readOnly!)
    await userEvent.keyboard('{Escape}')
    expect(readOnly).toHaveValue('button')
  })

  it('reads the text from the state of the parent in the controlled example', async () => {
    renderReference('SearchField')
    const controlled = region('Controlled')
    expect(controlled.getByText('Nothing typed yet.')).toBeInTheDocument()

    await userEvent.type(controlled.getByRole('searchbox', { name: 'Search the library' }), 'tabs')

    expect(controlled.getByText('Text: tabs')).toBeInTheDocument()
    await userEvent.keyboard('{Escape}')
    expect(controlled.getByText('Nothing typed yet.')).toBeInTheDocument()
  })

  it('prints the JSX of what it shows: the state and the three props that the field needs', () => {
    renderReference('SearchField')

    const code = codeOf('States')
    expect(code).toContain("const [query, setQuery] = useState('')")
    expect(code).toContain('label="Search the library"')
    expect(code).toContain('value={query}')
    expect(code).toContain('onValueChange={setQuery}')
    expect(code).toContain('disabled')
    expect(code).toContain('readOnly')
    expect(codeOf('Controlled')).toContain('<p>Text: {query}</p>')
  })

  it('documents the props of SearchField and the attributes that it changes', () => {
    renderReference('SearchField')

    const api = region('API')
    expect(api.getByRole('heading', { name: 'Props of SearchField' })).toBeInTheDocument()
    expect(api.getAllByRole('listitem').map((item) => item.firstElementChild?.textContent)).toEqual([
      'label',
      'onValueChange',
      'fieldClassName',
      'value',
      'id',
      'readOnly',
      'onKeyDown',
      'className',
    ])
  })

  it('says that Escape stops there, and that the field is always controlled', () => {
    renderReference('SearchField')

    expect(region('Accessibility').getByText(/goes no further/)).toBeInTheDocument()
    expect(region('Limitations').getByText(/always controlled/)).toBeInTheDocument()
  })

  it('says which element takes each class, and that defaultValue and children are left out', () => {
    renderReference('SearchField')

    const api = screen.getByRole('region', { name: 'API' })
    // The messages hold <code> elements, so the text is read from the region and not from a single element.
    expect(api).toHaveTextContent(/container of the field, the element that holds the label and the box/)
    expect(api).toHaveTextContent(/the box you can see/)
    const limitations = region('Limitations').getByRole('list')
    expect(limitations).toHaveTextContent(/leave out defaultValue.*and children/)
    expect(limitations).toHaveTextContent(/change :focus-within on the box to :focus on the input/)
  })

  it('says the same in Spanish', () => {
    renderReference('SearchField', 'es')

    const limitations = region('Limitaciones').getByRole('list')
    expect(limitations).toHaveTextContent(/dejan fuera defaultValue.*y children/)
    expect(limitations).toHaveTextContent(/:focus-within sobre la caja por :focus sobre el input/)
  })

  it('writes the page, its labels and its JSX in Spanish', () => {
    renderReference('SearchField', 'es')

    expect(screen.getByRole('region', { name: 'Controlado' })).toBeInTheDocument()
    expect(region('Estados').getAllByRole('searchbox', { name: 'Buscar en la biblioteca' })).toHaveLength(4)
    expect(codeOf('Estados')).toContain('label="Buscar en la biblioteca"')
    expect(codeOf('Controlado')).toContain('<p>Texto: {query}</p>')
  })

  it('writes nothing of its own on the page: every text comes from a message', () => {
    expect(textOutsideMessages('SearchField', ['value', 'value, onValueChange'])).toEqual([])
  })
})
