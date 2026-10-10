import { fireEvent, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { useLocation } from 'react-router'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { markedMessages, renderInSite } from '../../../test/render'
import { untranslatedText } from '../../../test/untranslated'
import { SearchDialog } from './SearchDialog'

// jsdom has no layout, so it does not implement scrolling an element into view.
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn()
})

// What the top bar does: it keeps `open` in step with what the dialog reports. The page behind shows where it is.
function Harness({ onClose = () => {} }) {
  const [open, setOpen] = useState(true)
  const { pathname } = useLocation()
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        open the search
      </button>
      <p>at {pathname}</p>
      <SearchDialog
        open={open}
        onClose={() => {
          setOpen(false)
          onClose()
        }}
      />
    </>
  )
}

const search = () => screen.getByRole('combobox', { name: 'Search components and pages' })
const options = () => screen.getAllByRole('option').map((option) => option.querySelector('span')?.textContent)
const status = () => within(screen.getByRole('dialog')).getByRole('status')

describe('SearchDialog', () => {
  it('is a modal named by its title, with a combobox that is labeled', () => {
    renderInSite(<Harness />)

    expect(screen.getByRole('dialog', { name: 'Search the documentation' })).toHaveAttribute('open')
    expect(search()).toHaveAttribute('aria-autocomplete', 'list')
  })

  it('has no text that a translation does not reach, apart from the names of the components', () => {
    renderInSite(<Harness />, { messages: markedMessages })

    const componentNames = ['Button', 'IconButton', 'Badge', 'Input', 'Tooltip', 'Dialog', 'Tabs']
    expect(untranslatedText(screen.getByRole('dialog'), componentNames)).toEqual([])
  })

  it('lists the components and then the pages before anything is typed, each group named', () => {
    renderInSite(<Harness />)

    expect(options()).toEqual([
      'Button',
      'IconButton',
      'Badge',
      'Input',
      'Tooltip',
      'Dialog',
      'Tabs',
      'Getting started',
      'Foundations',
      'Components',
      'Theming',
      'Accessibility',
      'Changelog',
    ])
    expect(screen.getByRole('group', { name: 'Components' })).toContainElement(
      screen.getByRole('option', { name: /^Dialog/ }),
    )
    expect(screen.getByRole('group', { name: 'Pages' })).toContainElement(
      screen.getByRole('option', { name: /^Theming/ }),
    )
    expect(status()).toHaveTextContent('13 results')
  })

  it('narrows the results as the person types, and announces the new count', async () => {
    renderInSite(<Harness />)

    await userEvent.type(search(), 'dial')

    expect(options()).toEqual(['Dialog'])
    expect(status()).toHaveTextContent('1 result')
  })

  it('finds a page by what it says about itself, in the language of the page, ignoring accents', async () => {
    renderInSite(<Harness />, { locale: 'es' })

    await userEvent.type(screen.getByRole('combobox', { name: 'Buscar componentes y páginas' }), 'jerarquia')

    expect(options()).toEqual(['Fundamentos'])
    expect(status()).toHaveTextContent('1 resultado')
  })

  it('says that nothing was found, with the words typed, and leaves the combobox without a list', async () => {
    renderInSite(<Harness />)

    await userEvent.type(search(), 'zzz')

    expect(screen.getByText('No results for “zzz”. Try another word.')).toBeInTheDocument()
    expect(status()).toHaveTextContent('No results')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(search()).toHaveAttribute('aria-expanded', 'false')
    expect(search()).not.toHaveAttribute('aria-activedescendant')
  })

  it('says it in Spanish too', async () => {
    renderInSite(<Harness />, { locale: 'es' })

    await userEvent.type(screen.getByRole('combobox', { name: 'Buscar componentes y páginas' }), 'zzz')

    expect(screen.getByText('Sin resultados para «zzz». Prueba con otra palabra.')).toBeInTheDocument()
    expect(status()).toHaveTextContent('Sin resultados')
  })

  describe('with the keyboard', () => {
    it('starts on the first result, and the arrows move it, going round at both ends', async () => {
      renderInSite(<Harness />)
      const active = () => search().getAttribute('aria-activedescendant')
      const selected = () => screen.getByRole('option', { selected: true }).querySelector('span')?.textContent

      expect(selected()).toBe('Button')
      expect(active()).toBe(screen.getByRole('option', { selected: true }).id)

      await userEvent.type(search(), '{ArrowDown}{ArrowDown}')
      expect(selected()).toBe('Badge')

      await userEvent.type(search(), '{ArrowUp}{ArrowUp}{ArrowUp}')
      expect(selected()).toBe('Changelog')

      await userEvent.type(search(), '{ArrowDown}')
      expect(selected()).toBe('Button')
    })

    it('goes back to the first result when the query changes', async () => {
      renderInSite(<Harness />)

      await userEvent.type(search(), '{ArrowDown}{ArrowDown}')
      await userEvent.type(search(), 'o')

      expect(screen.getByRole('option', { selected: true }).querySelector('span')?.textContent).toBe(options()[0])
    })

    it('goes to the chosen result on Enter, and closes the search', async () => {
      const onClose = vi.fn()
      renderInSite(<Harness onClose={onClose} />)

      await userEvent.type(search(), 'foundations{Enter}')

      expect(screen.getByText('at /docs/foundations/')).toBeInTheDocument()
      expect(onClose).toHaveBeenCalledOnce()
    })

    it('reaches the page named like the query, not a component whose description mentions it', async () => {
      renderInSite(<Harness />)

      await userEvent.type(search(), 'accessibility')

      // Every component page says «accessibility» in its description; only one page has it as its title.
      expect(options()[0]).toBe('Accessibility')
      expect(screen.getAllByRole('group')[0]).toHaveAccessibleName('Pages')
      expect(screen.getByRole('option', { selected: true })).toHaveTextContent(/^Accessibility/)

      await userEvent.keyboard('{Enter}')

      expect(screen.getByText('at /docs/guides/accessibility/')).toBeInTheDocument()
    })

    it('goes to the result the arrows reached', async () => {
      renderInSite(<Harness />)

      await userEvent.type(search(), '{ArrowDown}{Enter}')

      expect(screen.getByText('at /docs/components/icon-button/')).toBeInTheDocument()
    })

    it('does nothing on Enter when there is no result', async () => {
      const onClose = vi.fn()
      renderInSite(<Harness onClose={onClose} />)

      await userEvent.type(search(), 'zzz{Enter}')

      expect(screen.getByText('at /')).toBeInTheDocument()
      expect(onClose).not.toHaveBeenCalled()
    })

    it('asks to close on Escape, which the browser reports as a cancel of the dialog', () => {
      const onClose = vi.fn()
      renderInSite(<Harness onClose={onClose} />)

      fireEvent(screen.getByRole('dialog'), new Event('cancel', { cancelable: true }))

      expect(onClose).toHaveBeenCalledOnce()
    })
  })

  it('goes to a result that is clicked, and closes the search', async () => {
    const onClose = vi.fn()
    renderInSite(<Harness onClose={onClose} />)

    await userEvent.click(screen.getByRole('option', { name: /^Tooltip/ }))

    expect(screen.getByText('at /docs/components/tooltip/')).toBeInTheDocument()
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('starts empty every time it opens', async () => {
    renderInSite(<Harness />)
    await userEvent.type(search(), 'dial')
    fireEvent(screen.getByRole('dialog'), new Event('cancel', { cancelable: true }))

    await userEvent.click(screen.getByRole('button', { name: 'open the search' }))

    expect(search()).toHaveValue('')
    expect(options()).toHaveLength(13)
  })
})
