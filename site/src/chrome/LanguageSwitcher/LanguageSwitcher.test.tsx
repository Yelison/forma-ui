import { fireEvent, render, screen, within } from '@testing-library/react'
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
const renderSwitchers = (count = 1) =>
  render(
    <IntlRoot>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} data-testid={`switcher-${index}`}>
          <LanguageSwitcher />
        </div>
      ))}
    </IntlRoot>,
  )

const switcher = (index = 0) => within(screen.getByTestId(`switcher-${index}`))

// jsdom has no popover: the list of languages is closed for good there, and a closed popover is out of the accessibility
// tree, so its options are only found with `hidden`. Opening, closing and focus are checked in the browser (e2e).
const option = (name: string, index = 0) => switcher(index).getByRole('button', { name, hidden: true })

describe('LanguageSwitcher', () => {
  it('is a button whose name says it is the language and which one is in use', () => {
    renderSwitchers()

    expect(screen.getByRole('button', { name: 'Language: English' })).toBeInTheDocument()
  })

  it('is named in the language of the page', () => {
    browserLanguages('es-ES')
    renderSwitchers()

    expect(screen.getByRole('button', { name: 'Idioma: español' })).toBeInTheDocument()
  })

  it('shows the language in use, written in that language, so the visible text is part of the name', () => {
    browserLanguages('es-ES')
    renderSwitchers()

    const visible = switcher()
      .getByRole('button', { name: /español/i })
      .querySelector('[lang]')
    expect(visible).toHaveTextContent('Español')
    expect(visible).toHaveAttribute('lang', 'es')
  })

  it('names the options in their own language, each with its own lang, whatever language the page is in', () => {
    browserLanguages('es-ES')
    renderSwitchers()

    expect(option('English')).toHaveAttribute('lang', 'en')
    expect(option('Español')).toHaveAttribute('lang', 'es')
  })

  it('marks the language in use, and only that one', () => {
    renderSwitchers()

    expect(option('English')).toHaveAttribute('aria-current', 'true')
    expect(option('Español')).not.toHaveAttribute('aria-current')
  })

  describe('choosing a language', () => {
    it('changes the language of the page at once: its messages, its name and <html lang>', async () => {
      renderSwitchers()

      await userEvent.click(option('Español'))

      expect(screen.getByRole('button', { name: 'Idioma: español' })).toBeInTheDocument()
      expect(option('Español')).toHaveAttribute('aria-current', 'true')
      expect(document.documentElement).toHaveAttribute('lang', 'es')
    })

    it('remembers the choice for the next visit', async () => {
      renderSwitchers()

      await userEvent.click(option('Español'))

      expect(localStorage.getItem(localeStorageKey)).toBe('es')
    })

    it('still changes the language when the choice cannot be stored', async () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('blocked')
      })
      renderSwitchers()

      await userEvent.click(option('Español'))

      expect(document.documentElement).toHaveAttribute('lang', 'es')
    })
  })

  // In WebKit, and in Firefox on macOS, pressing a button does not focus it: the option that took focus when the list
  // opened loses it on pointer down, and the blur has no related target. That is not a way out of the list, and closing
  // it there would take it from under the pointer before the click reaches an option.
  describe('a press with the mouse', () => {
    it('does not close the list when focus leaves for no element, so the click still chooses the language', async () => {
      const hidePopover = vi.spyOn(HTMLElement.prototype, 'hidePopover')
      renderSwitchers()

      fireEvent.pointerDown(option('Español'))
      fireEvent.focusOut(option('English'), { relatedTarget: null })
      expect(hidePopover).not.toHaveBeenCalled()
      fireEvent.click(option('Español'))

      expect(document.documentElement).toHaveAttribute('lang', 'es')
    })

    it('closes the list when focus leaves it with nobody pressing, as Tab does', () => {
      const hidePopover = vi.spyOn(HTMLElement.prototype, 'hidePopover')
      renderSwitchers()

      fireEvent.focusOut(option('Español'), { relatedTarget: document.body })

      expect(hidePopover).toHaveBeenCalledOnce()
    })

    // A press that starts on the switcher and is let go outside it sends no pointer up to it: the mark stays. It only
    // covers a blur with no related target, so Tab, which does name the element it goes to, still closes the list.
    it('closes the list on Tab even if the press that started on the switcher was never released there', () => {
      const hidePopover = vi.spyOn(HTMLElement.prototype, 'hidePopover')
      renderSwitchers()

      fireEvent.pointerDown(option('Español'))
      fireEvent.focusOut(option('Español'), { relatedTarget: document.body })

      expect(hidePopover).toHaveBeenCalledOnce()
    })

    // A press that starts on the switcher and is let go outside it sends no pointer up to the switcher, but it is over.
    it('stops being a press when the pointer is released anywhere on the page, not only on the switcher', () => {
      const hidePopover = vi.spyOn(HTMLElement.prototype, 'hidePopover')
      renderSwitchers()

      fireEvent.pointerDown(option('Español'))
      fireEvent.pointerUp(document.body)
      fireEvent.focusOut(option('Español'), { relatedTarget: null })

      expect(hidePopover).toHaveBeenCalledOnce()
    })

    it('stops being a press when the pointer is released, so the next way out closes the list', () => {
      const hidePopover = vi.spyOn(HTMLElement.prototype, 'hidePopover')
      renderSwitchers()

      fireEvent.pointerDown(option('Español'))
      fireEvent.pointerUp(option('Español'))
      fireEvent.focusOut(option('Español'), { relatedTarget: document.body })

      expect(hidePopover).toHaveBeenCalledOnce()
    })
  })

  describe('the announcement', () => {
    const status = (index = 0) => switcher(index).getByRole('status')

    it('is a live region that is on the page, and empty, before anything changes', () => {
      renderSwitchers()

      expect(status()).toBeEmptyDOMElement()
    })

    it('says the change in the new language', async () => {
      renderSwitchers()

      await userEvent.click(option('Español'))
      expect(status()).toHaveTextContent('Idioma cambiado a español')

      await userEvent.click(option('English'))
      expect(status()).toHaveTextContent('Language changed to English')
    })

    it('says nothing when the language in use is chosen again', async () => {
      renderSwitchers()

      await userEvent.click(option('English'))

      expect(status()).toBeEmptyDOMElement()
    })

    // The drawer is a modal dialog, which makes the top bar inert: each switcher has its own region, and one that
    // announced a language must not keep the words of it after the other changed the language, or the same words
    // later would be no change to a screen reader.
    it('is empty again once another switcher has changed the language', async () => {
      renderSwitchers(2)

      await userEvent.click(option('Español', 0))
      expect(status(0)).toHaveTextContent('Idioma cambiado a español')
      expect(status(1)).toBeEmptyDOMElement()

      await userEvent.click(option('English', 1))
      expect(status(0)).toBeEmptyDOMElement()
      expect(status(1)).toHaveTextContent('Language changed to English')

      await userEvent.click(option('Español', 0))
      expect(status(0)).toHaveTextContent('Idioma cambiado a español')
    })
  })
})
