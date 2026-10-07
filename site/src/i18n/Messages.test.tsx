import { render, screen } from '@testing-library/react'
import { Suspense } from 'react'
import { useIntl } from 'react-intl'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderAndSettle } from '../../test/render'
import type { Locale } from './locale'
import type { MessageId } from './messages'

// The loader keeps what it fetched for the life of the page, so each test starts from the modules anew.
async function freshMessages() {
  vi.resetModules()
  const [{ Messages }, { LocaleContext }, { catalogLoaders }, { mountedCatalogs }] = await Promise.all([
    import('./Messages'),
    import('./LocaleContext'),
    import('./catalogLoaders'),
    import('./mountedCatalogs'),
  ])
  const inLocale = (locale: Locale, ui: React.ReactElement) => (
    <LocaleContext value={{ locale, setLocale: () => {}, failedChanges: 0 }}>
      <Suspense fallback={<p>Loading</p>}>{ui}</Suspense>
    </LocaleContext>
  )
  return { Messages, inLocale, catalogLoaders, mountedCatalogs }
}

function Say({ id }: { id: MessageId }) {
  return <p>{useIntl().formatMessage({ id })}</p>
}

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('Messages', () => {
  it('formats its children with the messages of its catalogues in the language of the page', async () => {
    const { Messages, inLocale } = await freshMessages()

    await renderAndSettle(
      inLocale(
        'es',
        <Messages catalogs={['common', 'foundations']}>
          <Say id="nav.docs" />
          <Say id="foundations.lead" />
        </Messages>,
      ),
    )

    expect(await screen.findByText('Documentación')).toBeInTheDocument()
    expect(await screen.findByText(/^Color, tipografía y espacio/)).toBeInTheDocument()
  })

  it('shows what the nearest Suspense says until the catalogues have arrived, and never an id', async () => {
    const { Messages, inLocale, catalogLoaders } = await freshMessages()
    let arrive = () => {}
    const original = catalogLoaders.foundations.en
    vi.spyOn(catalogLoaders.foundations, 'en').mockImplementation(
      () => new Promise((resolve) => (arrive = () => resolve(original()))),
    )

    await renderAndSettle(
      inLocale(
        'en',
        <Messages catalogs={['common', 'foundations']}>
          <Say id="foundations.lead" />
        </Messages>,
      ),
    )
    expect(screen.getByText('Loading')).toBeInTheDocument()
    expect(screen.queryByText('foundations.lead')).not.toBeInTheDocument()

    await vi.waitFor(() => expect(arrive).not.toThrow())
    arrive()
    expect(await screen.findByText(/^Color, type and space/)).toBeInTheDocument()
    expect(screen.queryByText('Loading')).not.toBeInTheDocument()
  })

  it('replaces the messages of the provider above with its own, so a page lists everything it needs', async () => {
    const { Messages, inLocale } = await freshMessages()
    const report = vi.spyOn(console, 'error').mockImplementation(() => {})

    await renderAndSettle(
      inLocale(
        'en',
        <Messages catalogs={['common']}>
          <Messages catalogs={['foundations']}>
            <Say id="nav.docs" />
          </Messages>
        </Messages>,
      ),
    )

    // `common` is not in the inner list, so its message is not there: the id is printed and react-intl reports it.
    expect(await screen.findByText('nav.docs')).toBeInTheDocument()
    expect(report).toHaveBeenCalledWith(expect.objectContaining({ code: 'MISSING_TRANSLATION' }))
  })

  it('says which catalogues are on screen while it is, and not once it has left', async () => {
    const { Messages, inLocale, mountedCatalogs } = await freshMessages()
    const page = (
      <Messages catalogs={['common', 'foundations']}>
        <Say id="nav.docs" />
      </Messages>
    )
    const { unmount } = await renderAndSettle(inLocale('en', page))
    await screen.findByText('Documentation')

    expect(mountedCatalogs()).toEqual(['common', 'foundations'])

    unmount()
    expect(mountedCatalogs()).toEqual([])
  })

  it('needs the language of the page, which only IntlRoot provides', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})

    return freshMessages().then(({ Messages }) => {
      expect(() =>
        render(
          <Messages catalogs={['common']}>
            <p />
          </Messages>,
        ),
      ).toThrow('useLocale needs an IntlRoot above it')
    })
  })
})
