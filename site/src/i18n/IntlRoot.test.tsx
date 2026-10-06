import { render, screen } from '@testing-library/react'
import { FormattedMessage } from 'react-intl'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { IntlRoot } from './IntlRoot'
import { localeStorageKey } from './locale'

afterEach(() => {
  vi.restoreAllMocks()
  document.documentElement.removeAttribute('lang')
})

const browserLanguages = (...languages: string[]) => vi.spyOn(navigator, 'languages', 'get').mockReturnValue(languages)

const renderGreeting = () =>
  render(
    <IntlRoot>
      <p>
        <FormattedMessage id="nav.docs" />
      </p>
    </IntlRoot>,
  )

describe('IntlRoot', () => {
  it('shows the messages in the language of the browser and sets <html lang> to it', () => {
    browserLanguages('es-ES')
    renderGreeting()

    expect(screen.getByText('Documentación')).toBeInTheDocument()
    expect(document.documentElement).toHaveAttribute('lang', 'es')
  })

  it('opens in English when the browser speaks a language the site does not', () => {
    browserLanguages('fr-FR')
    renderGreeting()

    expect(screen.getByText('Documentation')).toBeInTheDocument()
    expect(document.documentElement).toHaveAttribute('lang', 'en')
  })

  it('prefers the stored choice to the browser', () => {
    browserLanguages('es-ES')
    localStorage.setItem(localeStorageKey, 'en')
    renderGreeting()

    expect(screen.getByText('Documentation')).toBeInTheDocument()
    expect(document.documentElement).toHaveAttribute('lang', 'en')
  })
})
