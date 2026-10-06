import { describe, expect, it } from 'vitest'
import { routes } from '../routes'
import { documentationCurrent, documentationLinks, isDocumentationPath } from './navigation'

describe('isDocumentationPath', () => {
  it.each(['/docs/getting-started/', '/docs/components/button/', '/docs/guides/theming', '/changelog/', '/changelog'])(
    'includes %s',
    (path) => {
      expect(isDocumentationPath(path)).toBe(true)
    },
  )

  it.each(['/', '/documents/', '/nowhere/', '/changelog/old/'])('leaves out %s', (path) => {
    expect(isDocumentationPath(path)).toBe(false)
  })
})

describe('documentationCurrent', () => {
  it.each(['/docs/getting-started/', '/docs/getting-started'])(
    'is the page on %s, the one the link points at',
    (path) => {
      expect(documentationCurrent(path)).toBe('page')
    },
  )

  it.each(['/docs/foundations/', '/docs/getting-started/extra/', '/changelog/'])(
    'is only the section on %s',
    (path) => {
      expect(documentationCurrent(path)).toBe('true')
    },
  )

  it.each(['/', '/nowhere/'])('is nothing on %s, outside the section', (path) => {
    expect(documentationCurrent(path)).toBeUndefined()
  })
})

describe('documentationLinks', () => {
  it('only point at routes of the manifest', () => {
    const paths = routes.map((route) => route.path)
    for (const link of documentationLinks) expect(paths).toContain(link.path)
  })
})
