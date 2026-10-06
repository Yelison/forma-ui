import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { markedMessages, renderInSite } from '../test/render'
import { messages } from './i18n'
import { untranslatedText } from '../test/untranslated'
import { App } from './App'
import { componentPages, routes } from './routes'

// The words that are the same in every language (src/i18n/glossary.md).
const fixedTerms = ['Forma UI', 'GitHub', ...componentPages.map(({ name }) => name)]

describe('App', () => {
  it.each(routes.map((route) => [route.path, route] as const))(
    'renders the page of %s with its own heading',
    (path, route) => {
      renderInSite(<App />, { path })

      const heading = route.key === 'component' ? route.componentName : messages.en[`route.${route.key}.heading`]
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(heading)
    },
  )

  it.each(['/docs/components/checkbox/', '/docs/unknown/', '/docs/components/button/extra/'])(
    'renders the not-found page for %s',
    (path) => {
      renderInSite(<App />, { path })

      expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Back to the homepage' })).toHaveAttribute('href', '/')
    },
  )

  it('has a main landmark and a skip link that points at it', () => {
    renderInSite(<App />)

    expect(screen.getByRole('main')).toHaveAttribute('id', 'main')
    expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveAttribute('href', '#main')
  })

  describe('with every message replaced by a mark', () => {
    it.each(['/', '/docs/components/button/', '/changelog/', '/nowhere/'])(
      'has no visible text or accessible name written in the source, on %s',
      (path) => {
        const { container } = renderInSite(<App />, { path, messages: markedMessages })

        expect(untranslatedText(container, fixedTerms)).toEqual([])
      },
    )
  })
})
