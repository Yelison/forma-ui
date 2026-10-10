import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderInSite } from '../../../test/render'

// The module of the dialog is held until a test lets it go: what a slow network does to the first use of the search.
// `lazy` keeps the first outcome for good, so each test starts with the modules reset and imports the component after
// it: a gate and a `lazy` of its own, whatever order the tests run in.
const module = vi.hoisted(() => ({ arrive: () => {}, arrived: Promise.resolve(), asked: 0 }))

vi.mock('../SearchDialog/SearchDialog', async (importOriginal) => {
  module.asked += 1
  await module.arrived
  return importOriginal()
})

async function importLazySearchDialog() {
  return (await import('./LazySearchDialog')).LazySearchDialog
}

// jsdom has no layout, so it does not implement scrolling an element into view.
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn()
})

beforeEach(() => {
  vi.resetModules()
  module.asked = 0
  module.arrived = new Promise<void>((resolve) => (module.arrive = resolve))
})

afterEach(() => vi.useRealTimers())

describe('LazySearchDialog while its module is on the way', () => {
  it('has nothing to show for a moment, and a live region already on the page', async () => {
    const LazySearchDialog = await importLazySearchDialog()

    renderInSite(<LazySearchDialog open onClose={() => {}} />)

    expect(screen.getByRole('status')).toBeEmptyDOMElement()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('says nothing yet when it has taken a moment less than that', async () => {
    const LazySearchDialog = await importLazySearchDialog()
    vi.useFakeTimers()
    renderInSite(<LazySearchDialog open onClose={() => {}} />)

    act(() => vi.advanceTimersByTime(399))

    expect(screen.getByRole('status')).toBeEmptyDOMElement()
  })

  it.each([
    ['en', 'Loading search…'],
    ['es', 'Cargando la búsqueda…'],
  ] as const)('says in %s that the search is loading once it takes a while', async (locale, text) => {
    const LazySearchDialog = await importLazySearchDialog()
    vi.useFakeTimers()
    renderInSite(<LazySearchDialog open onClose={() => {}} />, { locale })

    act(() => vi.advanceTimersByTime(400))

    expect(screen.getByRole('status')).toHaveTextContent(text)
  })

  it('is cancelled by Escape: the person who changed their mind is not given a dialog later', async () => {
    const LazySearchDialog = await importLazySearchDialog()
    const onClose = vi.fn()
    renderInSite(<LazySearchDialog open onClose={onClose} />)

    await userEvent.keyboard('{Escape}')

    expect(onClose).toHaveBeenCalledOnce()
  })
})

describe('LazySearchDialog once its module has arrived', () => {
  it('opens the dialog', async () => {
    const LazySearchDialog = await importLazySearchDialog()
    renderInSite(<LazySearchDialog open onClose={() => {}} />)

    module.arrive()

    expect(await screen.findByRole('dialog', { name: 'Search the documentation' })).toBeInTheDocument()
  })

  it('leaves Escape to the dialog: the listener of the loading notice went with it', async () => {
    const LazySearchDialog = await importLazySearchDialog()
    const onClose = vi.fn()
    renderInSite(<LazySearchDialog open onClose={onClose} />)
    module.arrive()
    await screen.findByRole('dialog')

    await userEvent.keyboard('{Escape}')

    // The dialog closes on the `cancel` event of the browser, which a key press does not raise in jsdom.
    expect(onClose).not.toHaveBeenCalled()
  })
})

describe('LazySearchDialog while it is closed', () => {
  it('has nothing on the page, and does not ask for the module', async () => {
    const LazySearchDialog = await importLazySearchDialog()

    const { container } = render(<LazySearchDialog open={false} onClose={() => {}} />)
    // The request of a module that is asked for starts in a microtask.
    await act(async () => {})

    expect(container).toBeEmptyDOMElement()
    expect(module.asked).toBe(0)
  })
})
