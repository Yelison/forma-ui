import { describe, expect, it } from 'vitest'
import { findEntries } from './findEntries'
import type { SearchEntry } from './searchEntries'

const entry = (title: string, description: string, group: SearchEntry['group'] = 'pages'): SearchEntry => ({
  path: `/${title}/`,
  title,
  description,
  group,
})

const entries = [
  entry('Button', 'Reference for Button.', 'components'),
  entry('Dialog', 'A modal that interrupts the page.', 'components'),
  entry('Foundations', 'Color roles, type hierarchy and spacing.'),
  entry('Accesibilidad', 'Teclado, foco y etiquetas.'),
  entry('Theming', 'Light and dark, with a button to switch.'),
]
const titles = (query: string, locale = 'en') => findEntries(entries, query, locale).map((found) => found.title)

describe('findEntries', () => {
  it('lists everything for an empty query, and for one that is only spaces', () => {
    expect(titles('')).toEqual(['Button', 'Dialog', 'Foundations', 'Accesibilidad', 'Theming'])
    expect(titles('   ')).toEqual(titles(''))
  })

  it('ignores case', () => {
    expect(titles('DIALOG')).toEqual(['Dialog'])
  })

  it('ignores accents on both sides', () => {
    expect(titles('accesibilidád', 'es')).toEqual(['Accesibilidad'])
    expect(titles('hierarquia')).toEqual([])
    expect(findEntries([entry('Fundamentos', 'Jerarquía tipográfica.')], 'jerarquia tipografica', 'es')).toHaveLength(1)
  })

  it('needs every word of the query, wherever each one is', () => {
    expect(titles('dark button')).toEqual(['Theming'])
    expect(titles('dialog zzz')).toEqual([])
  })

  it('puts the start of a title first, then the middle of one, then a match in the description alone', () => {
    const ranked = [
      entry('Toggle', 'A button that switches.'),
      entry('Subbutton', 'Nested.'),
      entry('Button', 'The original.'),
    ]

    expect(findEntries(ranked, 'button', 'en').map((found) => found.title)).toEqual(['Button', 'Subbutton', 'Toggle'])
  })

  it('puts a match in a title before one in a description, even in another group', () => {
    // The component only mentions the word; the page is named after it, and is what Enter has to reach.
    const mixed = [
      entry('Widget', 'Reference: variants and accessibility.', 'components'),
      entry('Accessibility', 'Keyboard.'),
    ]

    expect(findEntries(mixed, 'accessibility', 'en').map((found) => found.title)).toEqual(['Accessibility', 'Widget'])
  })

  it('keeps the entries of a group together, with the group of the best match first', () => {
    const mixed = [
      entry('Panel', 'A component.', 'components'),
      entry('Sidebar', 'Next to the panel.', 'components'),
      entry('Panels', 'A page.'),
      entry('Sidepanel', 'Another page.'),
    ]

    expect(findEntries(mixed, 'panel', 'en').map((found) => found.title)).toEqual([
      'Panel',
      'Sidebar',
      'Panels',
      'Sidepanel',
    ])
  })

  it('keeps the components before the pages when their best matches tie', () => {
    const mixed = [entry('Panel page', 'A page.'), entry('Panel', 'A component.', 'components')]

    expect(findEntries(mixed, 'panel', 'en').map((found) => found.title)).toEqual(['Panel', 'Panel page'])
  })
})
