import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderInSite, renderInSiteAndSettle } from '../test/render'
import { messages } from '../test/messages'
import { App } from './App'
import { routes } from './routes'

describe('App', () => {
  it.each(routes.map((route) => [route.path, route] as const))(
    'renders the page of %s with its own heading',
    async (path, route) => {
      await renderInSiteAndSettle(<App />, { path })

      // Awaited: the page of a route may load on demand, with the messages that are its own.
      const heading = route.key === 'component' ? route.componentName : messages.en[`route.${route.key}.heading`]
      expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(heading)
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
})
