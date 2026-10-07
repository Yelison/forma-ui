import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { codeOf, renderReference, sectionsOfPage, textOutsideMessages } from '../referenceTestUtils'

describe('the reference of Badge', () => {
  it('lists its sections: the tones and the usual ones', () => {
    renderReference('Badge')

    expect(screen.getByRole('heading', { level: 1, name: 'Badge' })).toBeInTheDocument()
    expect(sectionsOfPage()).toEqual(['Tones', 'Usage', 'API', 'Accessibility', 'Limitations'])
  })

  it('shows the five tones, each with a word that says what it means and with its JSX', () => {
    renderReference('Badge')

    const tones = screen.getByRole('region', { name: 'Tones' })
    for (const word of ['Draft', 'In review', 'Published', 'Pending', 'Failed']) {
      expect(within(tones).getByText(word)).toBeVisible()
    }
    expect(codeOf('Tones')).toContain('<Badge tone="neutral">\n  Draft\n</Badge>')
    expect(codeOf('Tones')).toContain('<Badge tone="red">\n  Failed\n</Badge>')
  })

  it('puts every tone on a card, so that the neutral one is not a bare word on the panel', () => {
    renderReference('Badge')

    const tones = screen.getByRole('region', { name: 'Tones' })
    // The class is the only thing that tells the card from the panel in jsdom, which paints no CSS. What it looks like is
    // measured in a browser, in e2e/component-references.spec.ts (the background behind the neutral badge).
    for (const badge of within(tones).getAllByText(/^(Draft|In review|Published|Pending|Failed)$/)) {
      expect(badge.parentElement).toHaveClass(/surface/)
    }
  })

  it('documents the tone, and the native attributes that Badge changes', () => {
    renderReference('Badge')

    const api = screen.getByRole('region', { name: 'API' })
    const documented = within(api)
      .getAllByRole('listitem')
      .map((item) => item.firstElementChild?.textContent)
    expect(documented).toEqual(['tone', 'children', 'className'])
  })

  it('writes the page and its JSX in Spanish', () => {
    renderReference('Badge', 'es')

    expect(screen.getByRole('region', { name: 'Tonos' })).toBeInTheDocument()
    expect(codeOf('Tonos')).toContain('<Badge tone="green">\n  Publicado\n</Badge>')
  })

  it('writes nothing of its own on the page: every text comes from a message', () => {
    expect(textOutsideMessages('Badge', [])).toEqual([])
  })
})
