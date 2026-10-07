import { screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderAndSettle } from '../test/render'
import { App } from './App'
import { IntlRoot } from './i18n'
import { locales, localeStorageKey } from './i18n/locale'
import { notFoundRoute, routes } from './routes'

afterEach(() => {
  vi.restoreAllMocks()
  document.documentElement.removeAttribute('lang')
})

// A message that the catalogues a route loads do not have is printed as its id, and react-intl reports it. Rendering a
// route in the real root, which loads only what the route says it needs, is what finds a message that sits in a
// catalogue its page does not load.
describe('the messages a route loads', () => {
  const cases = locales.flatMap((locale) =>
    [...routes, notFoundRoute].map((route) => [locale, route.path, route] as const),
  )

  it.each(cases)('are all the messages its page shows, in %s: %s', async (locale, _path, route) => {
    localStorage.setItem(localeStorageKey, locale)
    const report = vi.spyOn(console, 'error').mockImplementation(() => {})

    await renderAndSettle(
      <IntlRoot>
        <MemoryRouter initialEntries={[route.path]}>
          <App />
        </MemoryRouter>
      </IntlRoot>,
    )

    expect(await screen.findByRole('heading', { level: 1 })).toBeInTheDocument()
    const missing = report.mock.calls.flatMap(([error]) =>
      error?.code === 'MISSING_TRANSLATION' ? [String(error.message)] : [],
    )
    expect(missing).toEqual([])
  })
})
