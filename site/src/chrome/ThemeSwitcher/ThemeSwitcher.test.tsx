import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderAndSettle, renderInSite } from '../../../test/render'
import { IntlRoot } from '../../i18n'
import { LanguageSwitcher } from '../LanguageSwitcher'
import { themeStorageKey, themeStore } from '../../theme'
import { ThemeSwitcher } from './ThemeSwitcher'

afterEach(() => {
  vi.restoreAllMocks()
  // The store is one for the whole file: a choice kept in memory by a test that blocked storage must not reach the next.
  themeStore.setPreference('system')
})

// jsdom has no popover: the list of themes is closed for good there, and a closed popover is out of the accessibility
// tree, so its options are only found with `hidden`. Opening, closing and focus are checked in the browser (e2e).
const option = (name: string) => screen.getByRole('button', { name, hidden: true })

describe('ThemeSwitcher', () => {
  it('is a button whose name says it is the theme and which one is in use, system until the visitor chooses', () => {
    renderInSite(<ThemeSwitcher />)

    const button = screen.getByRole('button', { name: 'Theme: system' })
    expect(button).toHaveTextContent('System')
  })

  it('is named in the language of the page', () => {
    renderInSite(<ThemeSwitcher />, { locale: 'es' })

    expect(screen.getByRole('button', { name: 'Tema: sistema' })).toHaveTextContent('Sistema')
  })

  it('offers light, dark and system, and marks the one in use', () => {
    localStorage.setItem(themeStorageKey, 'dark')
    renderInSite(<ThemeSwitcher />)

    expect(option('Light')).not.toHaveAttribute('aria-current')
    expect(option('Dark')).toHaveAttribute('aria-current', 'true')
    expect(option('System')).not.toHaveAttribute('aria-current')
  })

  describe('choosing a theme', () => {
    it('paints it at once: the button, the option in use and the theme of the document', async () => {
      renderInSite(<ThemeSwitcher />)

      await userEvent.click(option('Dark'))

      expect(screen.getByRole('button', { name: 'Theme: dark' })).toHaveTextContent('Dark')
      expect(option('Dark')).toHaveAttribute('aria-current', 'true')
      expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
    })

    it('remembers a fixed theme for the next visit, under the key the first-paint script reads', async () => {
      renderInSite(<ThemeSwitcher />)

      await userEvent.click(option('Light'))

      expect(localStorage.getItem(themeStorageKey)).toBe('light')
    })

    it('goes back to following the operating system, which forgets the stored theme', async () => {
      localStorage.setItem(themeStorageKey, 'dark')
      renderInSite(<ThemeSwitcher />)

      await userEvent.click(option('System'))

      expect(localStorage.getItem(themeStorageKey)).toBeNull()
      expect(document.documentElement).not.toHaveAttribute('data-theme')
      expect(screen.getByRole('button', { name: 'Theme: system' })).toBeInTheDocument()
    })

    it('still changes the theme when the choice cannot be stored', async () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('blocked')
      })
      renderInSite(<ThemeSwitcher />)

      await userEvent.click(option('Dark'))

      expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
    })
  })

  describe('the announcement', () => {
    const status = () => screen.getByRole('status')

    it('is a live region that is on the page, and empty, before anything changes', () => {
      renderInSite(<ThemeSwitcher />)

      expect(status()).toBeEmptyDOMElement()
    })

    it('says the change in the language of the page', async () => {
      renderInSite(<ThemeSwitcher />)
      await userEvent.click(option('Dark'))
      expect(status()).toHaveTextContent('Theme changed to dark')
    })

    it('says it in Spanish on a Spanish page', async () => {
      renderInSite(<ThemeSwitcher />, { locale: 'es' })

      await userEvent.click(option('Oscuro'))

      expect(status()).toHaveTextContent('Tema cambiado a oscuro')
    })

    it('says the new theme each time, system included', async () => {
      renderInSite(<ThemeSwitcher />)

      await userEvent.click(option('Light'))
      await userEvent.click(option('System'))

      expect(status()).toHaveTextContent('Theme changed to system')
    })

    // The drawer holds both switchers and its regions are heard: the theme did not change when the language did.
    it('is emptied, not translated, when the language changes after it, and the language announces itself', async () => {
      await renderAndSettle(
        <IntlRoot>
          <ThemeSwitcher />
          <LanguageSwitcher />
        </IntlRoot>,
      )
      const [themeStatus, languageStatus] = screen.getAllByRole('status')

      await userEvent.click(option('Dark'))
      expect(themeStatus).toHaveTextContent('Theme changed to dark')
      await userEvent.click(option('Español'))

      await waitFor(() => expect(languageStatus).toHaveTextContent('Idioma cambiado a español'))
      expect(themeStatus).toBeEmptyDOMElement()
    })

    it('says nothing when the theme in use is chosen again', async () => {
      renderInSite(<ThemeSwitcher />)

      await userEvent.click(option('System'))

      expect(status()).toBeEmptyDOMElement()
    })
  })
})
