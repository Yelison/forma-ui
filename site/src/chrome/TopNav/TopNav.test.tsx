import { act, fireEvent, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { renderInSite } from '../../../test/render'
import { TopNav } from './TopNav'

const documentation = () => screen.getByRole('link', { name: 'Documentation' })

describe('TopNav', () => {
  it('links the wordmark to the homepage, with an accessible name that says where it goes', () => {
    renderInSite(<TopNav />)

    expect(screen.getByRole('link', { name: 'Forma UI, home' })).toHaveAttribute('href', '/')
  })

  it('has the language switcher, named in the language of the page', () => {
    renderInSite(<TopNav />, { locale: 'es' })

    expect(screen.getByRole('button', { name: 'Idioma: español' })).toBeInTheDocument()
  })

  it('has the theme switcher, named in the language of the page', () => {
    renderInSite(<TopNav />, { locale: 'es' })

    expect(screen.getByRole('button', { name: 'Tema: sistema' })).toBeInTheDocument()
  })

  it('sends Documentation to the first page of the index', () => {
    renderInSite(<TopNav />)

    expect(documentation()).toHaveAttribute('href', '/docs/getting-started/')
  })

  it('marks Documentation as the current page on the page it links to', () => {
    renderInSite(<TopNav />, { path: '/docs/getting-started/' })

    expect(documentation()).toHaveAttribute('aria-current', 'page')
  })

  it.each([
    '/docs/foundations/',
    '/docs/components/',
    '/docs/components/button/',
    '/docs/guides/theming/',
    '/changelog/',
  ])('keeps Documentation highlighted across its section, on %s', (path) => {
    renderInSite(<TopNav />, { path })

    expect(documentation()).toHaveAttribute('aria-current', 'true')
  })

  it.each(['/', '/nowhere/'])('does not highlight Documentation on %s', (path) => {
    renderInSite(<TopNav />, { path })

    expect(documentation()).not.toHaveAttribute('aria-current')
  })

  it('labels its navigation, and names every link in Spanish', () => {
    renderInSite(<TopNav />, { locale: 'es' })

    expect(screen.getByRole('navigation', { name: 'Principal' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Documentación' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Forma UI, inicio' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Abrir menú' })).toBeInTheDocument()
  })

  describe('the menu', () => {
    const openMenu = () => screen.getByRole('button', { name: 'Open menu' })

    it('is closed to start with, and says so', () => {
      renderInSite(<TopNav />)

      expect(openMenu()).toHaveAttribute('aria-expanded', 'false')
      expect(openMenu()).toHaveAttribute('aria-haspopup', 'dialog')
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('opens the drawer from the menu button and closes it from the drawer', async () => {
      renderInSite(<TopNav />)

      await userEvent.click(openMenu())
      expect(openMenu()).toHaveAttribute('aria-expanded', 'true')
      expect(screen.getByRole('dialog', { name: 'Menu' })).toBeInTheDocument()

      await userEvent.click(screen.getByRole('button', { name: 'Close menu' }))
      expect(openMenu()).toHaveAttribute('aria-expanded', 'false')
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('puts focus on the wordmark when the drawer closes and the menu button is hidden', async () => {
      renderInSite(<TopNav />)
      await userEvent.click(openMenu())

      // What the window growing does to the narrow layout: the button is hidden, so it cannot take focus back.
      act(() => {
        openMenu().style.display = 'none'
        screen.getByRole('dialog').dispatchEvent(new Event('close'))
      })

      expect(screen.getByRole('link', { name: 'Forma UI, home' })).toHaveFocus()
    })

    it('leaves focus alone when the menu button is still there to take it back', async () => {
      renderInSite(<TopNav />)
      await userEvent.click(openMenu())

      await userEvent.click(screen.getByRole('button', { name: 'Close menu' }))

      expect(screen.getByRole('link', { name: 'Forma UI, home' })).not.toHaveFocus()
    })
  })

  describe('the search', () => {
    // jsdom has no layout, so it does not implement scrolling an element into view.
    beforeAll(() => {
      Element.prototype.scrollIntoView = vi.fn()
    })

    const searchButton = () => screen.getByRole('button', { name: 'Search…' })
    const searchDialog = () => screen.getByRole('dialog', { name: 'Search the documentation' })
    const pressEscape = () => fireEvent(searchDialog(), new Event('cancel', { cancelable: true }))

    it('opens from its button in the bar', async () => {
      renderInSite(<TopNav />)

      await userEvent.click(searchButton())

      expect(searchDialog()).toBeInTheDocument()
    })

    it('opens from Ctrl+K, in the language of the page', async () => {
      renderInSite(<TopNav />, { locale: 'es' })

      await userEvent.keyboard('{Control>}k{/Control}')

      expect(screen.getByRole('dialog', { name: 'Buscar en la documentación' })).toBeInTheDocument()
    })

    it('gives focus back to its button when it closes', async () => {
      renderInSite(<TopNav />)
      await userEvent.click(searchButton())

      pressEscape()

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(searchButton()).toHaveFocus()
    })

    it('puts focus on the search button when it closes after the shortcut was pressed with nothing focused', async () => {
      renderInSite(<TopNav />)
      await userEvent.keyboard('{Control>}k{/Control}')
      expect(document.body).toHaveFocus()

      pressEscape()

      expect(searchButton()).toHaveFocus()
    })

    it('puts focus on the menu button instead when the search button is not on screen', async () => {
      renderInSite(<TopNav />)
      await userEvent.keyboard('{Control>}k{/Control}')
      searchButton().style.display = 'none'

      pressEscape()

      expect(screen.getByRole('button', { name: 'Open menu' })).toHaveFocus()
    })

    it('opens from the menu, which closes first so the search is not stacked over it', async () => {
      renderInSite(<TopNav />)
      await userEvent.click(screen.getByRole('button', { name: 'Open menu' }))

      await userEvent.click(
        within(screen.getByRole('dialog', { name: 'Menu' })).getByRole('button', { name: 'Search…' }),
      )

      expect(screen.queryByRole('dialog', { name: 'Menu' })).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Open menu' })).toHaveAttribute('aria-expanded', 'false')
      expect(searchDialog()).toBeInTheDocument()
    })

    it('closes the menu when the shortcut opens the search over it', async () => {
      renderInSite(<TopNav />)
      await userEvent.click(screen.getByRole('button', { name: 'Open menu' }))

      await userEvent.keyboard('{Control>}k{/Control}')

      expect(screen.queryByRole('dialog', { name: 'Menu' })).not.toBeInTheDocument()
      expect(searchDialog()).toBeInTheDocument()
    })

    it('closes when a result is chosen', async () => {
      renderInSite(<TopNav />)
      await userEvent.click(searchButton())

      await userEvent.type(screen.getByRole('combobox'), 'foundations{Enter}')

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })
})
