import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { markedMessages } from '../../../test/render'
import { untranslatedText } from '../../../test/untranslated'
import { codeOf, renderReference, sectionsOfPage } from '../referenceTestUtils'

describe('the reference of Avatar', () => {
  it('lists its sections: the examples and the usual ones', () => {
    renderReference('Avatar')

    expect(screen.getByRole('heading', { level: 1, name: 'Avatar' })).toBeInTheDocument()
    expect(sectionsOfPage()).toEqual([
      'Sizes',
      'Tones',
      'Initials',
      'Picture',
      'Decorative',
      'Usage',
      'API',
      'Accessibility',
      'Limitations',
    ])
  })

  it('shows the three sizes with their JSX', () => {
    renderReference('Avatar')

    const sizes = screen.getByRole('region', { name: 'Sizes' })
    expect(within(sizes).getAllByRole('img', { name: 'Laura Méndez' })).toHaveLength(3)
    expect(codeOf('Sizes')).toContain('<Avatar name="Laura Méndez" size="large" />')
  })

  it('shows the five tones on a card, so that the neutral one is not a bare disc on the panel', () => {
    renderReference('Avatar')

    const tones = screen.getByRole('region', { name: 'Tones' })
    const avatars = within(tones).getAllByRole('img', { name: 'Laura Méndez' })
    expect(avatars).toHaveLength(5)
    // The class is the only thing that tells the card from the panel in jsdom, which paints no CSS.
    for (const avatar of avatars) expect(avatar.parentElement).toHaveClass(/surface/)
    expect(codeOf('Tones')).toContain('<Avatar name="Laura Méndez" tone="neutral" />')
  })

  it('shows the initials of a name of one, two and three words', () => {
    renderReference('Avatar')

    const initials = screen.getByRole('region', { name: 'Initials' })
    expect(within(initials).getByRole('img', { name: 'Marcos' })).toHaveTextContent('M')
    expect(within(initials).getByRole('img', { name: 'Laura Méndez' })).toHaveTextContent('LM')
    expect(within(initials).getByRole('img', { name: 'María Pérez Gómez' })).toHaveTextContent('MG')
  })

  it('shows a picture, and the initials where the picture does not load', () => {
    renderReference('Avatar')

    const picture = screen.getByRole('region', { name: 'Picture' })
    expect(picture.querySelectorAll('img[alt=""][src^="data:image"]')).toHaveLength(2)
  })

  it('hides the decorative avatar and keeps the name beside it', () => {
    renderReference('Avatar')

    const decorative = screen.getByRole('region', { name: 'Decorative' })
    expect(within(decorative).queryByRole('img')).not.toBeInTheDocument()
    expect(decorative).toHaveTextContent('Laura Méndez')
    expect(codeOf('Decorative')).toContain('<Avatar name="Laura Méndez" decorative />')
  })

  it('documents every prop it takes, and no native attribute', () => {
    renderReference('Avatar')

    const api = screen.getByRole('region', { name: 'API' })
    const documented = within(api)
      .getAllByRole('listitem')
      .map((item) => item.firstElementChild?.textContent)
    expect(documented).toEqual(['name', 'size', 'tone', 'src', 'decorative', 'className'])
  })

  it('writes the page and its JSX in Spanish', () => {
    renderReference('Avatar', 'es')

    expect(screen.getByRole('region', { name: 'Tonos' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Iniciales' })).toBeInTheDocument()
    expect(codeOf('Decorativo')).toContain('<Avatar name="Laura Méndez" decorative />')
  })

  it('writes nothing of its own on the page: every text comes from a message', () => {
    const { container } = renderReference('Avatar', 'en', markedMessages)

    // The initials are made of the name, which is a message: here, the mark that stands for it. An empty `alt` says
    // nothing in any language.
    const unreached = untranslatedText(container, ['Avatar', '⟦']).filter((text) => text !== 'alt=""')
    expect(unreached).toEqual([])
  })
})
