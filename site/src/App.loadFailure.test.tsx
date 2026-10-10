import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Link } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderInSiteAndSettle } from '../test/render'
import { App } from './App'
import { reloadPage } from './errors/reloadPage'

// The chunk of the Foundations page and the messages of Getting started never arrive: what a network that dropped, or a
// deployment that replaced the files, does to a visitor who was on the way to them.
const unreachable = vi.hoisted(() => ({ catalogue: undefined as string | undefined }))

// A module whose page cannot be read rejects the import that `lazy` waits on, as a chunk that did not arrive does.
vi.mock('./pages/Foundations/Foundations', () => ({
  get Foundations(): never {
    throw new Error('The chunk of the page did not arrive')
  },
}))

vi.mock('./i18n/loadCatalogs', async (importOriginal) => {
  const original = await importOriginal<typeof import('./i18n/loadCatalogs')>()
  return {
    loadCatalogs: (locale: Parameters<typeof original.loadCatalogs>[0], names: readonly string[]) =>
      unreachable.catalogue !== undefined && names.includes(unreachable.catalogue)
        ? Promise.reject(new Error('The messages of the page did not arrive'))
        : original.loadCatalogs(locale, names as Parameters<typeof original.loadCatalogs>[1]),
  }
})

vi.mock('./errors/reloadPage', () => ({ reloadPage: vi.fn() }))

// React reports every error that a boundary catches, which is what these tests cause on purpose. The messages of the
// tests themselves (`test/messages.ts`) load through the same function, so the failure starts with each test.
beforeEach(() => {
  unreachable.catalogue = 'gettingStarted'
  vi.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => {
  unreachable.catalogue = undefined
  vi.restoreAllMocks()
})

const failureHeading = () => screen.findByRole('heading', { level: 1, name: 'This page could not be loaded' })

describe('a page that fails to load', () => {
  it.each([
    ['its chunk does not arrive', '/docs/foundations/'],
    ['its messages do not arrive', '/docs/getting-started/'],
  ])('shows the notice with focus on it, inside the content, when %s', async (_cause, path) => {
    await renderInSiteAndSettle(<App />, { path })

    const heading = await failureHeading()

    expect(heading).toHaveFocus()
    expect(within(screen.getByRole('main')).getByRole('button', { name: 'Retry' })).toBeInTheDocument()
    // The bar and the footer are the ones of the chrome, which did not fail.
    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
  })

  it('tries again by reloading the page, since the document keeps a failed chunk', async () => {
    await renderInSiteAndSettle(<App />, { path: '/docs/foundations/' })
    await failureHeading()

    await userEvent.click(screen.getByRole('button', { name: 'Retry' }))

    expect(reloadPage).toHaveBeenCalledOnce()
  })

  it('is cleared by going to another page', async () => {
    // The destination is the not-found page: it has no messages or chunk of its own to wait for, so the navigation
    // commits at once, which jsdom needs: a render that waits for real time is not retried once `act` has returned.
    await renderInSiteAndSettle(
      <>
        <App />
        <Link to="/docs/unknown/">Elsewhere</Link>
      </>,
      { path: '/docs/foundations/' },
    )
    await failureHeading()

    await userEvent.click(screen.getByRole('link', { name: 'Elsewhere' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible()
    expect(screen.queryByRole('heading', { name: 'This page could not be loaded' })).not.toBeInTheDocument()
  })
})
