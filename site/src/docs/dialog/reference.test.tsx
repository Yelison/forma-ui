import { fireEvent, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { messages } from '../../../test/messages'
import { codeOf, renderReference, sectionsOfPage, textOutsideMessages } from '../referenceTestUtils'

/** The button, in a section of the page, that opens one of its dialogs. */
const openerIn = (section: string, name: string) =>
  within(screen.getByRole('region', { name: section })).getByRole('button', { name })

describe('the reference of Dialog', () => {
  it('lists its sections: the states, the sizes, the built-in text and the usual ones', () => {
    renderReference('Dialog')

    expect(screen.getByRole('heading', { level: 1, name: 'Dialog' })).toBeInTheDocument()
    expect(sectionsOfPage()).toEqual([
      'States',
      'Sizes',
      'Built-in text',
      'Usage',
      'API',
      'Accessibility',
      'Limitations',
    ])
  })

  it('says that Modal is the same component', () => {
    renderReference('Dialog')

    expect(within(screen.getByRole('region', { name: 'Usage' })).getByText(/same component/)).toHaveTextContent('Modal')
  })

  it('opens from its button with a title and a description, and Cancel gives the focus back to the button', async () => {
    renderReference('Dialog')
    const opener = openerIn('States', 'Confirm changes')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await userEvent.click(opener)
    const dialog = screen.getByRole('dialog', { name: 'Confirm changes' })

    expect(dialog).toHaveAccessibleDescription('Review the action before continuing.')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(opener).toHaveFocus()
  })

  it('closes with Escape, which the dialog reports as a cancel, and gives the focus back to the button', async () => {
    renderReference('Dialog')
    const opener = openerIn('States', 'Confirm changes')
    await userEvent.click(opener)

    fireEvent(screen.getByRole('dialog'), new Event('cancel', { cancelable: true }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(opener).toHaveFocus()
  })

  it('asks before deleting with the danger button, in the dialog and in its JSX', async () => {
    renderReference('Dialog')

    await userEvent.click(openerIn('States', 'Delete item'))
    const dialog = screen.getByRole('dialog', { name: 'Delete this item?' })

    expect(within(dialog).getByRole('button', { name: 'Delete' })).toBeVisible()
    expect(codeOf('States')).toContain('      <Button variant="danger" onClick={() => setOpen(false)}>\n        Delete')
  })

  it('opens the wide dialog with a field, and writes its size in the JSX and not the default one', async () => {
    renderReference('Dialog')

    await userEvent.click(within(screen.getByRole('region', { name: 'Sizes' })).getAllByRole('button')[1]!)

    expect(within(screen.getByRole('dialog')).getByRole('textbox', { name: 'Full name' })).toBeVisible()
    expect(codeOf('Sizes')).toContain('size="wide"')
    expect(codeOf('States')).not.toContain('size=')
  })

  it('gives the close button the text of a FormaProvider, in the language of the page', async () => {
    renderReference('Dialog', 'es')

    await userEvent.click(openerIn('Texto incorporado', 'Abrir diálogo'))

    expect(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cerrar' })).toBeVisible()
    const code = codeOf('Texto incorporado')
    expect(code).toContain('<FormaProvider strings={{ dialogClose: "Cerrar" }}>')
    // It compiles as it is copied: what the close button and the dialog use is declared in the same block.
    expect(code).toContain('function CloseButton({ onClose }: { onClose: () => void }) {')
    expect(code).toContain('const [open, setOpen] = useState(false)')
    expect(code).toContain('footer={<CloseButton onClose={close} />}')
  })

  it('writes a text with a double quote into the JSX as an expression, so that the code still compiles', () => {
    renderReference('Dialog', 'en', {
      ...messages.en,
      'catalog.sample.confirmTitle': 'Say "yes"',
      'docs.dialog.sample.close': 'Close "it"',
    })

    expect(codeOf('States')).toContain('title={"Say \\"yes\\""}')
    expect(codeOf('Built-in text')).toContain('dialogClose: "Close \\"it\\""')
  })

  it('says that Dialog has no close button, and that one in the footer reads the text of a FormaProvider', () => {
    renderReference('Dialog')

    const accessibility = within(screen.getByRole('region', { name: 'Accessibility' }))
    expect(accessibility.getByText(/Dialog has no text of its own/)).toHaveTextContent('that you put in the footer')
  })

  it('documents the eight props of the library, and no native attribute', () => {
    renderReference('Dialog')

    const api = within(screen.getByRole('region', { name: 'API' }))
    expect(api.queryByRole('heading', { name: /Native attributes/ })).not.toBeInTheDocument()
    expect(api.getAllByRole('listitem').map((item) => item.firstElementChild?.textContent)).toEqual([
      'open',
      'onClose',
      'title',
      'description',
      'footer',
      'size',
      'className',
      'children',
    ])
  })

  it('writes the page, its labels and its JSX in Spanish', () => {
    renderReference('Dialog', 'es')

    expect(screen.getByRole('region', { name: 'Tamaños' })).toBeInTheDocument()
    expect(codeOf('Estados')).toContain('  title="Confirmar cambios"')
  })

  it('writes nothing of its own on the page: every text comes from a message', () => {
    expect(textOutsideMessages('Dialog', ['Dialog', 'Modal'])).toEqual([])
  })
})
