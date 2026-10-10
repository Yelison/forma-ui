import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderInSite } from '../../../test/render'
import { reloadPage } from '../../errors/reloadPage'
import { LazySearchDialog } from './LazySearchDialog'

// The module of the dialog never arrives: a dropped network, or a deployment that replaced the file.
vi.mock('../SearchDialog/SearchDialog', () => ({
  get SearchDialog(): never {
    throw new Error('The chunk of the search did not arrive')
  },
}))

vi.mock('../../errors/reloadPage', () => ({ reloadPage: vi.fn() }))

// React reports every error that a boundary catches, which is what these tests cause on purpose.
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.mocked(reloadPage).mockClear()
})
afterEach(() => vi.restoreAllMocks())

describe('LazySearchDialog when its module does not arrive', () => {
  it.each([
    ['en', 'The search could not be loaded.', 'Retry', 'Dismiss'],
    ['es', 'No se pudo cargar la búsqueda.', 'Reintentar', 'Cerrar'],
  ] as const)(
    'tells the person in %s, where they are, and offers to retry or go on',
    async (locale, text, retry, dismiss) => {
      renderInSite(<LazySearchDialog open onClose={() => {}} />, { locale })

      expect(await screen.findByRole('alert')).toHaveTextContent(text)
      expect(screen.getByRole('button', { name: retry })).toHaveFocus()
      expect(screen.getByRole('button', { name: dismiss })).toBeInTheDocument()
    },
  )

  it('leaves the rest of the app standing', async () => {
    renderInSite(
      <>
        <p>The top bar</p>
        <LazySearchDialog open onClose={() => {}} />
      </>,
    )

    await screen.findByRole('alert')

    expect(screen.getByText('The top bar')).toBeInTheDocument()
  })

  it('retries by reloading the page, since the document keeps a failed chunk', async () => {
    renderInSite(<LazySearchDialog open onClose={() => {}} />)

    await userEvent.click(await screen.findByRole('button', { name: 'Retry' }))

    expect(reloadPage).toHaveBeenCalledOnce()
  })

  it('goes on without the search when Escape is pressed on the notice, as it would in the dialog', async () => {
    const onClose = vi.fn()
    renderInSite(<LazySearchDialog open onClose={onClose} />)
    await screen.findByRole('alert')

    await userEvent.keyboard('{Escape}')

    expect(onClose).toHaveBeenCalledOnce()
  })

  it('goes on without the search when the notice is dismissed', async () => {
    const onClose = vi.fn()
    renderInSite(<LazySearchDialog open onClose={onClose} />)

    await userEvent.click(await screen.findByRole('button', { name: 'Dismiss' }))

    expect(onClose).toHaveBeenCalledOnce()
  })
})
