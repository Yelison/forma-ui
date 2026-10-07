import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
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
})
