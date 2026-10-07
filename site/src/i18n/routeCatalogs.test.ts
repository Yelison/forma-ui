import { describe, expect, it } from 'vitest'
import { componentPages, notFoundRoute, routes } from '../routes'
import { catalogNames } from './catalogNames'
import { pageCatalogs, routeCatalogs } from './routeCatalogs'

const route = (path: string) => {
  const found = routes.find((candidate) => candidate.path === path)
  if (!found) throw new Error(`no route ${path}`)
  return found
}

describe('routeCatalogs', () => {
  it('has the chrome catalogue first on every route, and no catalogue twice', () => {
    for (const each of [...routes, notFoundRoute]) {
      const names = routeCatalogs(each)

      expect(names[0]).toBe('common')
      expect(new Set(names).size).toBe(names.length)
    }
  })

  it.each([
    ['/', ['common', 'home']],
    ['/docs/getting-started/', ['common', 'guides', 'gettingStarted']],
    ['/docs/foundations/', ['common', 'foundations']],
    ['/docs/components/', ['common', 'catalog', 'specimens']],
  ])('gives %s the catalogues of its page: %j', (path, names) => {
    expect(routeCatalogs(route(path))).toEqual(names)
  })

  it.each(['/docs/guides/theming/', '/docs/guides/accessibility/', '/changelog/'])(
    'gives %s only the chrome catalogue, which already holds its title',
    (path) => {
      expect(routeCatalogs(route(path))).toEqual(['common'])
    },
  )

  it('gives the not-found page, which answers any path, only the chrome catalogue', () => {
    expect(routeCatalogs(notFoundRoute)).toEqual(['common'])
  })

  // The six references are one route key and one chunk, but each page needs the reference of its own component only.
  it.each([
    ['Button', 'docs.button'],
    ['IconButton', 'docs.iconButton'],
    ['Badge', 'docs.badge'],
    ['Input', 'docs.input'],
    ['Tooltip', 'docs.tooltip'],
    ['Dialog', 'docs.dialog'],
  ])('gives the reference of %s its own catalogue, %s, and no other reference', (name, catalogue) => {
    const path = componentPages.find((page) => page.name === name)?.slug
    const names = routeCatalogs(route(`/docs/components/${path}/`))

    expect(names).toEqual(['common', 'detail', 'specimens', catalogue])
  })

  it('has a catalogue for the reference of every component page', () => {
    const references = routes.flatMap((each) => (each.key === 'component' ? pageCatalogs(each) : []))

    expect(references.filter((name) => name.startsWith('docs.'))).toHaveLength(componentPages.length)
  })

  it('fails for a component page whose reference has no catalogue, rather than loading nothing', () => {
    expect(() => pageCatalogs({ key: 'component', path: '/docs/components/radio/', componentName: 'Radio' })).toThrow(
      'Radio has no reference catalogue',
    )
  })

  it('leaves no catalogue that no route loads, which nothing would ever show', () => {
    const used = new Set([...routes, notFoundRoute].flatMap((each) => routeCatalogs(each)))

    expect(catalogNames.filter((name) => !used.has(name))).toEqual([])
  })
})
