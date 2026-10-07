import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderInSite } from '../../../test/render'
import { routes, type SiteRoute } from '../../routes'
import { ComponentDetail } from './ComponentDetail'

const routeOf = (name: string) => {
  const route = routes.find((candidate) => candidate.key === 'component' && candidate.componentName === name)
  if (route?.key !== 'component') throw new Error(`No reference route for ${name}`)
  return route
}

function renderButton(locale: 'en' | 'es' = 'en') {
  const route = routeOf('Button')
  return renderInSite(<ComponentDetail route={route} />, { path: route.path, locale })
}

/** The JSX shown for a group of examples, by the name of its section. */
const codeOf = (section: string) =>
  within(screen.getByRole('region', { name: section })).getByRole('figure').textContent ?? ''

describe('ComponentDetail', () => {
  it('names the page by the component and lists its sections in a table of contents', () => {
    renderButton()

    expect(screen.getByRole('heading', { level: 1, name: 'Button' })).toBeInTheDocument()
    const toc = within(screen.getByRole('navigation', { name: 'On this page' }))
    expect(toc.getAllByRole('link').map((link) => link.textContent)).toEqual([
      'Variants',
      'Sizes',
      'States',
      'Usage',
      'API',
      'Accessibility',
      'Limitations',
    ])
  })

  it('links each entry of the table of contents to a section of the page', () => {
    renderButton()

    for (const link of within(screen.getByRole('navigation', { name: 'On this page' })).getAllByRole('link')) {
      const section = document.getElementById(link.getAttribute('href')!.slice(1))
      expect(section, link.textContent).not.toBeNull()
      expect(section).toHaveAccessibleName(link.textContent!)
    }
  })

  it('shows the four variants working, with the JSX of each', () => {
    renderButton()

    const variants = screen.getByRole('region', { name: 'Variants' })
    expect(within(variants).getAllByRole('button', { name: 'Continue' })).toHaveLength(4)
    expect(codeOf('Variants')).toContain('<Button variant="danger">\n  Continue\n</Button>')
  })

  it('shows the states that the library has: default, hover, focus, disabled, aria-disabled and loading', () => {
    renderButton()

    const states = screen.getByRole('region', { name: 'States' })
    for (const state of ['Default', 'Hover', 'Focus', 'Disabled', 'Disabled, focusable', 'Loading']) {
      expect(within(states).getByText(state)).toBeInTheDocument()
    }
    expect(within(states).queryByText('Pressed')).not.toBeInTheDocument()
    expect(within(states).getByRole('button', { name: 'Saving…' })).toHaveAttribute('aria-busy', 'true')
    expect(codeOf('States')).toContain('loading\n  loadingLabel="Saving…"')
    expect(codeOf('States')).toContain('<Button variant="primary" aria-disabled>')
  })

  it('lists the proposed sizes disabled and marked, and never in the JSX', () => {
    renderButton()

    const sizes = screen.getByRole('region', { name: 'Sizes' })
    for (const proposed of ['32 px · Proposed', '40 px · Proposed', '48 px · Proposed']) {
      expect(within(sizes).getByRole('button', { name: proposed })).toBeDisabled()
    }
    expect(within(sizes).getByText('Small · proposed')).toBeInTheDocument()
    expect(within(sizes).queryByRole('figure')).not.toBeInTheDocument()
    expect(document.body.textContent).not.toContain('size=')
  })

  it('documents the props of the library, and the native ones that Button changes', () => {
    renderButton()

    const api = screen.getByRole('region', { name: 'API' })
    expect(within(api).getByRole('heading', { name: 'Props of Button' })).toBeInTheDocument()
    const documented = within(api)
      .getAllByRole('listitem')
      .map((item) => item.firstElementChild?.textContent)
    expect(documented).toEqual(expect.arrayContaining(['variant', 'icon', 'loading', 'loadingLabel', 'block']))
    expect(within(api).getByRole('heading', { name: 'Native attributes that Button changes' })).toBeInTheDocument()
    expect(documented).toContain('aria-disabled')
  })

  it('shows the basic usage as a preview, and as the import with the JSX in a code view that can be copied', async () => {
    renderButton()
    const usage = screen.getByRole('region', { name: 'Usage' })
    expect(within(usage).getByRole('button', { name: 'Continue' })).toBeVisible()

    await userEvent.click(within(usage).getByRole('tab', { name: 'Code' }))

    const code = within(usage).getByRole('tabpanel', { name: 'Code' })
    expect(code).toHaveTextContent(`import { Button } from '@yelison/forma-ui'`)
    expect(code).toHaveTextContent('<Button variant="primary">')
    expect(within(code).getByRole('button', { name: 'Copy' })).toBeVisible()
  })

  it('renders with an anchor that is not valid percent-encoding, and finds nothing to scroll to', () => {
    const route = routeOf('Button')
    renderInSite(<ComponentDetail route={route} />, { path: `${route.path}#100%` })

    expect(screen.getByRole('heading', { level: 1, name: 'Button' })).toBeInTheDocument()
  })

  it('writes the page, the JSX and the labels in Spanish', () => {
    renderButton('es')

    expect(screen.getByRole('navigation', { name: 'En esta página' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Estados' })).toBeInTheDocument()
    expect(codeOf('Variantes')).toContain('<Button variant="primary">\n  Continuar\n</Button>')
    expect(screen.getByRole('button', { name: 'Guardando…' })).toBeInTheDocument()
  })

  it('shows only the placeholder of a component whose reference is not written yet', () => {
    const route: SiteRoute = routeOf('IconButton')
    renderInSite(<ComponentDetail route={route as Extract<SiteRoute, { key: 'component' }>} />, { path: route.path })

    expect(screen.getByRole('heading', { level: 1, name: 'IconButton' })).toBeInTheDocument()
    expect(screen.queryByRole('region')).not.toBeInTheDocument()
  })
})
