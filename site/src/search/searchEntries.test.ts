import { createIntl } from 'react-intl'
import { describe, expect, it } from 'vitest'
import { messages } from '../../test/messages'
import { componentPages, routes } from '../routes'
import { searchEntries } from './searchEntries'

const entriesIn = (locale: 'en' | 'es') =>
  searchEntries(createIntl({ locale, messages: messages[locale] }).formatMessage)

describe('searchEntries', () => {
  it('lists every component with a reference page, then every page of the documentation', () => {
    const entries = entriesIn('en')

    expect(entries.filter((entry) => entry.group === 'components').map((entry) => entry.title)).toEqual(
      componentPages.map((component) => component.name),
    )
    expect(entries.filter((entry) => entry.group === 'pages').map((entry) => entry.title)).toEqual([
      'Getting started',
      'Foundations',
      'Components',
      'Theming',
      'Accessibility',
      'Changelog',
    ])
  })

  it('points each entry at a route of the manifest', () => {
    const paths = routes.map((route) => route.path)

    for (const entry of entriesIn('en')) expect(paths).toContain(entry.path)
  })

  it('leaves out the homepage, which is not something to look for', () => {
    expect(entriesIn('en').map((entry) => entry.path)).not.toContain('/')
  })

  it('writes the pages in the active language and keeps the names of the components', () => {
    const entries = entriesIn('es')

    expect(entries.map((entry) => entry.title)).toEqual(
      expect.arrayContaining(['Button', 'Primeros pasos', 'Fundamentos', 'Componentes', 'Cambios']),
    )
    expect(entries.find((entry) => entry.title === 'Fundamentos')?.description).toMatch(/^Roles de color/)
    expect(entries.find((entry) => entry.title === 'Button')?.description).toBe(
      'Referencia del componente Button: variantes, estados, API y accesibilidad.',
    )
  })
})
