import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { IntlRoot } from '../../i18n'
import { localeStorageKey } from '../../i18n/locale'
import { LanguageSwitcher } from './LanguageSwitcher'

afterEach(() => {
  vi.restoreAllMocks()
  document.documentElement.removeAttribute('lang')
})

const browserLanguages = (...languages: string[]) => vi.spyOn(navigator, 'languages', 'get').mockReturnValue(languages)

// The real root, so a choice changes the language of the page, its <html lang> and the storage, as it does on the site.
const renderSwitcher = () =>
  render(
    <IntlRoot>
      <LanguageSwitcher />
    </IntlRoot>,
  )

// jsdom has no popover: the list of languages is closed for good there, and a closed popover is out of the accessibility
// tree, so its options are only found with `hidden`. Opening, closing and focus are checked in the browser (e2e).
const option = (name: string) => screen.getByRole('button', { name, hidden: true })

describe('LanguageSwitcher', () => {
  it('is a button whose name says it is the language and which one is in use', () => {
    renderSwitcher()

    expect(screen.getByRole('button', { name: 'Language: English' })).toBeInTheDocument()
  })

  it('is named in the language of the page', () => {
    browserLanguages('es-ES')
    renderSwitcher()

    expect(screen.getByRole('button', { name: 'Idioma: español' })).toBeInTheDocument()
  })

  it('shows the language in use, written in that language, so the visible text is part of the name', () => {
    browserLanguages('es-ES')
    renderSwitcher()

    const visible = screen.getByRole('button', { name: /español/i }).querySelector('[lang]')
    expect(visible).toHaveTextContent('Español')
    expect(visible).toHaveAttribute('lang', 'es')
  })

  it('names the options in their own language, each with its own lang, whatever language the page is in', () => {
    browserLanguages('es-ES')
    renderSwitcher()

    expect(option('English')).toHaveAttribute('lang', 'en')
    expect(option('Español')).toHaveAttribute('lang', 'es')
  })

  it('marks the language in use, and only that one', () => {
    renderSwitcher()

    expect(option('English')).toHaveAttribute('aria-current', 'true')
    expect(option('Español')).not.toHaveAttribute('aria-current')
  })

  describe('choosing a language', () => {
    it('changes the language of the page at once: its messages, its name and <html lang>', async () => {
      renderSwitcher()

      await userEvent.click(option('Español'))

      expect(screen.getByRole('button', { name: 'Idioma: español' })).toBeInTheDocument()
      expect(option('Español')).toHaveAttribute('aria-current', 'true')
      expect(document.documentElement).toHaveAttribute('lang', 'es')
    })

    it('remembers the choice for the next visit', async () => {
      renderSwitcher()

      await userEvent.click(option('Español'))

      expect(localStorage.getItem(localeStorageKey)).toBe('es')
    })

    it('still changes the language when the choice cannot be stored', async () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('blocked')
      })
      renderSwitcher()

      await userEvent.click(option('Español'))

      expect(document.documentElement).toHaveAttribute('lang', 'es')
    })
  })

  describe('the announcement', () => {
    const status = () => screen.getByRole('status')

    it('is a live region that is on the page, and empty, before anything changes', () => {
      renderSwitcher()

      expect(status()).toBeEmptyDOMElement()
    })

    it('says the change in the new language', async () => {
      renderSwitcher()

      await userEvent.click(option('Español'))
      expect(status()).toHaveTextContent('Idioma cambiado a español')

      await userEvent.click(option('English'))
      expect(status()).toHaveTextContent('Language changed to English')
    })

    it('says nothing when the language in use is chosen again', async () => {
      renderSwitcher()

      await userEvent.click(option('English'))

      expect(status()).toBeEmptyDOMElement()
    })
  })
})
