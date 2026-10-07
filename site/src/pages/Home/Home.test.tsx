import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderInSite } from '../../../test/render'
import { Home } from './Home'

describe('Home', () => {
  it.each([
    ['en', 'A shared library, from token to component.', 'View components', 'Integration guide'],
    ['es', 'Una biblioteca compartida, del token al componente.', 'Ver componentes', 'Guía de integración'],
  ] as const)('introduces the library in %s and offers the next steps', (locale, intro, components, guide) => {
    renderInSite(<Home />, { locale })

    expect(screen.getByText(intro)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: components })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: guide })).toBeInTheDocument()
  })

  it('links the next steps to the components and to getting started', () => {
    renderInSite(<Home />)

    expect(screen.getByRole('link', { name: 'View components' })).toHaveAttribute('href', '/docs/components/')
    expect(screen.getByRole('link', { name: 'Integration guide' })).toHaveAttribute('href', '/docs/getting-started/')
  })

  it('shows the three principles, each under a heading of its own', () => {
    renderInSite(<Home />)

    const principles = within(screen.getByRole('list'))
    expect(principles.getAllByRole('listitem')).toHaveLength(3)
    for (const title of ['Tokens with meaning', 'Complete states', 'Accessibility first']) {
      expect(principles.getByRole('heading', { level: 2, name: title })).toBeInTheDocument()
    }
  })

  it('shows the explorer between the next steps and the principles', () => {
    renderInSite(<Home />)

    const explorer = screen.getByRole('region', { name: 'Component explorer' })
    const link = screen.getByRole('link', { name: 'View components' })
    const principles = screen.getByRole('list')

    expect(link.compareDocumentPosition(explorer) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(explorer.compareDocumentPosition(principles) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })
})
