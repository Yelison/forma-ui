import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { Route, Routes } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderInSite } from '../../../test/render'
import { Drawer } from './Drawer'

afterEach(() => {
  vi.restoreAllMocks()
  document.documentElement.classList.remove('forma-scroll-locked')
})

// A parent that does what the top bar does: it keeps `open` in step with what the drawer reports.
function Harness({ initiallyOpen = true, onClose = () => {} }) {
  const [open, setOpen] = useState(initiallyOpen)
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        open
      </button>
      <button type="button" onClick={() => setOpen(false)}>
        close from the parent
      </button>
      <Drawer
        open={open}
        onClose={() => {
          setOpen(false)
          onClose()
        }}
      />
      <Routes>
        <Route path="*" element={<p>page</p>} />
      </Routes>
    </>
  )
}

// A closed dialog is out of the accessibility tree, so it is only found with `hidden`.
const drawer = () => screen.getByRole('dialog', { hidden: true })

describe('Drawer', () => {
  it('lists the pages of the documentation as links, and marks the page that is open', () => {
    renderInSite(<Harness />, { path: '/docs/foundations/' })

    const nav = screen.getByRole('navigation', { name: 'Documentation' })
    expect(nav.querySelectorAll('a')).toHaveLength(6)
    expect(screen.getByRole('link', { name: 'Getting started' })).toHaveAttribute('href', '/docs/getting-started/')
    expect(screen.getByRole('link', { name: 'Foundations' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Changelog' })).not.toHaveAttribute('aria-current')
  })

  it('marks only the page that is open, not the pages that contain it', () => {
    renderInSite(<Harness />, { path: '/docs/components/button/' })

    expect(screen.getByRole('link', { name: 'Components' })).not.toHaveAttribute('aria-current')
  })

  it('links to the repository in a new tab and says so in the name of the link', () => {
    renderInSite(<Harness />)

    const link = screen.getByRole('link', { name: 'GitHub (opens in a new tab)' })
    expect(link).toHaveAttribute('href', 'https://github.com/Yelison/forma-ui')
    expect(link).toHaveAttribute('target', '_blank')
  })

  it('opens as a modal, named by its title, when `open` is true', () => {
    renderInSite(<Harness />)

    expect(screen.getByRole('dialog', { name: 'Menu' })).toHaveAttribute('open')
  })

  it('stays closed when `open` is false', () => {
    renderInSite(<Harness initiallyOpen={false} />)

    expect(drawer()).not.toHaveAttribute('open')
  })

  it('closes, and tells the parent, when the close button is used', async () => {
    const onClose = vi.fn()
    renderInSite(<Harness onClose={onClose} />)

    await userEvent.click(screen.getByRole('button', { name: 'Close menu' }))

    expect(drawer()).not.toHaveAttribute('open')
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('closes when a link of the menu is followed', async () => {
    const onClose = vi.fn()
    renderInSite(<Harness onClose={onClose} />)

    await userEvent.click(screen.getByRole('link', { name: 'Changelog' }))

    expect(drawer()).not.toHaveAttribute('open')
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('closes on a click outside the panel, but not on a click inside it', async () => {
    renderInSite(<Harness />)

    await userEvent.click(screen.getByRole('heading', { name: 'Menu' }))
    expect(screen.getByRole('dialog', { name: 'Menu' })).toHaveAttribute('open')

    await userEvent.click(screen.getByRole('dialog', { name: 'Menu' }))
    expect(drawer()).not.toHaveAttribute('open')
  })

  it('closes when the parent sets `open` to false, with no action on the drawer itself', async () => {
    renderInSite(<Harness initiallyOpen={false} />)
    await userEvent.click(screen.getByRole('button', { name: 'open' }))
    expect(screen.getByRole('dialog', { name: 'Menu' })).toHaveAttribute('open')

    await userEvent.click(screen.getByRole('button', { name: 'close from the parent' }))
    expect(drawer()).not.toHaveAttribute('open')
  })

  it('locks the scroll of the page while it is open and releases it when it closes', async () => {
    renderInSite(<Harness />)
    expect(document.documentElement).toHaveClass('forma-scroll-locked')

    await userEvent.click(screen.getByRole('button', { name: 'Close menu' }))
    expect(document.documentElement).not.toHaveClass('forma-scroll-locked')
  })

  it('closes when the window grows to desktop width, where the menu button is gone', () => {
    let notify: ((event: MediaQueryListEvent) => void) | undefined
    vi.spyOn(window, 'matchMedia').mockImplementation(
      () =>
        ({
          matches: false,
          addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => (notify = listener),
          removeEventListener: () => {},
        }) as unknown as MediaQueryList,
    )
    renderInSite(<Harness />)

    act(() => notify?.({ matches: true } as MediaQueryListEvent))

    expect(drawer()).not.toHaveAttribute('open')
  })

  it('stays open when the window changes but is still narrow', () => {
    let notify: ((event: MediaQueryListEvent) => void) | undefined
    vi.spyOn(window, 'matchMedia').mockImplementation(
      () =>
        ({
          matches: false,
          addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => (notify = listener),
          removeEventListener: () => {},
        }) as unknown as MediaQueryList,
    )
    renderInSite(<Harness />)

    act(() => notify?.({ matches: false } as MediaQueryListEvent))

    expect(screen.getByRole('dialog', { name: 'Menu' })).toHaveAttribute('open')
  })
})
