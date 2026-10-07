import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderAndSettle } from '../../../test/render'
import { IntlRoot } from '../../i18n'
import { localeStorageKey } from '../../i18n/locale'
import { LanguageSwitcher } from './LanguageSwitcher'

afterEach(() => {
  vi.restoreAllMocks()
  document.documentElement.removeAttribute('lang')
})

const browserLanguages = (...languages: string[]) => vi.spyOn(navigator, 'languages', 'get').mockReturnValue(languages)

// The real root, so a choice changes the language of the page, its <html lang> and the storage, as it does on the site.
const renderSwitcher = async () => {
  await renderAndSettle(
    <IntlRoot>
      <LanguageSwitcher />
    </IntlRoot>,
  )
  // The messages of the first language may still be on their way: nothing is there until the button is.
  await screen.findByRole('button', { name: /^(Language|Idioma): / })
}

// jsdom has no popover: the list of languages is closed for good there, and a closed popover is out of the accessibility
// tree, so its options are only found with `hidden`. Opening, closing and focus are checked in the browser (e2e).
const option = (name: string) => screen.getByRole('button', { name, hidden: true })

describe('LanguageSwitcher', () => {
  it('is a button whose name says it is the language and which one is in use', async () => {
    await renderSwitcher()

    expect(screen.getByRole('button', { name: 'Language: English' })).toBeInTheDocument()
  })

  it('is named in the language of the page', async () => {
    browserLanguages('es-ES')
    await renderSwitcher()

    expect(screen.getByRole('button', { name: 'Idioma: español' })).toBeInTheDocument()
  })

  it('shows the language in use, written in that language, so the visible text is part of the name', async () => {
    browserLanguages('es-ES')
    await renderSwitcher()

    const visible = screen.getByRole('button', { name: /español/i }).querySelector('[lang]')
    expect(visible).toHaveTextContent('Español')
    expect(visible).toHaveAttribute('lang', 'es')
  })

  it('names the options in their own language, each with its own lang, whatever language the page is in', async () => {
    browserLanguages('es-ES')
    await renderSwitcher()

    expect(option('English')).toHaveAttribute('lang', 'en')
    expect(option('Español')).toHaveAttribute('lang', 'es')
  })

  it('marks the language in use, and only that one', async () => {
    await renderSwitcher()

    expect(option('English')).toHaveAttribute('aria-current', 'true')
    expect(option('Español')).not.toHaveAttribute('aria-current')
  })

  describe('choosing a language', () => {
    it('changes the language of the page: its messages, its name and <html lang>', async () => {
      await renderSwitcher()

      await userEvent.click(option('Español'))

      expect(await screen.findByRole('button', { name: 'Idioma: español' })).toBeInTheDocument()
      expect(option('Español')).toHaveAttribute('aria-current', 'true')
      expect(document.documentElement).toHaveAttribute('lang', 'es')
    })

    it('remembers the choice for the next visit', async () => {
      await renderSwitcher()

      await userEvent.click(option('Español'))

      await waitFor(() => expect(localStorage.getItem(localeStorageKey)).toBe('es'))
    })

    it('still changes the language when the choice cannot be stored', async () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('blocked')
      })
      await renderSwitcher()

      await userEvent.click(option('Español'))

      await waitFor(() => expect(document.documentElement).toHaveAttribute('lang', 'es'))
    })
  })

  describe('the announcement', () => {
    const status = () => screen.getByRole('status')

    it('is a live region that is on the page, and empty, before anything changes', async () => {
      await renderSwitcher()

      expect(status()).toBeEmptyDOMElement()
    })

    it('says the change in the new language', async () => {
      await renderSwitcher()

      await userEvent.click(option('Español'))
      await waitFor(() => expect(status()).toHaveTextContent('Idioma cambiado a español'))

      await userEvent.click(option('English'))
      await waitFor(() => expect(status()).toHaveTextContent('Language changed to English'))
    })

    it('says nothing when the language in use is chosen again', async () => {
      await renderSwitcher()

      await userEvent.click(option('English'))

      expect(status()).toBeEmptyDOMElement()
    })

    it('says so when the language could not be loaded, and the page stays in the one it has', async () => {
      // The loader keeps what it fetched, so this one starts from the modules anew, with the Spanish chrome failing.
      vi.resetModules()
      const [{ IntlRoot: FreshRoot }, { LanguageSwitcher: FreshSwitcher }, { catalogLoaders }, { loadCatalogs }] =
        await Promise.all([
          import('../../i18n'),
          import('./LanguageSwitcher'),
          import('../../i18n/catalogLoaders'),
          import('../../i18n/loadCatalogs'),
        ])
      await loadCatalogs('en', ['common'])
      vi.spyOn(catalogLoaders.common, 'es').mockRejectedValueOnce(new Error('offline'))
      await renderAndSettle(
        <FreshRoot>
          <FreshSwitcher />
        </FreshRoot>,
      )
      await screen.findByRole('button', { name: 'Language: English' })

      await userEvent.click(option('Español'))

      await waitFor(() =>
        expect(status()).toHaveTextContent('The language could not be loaded. The page stays in English.'),
      )
      expect(screen.getByRole('button', { name: 'Language: English' })).toBeInTheDocument()

      // Trying again is a new choice: the notice goes, and the change is announced when it happens.
      await userEvent.click(option('Español'))
      await waitFor(() => expect(status()).toHaveTextContent('Idioma cambiado a español'))
    })
  })
})
