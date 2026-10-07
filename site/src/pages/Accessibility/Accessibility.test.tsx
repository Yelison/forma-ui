import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { markedMessages, renderInSite } from '../../../test/render'
import { untranslatedText } from '../../../test/untranslated'
import { componentDocs } from '../../docs'
import { componentPages, routes } from '../../routes'
import { Accessibility } from './Accessibility'
import { obligationGroups } from './obligations'

const route = routes.find((candidate) => candidate.key === 'accessibility')!
const render = (options?: Parameters<typeof renderInSite>[1]) => renderInSite(<Accessibility route={route} />, options)

describe('Accessibility', () => {
  it('has a section for each question, in order, and a table of contents that links each one', () => {
    render()

    const titles = screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent)
    expect(titles.slice(0, 7)).toEqual([
      'Keyboard',
      'Focus',
      'Names and labels',
      'Errors and announcements',
      'States',
      'Dialogs',
      'Tooltips',
    ])
    const links = within(screen.getByRole('navigation', { name: 'On this page' })).getAllByRole('link')
    expect(links.map((link) => link.getAttribute('href'))).toEqual(obligationGroups.map(({ id }) => `#${id}`))
    for (const [index, { id }] of obligationGroups.entries()) {
      expect(screen.getByRole('region', { name: titles[index] })).toHaveAttribute('id', id)
    }
  })

  it('lists every obligation of a group in the section of the group', () => {
    render()

    for (const group of obligationGroups) {
      const section = document.getElementById(group.id)!
      expect(within(section).getAllByRole('listitem')).toHaveLength(group.obligations.length)
    }
  })

  it('links each group to the accessibility section of the reference of every component it speaks of', () => {
    render()

    const dialog = within(document.getElementById('dialog')!)
    expect(dialog.getByRole('link', { name: 'Dialog' })).toHaveAttribute(
      'href',
      '/docs/components/dialog/#accessibility',
    )
    const tooltip = within(document.getElementById('tooltip')!)
    expect(tooltip.getAllByRole('link').map((link) => link.getAttribute('href'))).toEqual([
      '/docs/components/tooltip/#accessibility',
      '/docs/components/icon-button/#accessibility',
    ])
  })

  it('only links to references that exist and that have an accessibility section to land on', () => {
    for (const { references } of obligationGroups) {
      for (const name of references) {
        const slug = componentPages.find((page) => page.name === name)?.slug
        expect(slug, name).toBeDefined()
        expect(componentDocs[slug!]?.accessibility.length, name).toBeGreaterThan(0)
      }
    }
  })

  it('speaks only of components that the library publishes', () => {
    expect(new Set(obligationGroups.flatMap(({ references }) => references))).toEqual(
      new Set(['Button', 'IconButton', 'Input', 'Badge', 'Dialog', 'Tooltip']),
    )
  })

  it('writes in Spanish when the page is in Spanish', () => {
    render({ locale: 'es' })

    expect(screen.getByRole('heading', { level: 2, name: 'Teclado' })).toBeInTheDocument()
    expect(screen.getAllByText('En las fichas:')).toHaveLength(obligationGroups.length)
  })

  it('writes no visible text, name or description that a message does not hold', () => {
    const { container } = render({ messages: markedMessages })

    // The links carry the name of a component, which is never translated.
    const names = componentPages.map(({ name }) => name)
    expect(untranslatedText(container, names)).toEqual([])
  })
})
