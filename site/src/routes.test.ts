import { describe, expect, it } from 'vitest'
import { canonicalUrl, componentPages, notFoundRoute, routes } from './routes'

describe('the route manifest', () => {
  it('lists the paths of the plan, in English, each ending with a slash', () => {
    expect(routes.map((route) => route.path)).toEqual([
      '/',
      '/docs/getting-started/',
      '/docs/foundations/',
      '/docs/components/',
      '/docs/components/button/',
      '/docs/components/icon-button/',
      '/docs/components/badge/',
      '/docs/components/input/',
      '/docs/components/tooltip/',
      '/docs/components/dialog/',
      '/docs/components/tabs/',
      '/docs/components/radio/',
      '/docs/guides/theming/',
      '/docs/guides/accessibility/',
      '/changelog/',
    ])
  })

  it('has no path twice', () => {
    const paths = routes.map((route) => route.path)
    expect(new Set(paths).size).toBe(paths.length)
  })

  it('names each component page with the name of the component, not its slug', () => {
    expect(componentPages.map(({ slug, name }) => [slug, name])).toContainEqual(['icon-button', 'IconButton'])
    const names = routes.flatMap((route) => ('componentName' in route ? [route.componentName] : []))
    expect(names).toEqual(componentPages.map(({ name }) => name))
  })

  it('keeps the not-found page out of the routes it lists', () => {
    expect(routes).not.toContainEqual(notFoundRoute)
    expect(notFoundRoute.path).toBe('/404.html')
  })
})

describe('canonicalUrl', () => {
  it('puts the base path between the origin and the path', () => {
    expect(canonicalUrl('/docs/components/button/')).toBe('https://yelison.github.io/forma-ui/docs/components/button/')
  })

  it('keeps the root a single slash after the base path', () => {
    expect(canonicalUrl('/')).toBe('https://yelison.github.io/forma-ui/')
  })
})
