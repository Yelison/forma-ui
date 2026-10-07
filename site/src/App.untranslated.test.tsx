import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { markedMessages, renderInSiteAndSettle } from '../test/render'
import { untranslatedText } from '../test/untranslated'
import { App } from './App'
import { localeNames } from './i18n'
import { componentPages } from './routes'

// The messages a page loads for itself are the real ones, marked: the chrome gets `markedMessages` from the render, and
// the catalogues of a route come through the loader, which is what this replaces. What the page shows and no mark
// covers is text written in the source.
vi.mock('./i18n/loadCatalogs', async (importOriginal) => {
  const original = await importOriginal<typeof import('./i18n/loadCatalogs')>()
  return {
    ...original,
    loadCatalogs: async (...request: Parameters<typeof original.loadCatalogs>) =>
      Object.fromEntries(Object.keys(await original.loadCatalogs(...request)).map((id) => [id, `⟦${id}⟧`])),
  }
})

// The words that are the same in every language (src/i18n/glossary.md): the product, the names of the components and
// the values of their props, which the controls of the homepage explorer name.
const fixedTerms = [
  'Forma UI',
  'GitHub',
  ...Object.values(localeNames),
  ...componentPages.map(({ name }) => name),
  'primary',
  'secondary',
  'ghost',
  'danger',
]

describe('App with every message replaced by a mark', () => {
  it.each(['/', '/docs/components/button/', '/changelog/', '/nowhere/'])(
    'has no visible text or accessible name written in the source, on %s',
    async (path) => {
      const { container } = await renderInSiteAndSettle(<App />, { path, messages: markedMessages })
      // The page of a route may load on demand: it is checked once it is there, not while its place is held.
      await screen.findByRole('heading', { level: 1 })

      expect(untranslatedText(container, fixedTerms)).toEqual([])
    },
  )
})
