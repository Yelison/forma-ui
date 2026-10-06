import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Link, Route, Routes } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'
import { renderInSite } from '../../../test/render'
import { routes, type SiteRoute } from '../../routes'
import { RoutePage } from './RoutePage'

const route = (key: SiteRoute['key']) => {
  const found = routes.find((candidate) => candidate.key === key)
  if (!found) throw new Error(`no route ${key}`)
  return found
}

// The static HTML of a route has these elements; the page keeps them up to date.
document.head.insertAdjacentHTML(
  'beforeend',
  '<meta name="description" content="static"><link rel="canonical" href="https://static.example/">',
)

afterEach(() => {
  document.title = ''
})

describe('RoutePage', () => {
  it.each([
    ['en', 'Foundations', 'Foundations · Forma UI'],
    ['es', 'Fundamentos', 'Fundamentos · Forma UI'],
  ] as const)('shows the heading and sets the title in %s', (locale, heading, title) => {
    renderInSite(<RoutePage route={route('foundations')} />, { locale })

    expect(screen.getByRole('heading', { level: 1, name: heading })).toBeInTheDocument()
    expect(document.title).toBe(title)
  })

  it('sets the meta description and the canonical link of the route', () => {
    renderInSite(<RoutePage route={route('foundations')} />, { locale: 'es' })

    expect(document.head.querySelector('meta[name="description"]')).toHaveAttribute(
      'content',
      'Roles de color, jerarquía tipográfica y espaciado medido detrás de cada componente de Forma UI.',
    )
    expect(document.head.querySelector('link[rel="canonical"]')).toHaveAttribute(
      'href',
      'https://yelison.github.io/forma-ui/docs/foundations/',
    )
  })

  it('titles a component page with the name of the component, which is not translated', () => {
    const page = routes.find((candidate) => candidate.path === '/docs/components/icon-button/')!
    renderInSite(<RoutePage route={page} />, { locale: 'es' })

    expect(screen.getByRole('heading', { level: 1, name: 'IconButton' })).toBeInTheDocument()
    expect(document.title).toBe('IconButton · Forma UI')
    expect(document.head.querySelector('meta[name="description"]')).toHaveAttribute(
      'content',
      'Referencia del componente IconButton: variantes, estados, API y accesibilidad.',
    )
  })

  it('does not move focus when the page is the first one loaded', () => {
    renderInSite(<RoutePage route={route('foundations')} />)

    expect(document.body).toHaveFocus()
  })

  it('moves focus to the heading after a client-side navigation', async () => {
    renderInSite(
      <>
        <Link to="/docs/foundations/">go</Link>
        <Routes>
          <Route path="/" element={<RoutePage route={route('home')} />} />
          <Route path="/docs/foundations/" element={<RoutePage route={route('foundations')} />} />
        </Routes>
      </>,
    )

    await userEvent.click(screen.getByRole('link', { name: 'go' }))

    await waitFor(() => expect(screen.getByRole('heading', { level: 1, name: 'Foundations' })).toHaveFocus())
  })
})
