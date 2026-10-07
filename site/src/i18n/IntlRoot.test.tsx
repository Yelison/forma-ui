import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { FormattedMessage } from 'react-intl'
import { renderAndSettle } from '../../test/render'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { IntlRoot } from './IntlRoot'
import { useLocale } from './LocaleContext'
import { localeStorageKey } from './locale'

afterEach(() => {
  vi.restoreAllMocks()
  document.documentElement.removeAttribute('lang')
})

const browserLanguages = (...languages: string[]) => vi.spyOn(navigator, 'languages', 'get').mockReturnValue(languages)

const renderGreeting = () =>
  renderAndSettle(
    <IntlRoot>
      <p>
        <FormattedMessage id="nav.docs" />
      </p>
    </IntlRoot>,
  )

describe('IntlRoot', () => {
  it('shows the messages in the language of the browser and sets <html lang> to it', async () => {
    browserLanguages('es-ES')
    await renderGreeting()

    expect(await screen.findByText('Documentación')).toBeInTheDocument()
    expect(document.documentElement).toHaveAttribute('lang', 'es')
  })

  it('opens in English when the browser speaks a language the site does not', async () => {
    browserLanguages('fr-FR')
    await renderGreeting()

    expect(await screen.findByText('Documentation')).toBeInTheDocument()
    expect(document.documentElement).toHaveAttribute('lang', 'en')
  })

  it('prefers the stored choice to the browser', async () => {
    browserLanguages('es-ES')
    localStorage.setItem(localeStorageKey, 'en')
    await renderGreeting()

    expect(await screen.findByText('Documentation')).toBeInTheDocument()
    expect(document.documentElement).toHaveAttribute('lang', 'en')
  })

  it('is what a component needs to change the language: without it there is no language to change', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const Probe = () => useLocale().locale

    expect(() => render(<Probe />)).toThrow('useLocale needs an IntlRoot above it')
  })
})

// The loader keeps what it fetched for the life of the page, so each test of a language change starts from the modules
// anew, with the Spanish catalogue of the chrome held back or failing where the test needs it to be.
async function freshRoot() {
  vi.resetModules()
  const [{ IntlRoot }, { Messages }, { useLocale }, { catalogLoaders }, { loadCatalogs }] = await Promise.all([
    import('./IntlRoot'),
    import('./Messages'),
    import('./LocaleContext'),
    import('./catalogLoaders'),
    import('./loadCatalogs'),
  ])
  // The English chrome is what every test starts in: have it here, so that what a test waits for is what it is about
  // and not the bundler transforming a catalogue again after the modules were reset.
  await loadCatalogs('en', ['common'])

  /** Holds the Spanish chrome back until `release` is called, as a slow network does. */
  function holdSpanish() {
    let release = () => {}
    const original = catalogLoaders.common.es
    const gate = new Promise<void>((resolve) => (release = resolve))
    vi.spyOn(catalogLoaders.common, 'es').mockImplementation(async () => {
      await gate
      return original()
    })
    return release
  }

  function Chooser() {
    const { setLocale, failedChanges } = useLocale()
    return (
      <>
        <p>
          <FormattedMessage id="nav.docs" />
        </p>
        <output>failed {failedChanges}</output>
        <button type="button" onClick={() => setLocale('es')}>
          choose es
        </button>
        <button type="button" onClick={() => setLocale('en')}>
          choose en
        </button>
      </>
    )
  }
  return { IntlRoot, Messages, Chooser, catalogLoaders, holdSpanish, loadCatalogs }
}

describe('IntlRoot, when the language changes', () => {
  it('keeps the language it has until the messages of the new one have arrived, and then changes all at once', async () => {
    const { IntlRoot, Chooser, holdSpanish } = await freshRoot()
    const release = holdSpanish()
    await renderAndSettle(
      <IntlRoot>
        <Chooser />
      </IntlRoot>,
    )

    await userEvent.click(await screen.findByRole('button', { name: 'choose es' }))

    expect(screen.getByText('Documentation')).toBeInTheDocument()
    expect(document.documentElement).toHaveAttribute('lang', 'en')
    expect(localStorage.getItem(localeStorageKey)).toBeNull()

    release()
    expect(await screen.findByText('Documentación')).toBeInTheDocument()
    expect(document.documentElement).toHaveAttribute('lang', 'es')
    expect(localStorage.getItem(localeStorageKey)).toBe('es')
  })

  it('stays in the language it has when the new one cannot be fetched, and does not remember it', async () => {
    const { IntlRoot, Chooser, catalogLoaders } = await freshRoot()
    const fetchSpanish = vi.spyOn(catalogLoaders.common, 'es').mockRejectedValueOnce(new Error('offline'))
    const unhandled = vi.fn()
    process.on('unhandledRejection', unhandled)
    await renderAndSettle(
      <IntlRoot>
        <Chooser />
      </IntlRoot>,
    )

    await userEvent.click(await screen.findByRole('button', { name: 'choose es' }))
    await vi.waitFor(() => expect(fetchSpanish).toHaveBeenCalledTimes(1))
    await act(async () => {})
    process.off('unhandledRejection', unhandled)

    // A choice that cannot be fulfilled is not an error of the page.
    expect(unhandled).not.toHaveBeenCalled()
    expect(screen.getByText('Documentation')).toBeInTheDocument()
    expect(document.documentElement).toHaveAttribute('lang', 'en')
    expect(localStorage.getItem(localeStorageKey)).toBeNull()
    // Whoever offers the choice is told that it did not happen, to say so.
    expect(screen.getByText('failed 1')).toBeInTheDocument()

    // The connection is back: choosing it again is a new attempt, not a remembered failure.
    await userEvent.click(await screen.findByRole('button', { name: 'choose es' }))
    expect(await screen.findByText('Documentación')).toBeInTheDocument()
    expect(screen.getByText('failed 0')).toBeInTheDocument()
  })

  it('does not report as failed a choice that a later one replaced', async () => {
    const { IntlRoot, Chooser, catalogLoaders } = await freshRoot()
    let fail = () => {}
    const gate = new Promise<void>((_, reject) => (fail = () => reject(new Error('offline'))))
    const original = catalogLoaders.common.es
    vi.spyOn(catalogLoaders.common, 'es').mockImplementation(() => gate.then(() => original()))
    await renderAndSettle(
      <IntlRoot>
        <Chooser />
      </IntlRoot>,
    )

    await userEvent.click(await screen.findByRole('button', { name: 'choose es' }))
    await userEvent.click(await screen.findByRole('button', { name: 'choose en' }))
    fail()
    await act(async () => {
      await gate.catch(() => {})
    })

    expect(screen.getByText('failed 0')).toBeInTheDocument()
  })

  it('applies only the language chosen last when an earlier choice arrives after it', async () => {
    const { IntlRoot, Chooser, holdSpanish, loadCatalogs } = await freshRoot()
    const release = holdSpanish()
    await renderAndSettle(
      <IntlRoot>
        <Chooser />
      </IntlRoot>,
    )

    await userEvent.click(await screen.findByRole('button', { name: 'choose es' }))
    await userEvent.click(await screen.findByRole('button', { name: 'choose en' }))
    release()
    // The Spanish choice has finished loading: it is the one that must change nothing.
    await act(async () => {
      await loadCatalogs('es', ['common'])
    })

    expect(screen.getByText('Documentation')).toBeInTheDocument()
    expect(document.documentElement).toHaveAttribute('lang', 'en')
    expect(localStorage.getItem(localeStorageKey)).toBe('en')
  })

  it('brings the messages of the open page in the new language first, so the page is never hidden or in ids', async () => {
    const { IntlRoot, Messages, Chooser } = await freshRoot()
    await renderAndSettle(
      <IntlRoot>
        <Chooser />
        <Messages catalogs={['common', 'foundations']}>
          <h1>
            <FormattedMessage id="foundations.lead" />
          </h1>
        </Messages>
      </IntlRoot>,
    )
    const heading = await screen.findByRole('heading', { name: /^Color, type and space/ })
    // A `Suspense` that hides what it holds sets `display: none` on it, and takes its focus with it.
    const hidden = vi.fn()
    new MutationObserver(() => {
      if (heading.closest('[style*="display: none"]') !== null) hidden()
    }).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['style'] })

    await userEvent.click(await screen.findByRole('button', { name: 'choose es' }))

    expect(await screen.findByRole('heading', { name: /^Color, tipografía y espacio/ })).toBeInTheDocument()
    expect(hidden).not.toHaveBeenCalled()
  })

  it('waits only for what is on screen: a page the visitor has left cannot hold the change back', async () => {
    const { IntlRoot, Messages, Chooser, catalogLoaders } = await freshRoot()
    function Pages() {
      const [open, setOpen] = useState(true)
      return (
        <>
          <button type="button" onClick={() => setOpen(false)}>
            leave
          </button>
          {open && (
            <Messages catalogs={['common', 'foundations']}>
              <h1>
                <FormattedMessage id="foundations.lead" />
              </h1>
            </Messages>
          )}
        </>
      )
    }
    await renderAndSettle(
      <IntlRoot>
        <Chooser />
        <Pages />
      </IntlRoot>,
    )
    await screen.findByRole('heading', { name: /^Color, type and space/ })
    await userEvent.click(screen.getByRole('button', { name: 'leave' }))
    // The page that was left would not load in Spanish, and nothing may ask for it.
    const fetchLeftPage = vi.spyOn(catalogLoaders.foundations, 'es').mockRejectedValue(new Error('offline'))

    await userEvent.click(await screen.findByRole('button', { name: 'choose es' }))

    expect(await screen.findByText('Documentación')).toBeInTheDocument()
    expect(document.documentElement).toHaveAttribute('lang', 'es')
    expect(fetchLeftPage).not.toHaveBeenCalled()
  })
})
