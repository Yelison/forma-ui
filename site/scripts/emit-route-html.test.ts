import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { notFoundRoute, routes } from '../src/routes'
import { emitRouteHtml, outputPath, renderRouteHtml } from './emit-route-html'

const indexHtml = readFileSync(join(import.meta.dirname, '../index.html'), 'utf8')
const route = (path: string) => {
  const found = routes.find((candidate) => candidate.path === path)
  if (!found) throw new Error(`no route ${path}`)
  return found
}

describe('outputPath', () => {
  it.each([
    ['/', 'index.html'],
    ['/changelog/', 'changelog/index.html'],
    ['/docs/components/button/', 'docs/components/button/index.html'],
  ])('puts %s in %s', (path, file) => {
    expect(outputPath(route(path))).toBe(file)
  })

  it('puts the not-found page in 404.html, the file Pages serves for an unknown path', () => {
    expect(outputPath(notFoundRoute)).toBe('404.html')
  })
})

describe('renderRouteHtml', () => {
  it('gives a route its English title, description and canonical link', () => {
    const html = renderRouteHtml(indexHtml, route('/docs/foundations/'))

    expect(html).toContain('<title>Foundations · Forma UI</title>')
    expect(html).toContain(
      'content="Color roles, type hierarchy and measured spacing behind every Forma UI component."',
    )
    expect(html).toContain('<link rel="canonical" href="https://yelison.github.io/forma-ui/docs/foundations/" />')
  })

  it('names a component page after its component', () => {
    const html = renderRouteHtml(indexHtml, route('/docs/components/icon-button/'))

    expect(html).toContain('<title>IconButton · Forma UI</title>')
    expect(html).toContain('Reference for the IconButton component')
  })

  it('keeps everything else of the template: the scripts, the stylesheet and the first-paint theme script', () => {
    const template = indexHtml.replace(
      '</head>',
      '<script>theme()</script><script type="module" src="/forma-ui/assets/app.js"></script></head>',
    )
    const html = renderRouteHtml(template, route('/changelog/'))

    expect(html).toContain('<script>theme()</script>')
    expect(html).toContain('<script type="module" src="/forma-ui/assets/app.js"></script>')
  })

  it('escapes what an attribute or an element cannot hold', () => {
    const messages = {
      // ICU quotes a literal angle bracket with apostrophes.
      'route.changelog.title': "A & B '<'i'>'",
      'route.changelog.description': 'Say "hi"',
    }
    const html = renderRouteHtml(indexHtml, route('/changelog/'), messages)

    expect(html).toContain('<title>A &amp; B &lt;i&gt;</title>')
    expect(html).toContain('content="Say &quot;hi&quot;"')
  })

  it('has no canonical address for the not-found page, and asks search engines to skip it', () => {
    const html = renderRouteHtml(indexHtml, notFoundRoute)

    expect(html).toContain('<title>Page not found · Forma UI</title>')
    expect(html).not.toContain('rel="canonical"')
    expect(html).toContain('<meta name="robots" content="noindex" />')
  })

  it('fails when the template lacks an element it has to replace', () => {
    const withoutTitle = indexHtml.replace(/<title>[^<]*<\/title>/, '')

    expect(() => renderRouteHtml(withoutTitle, route('/'))).toThrow('exactly one <title>')
  })

  it('writes for the homepage the head that index.html already has, so the two cannot drift apart', () => {
    const head = (html: string) => {
      const page = new DOMParser().parseFromString(html, 'text/html')
      return [
        page.title,
        page.querySelector('meta[name="description"]')?.getAttribute('content'),
        page.querySelector('link[rel="canonical"]')?.getAttribute('href'),
      ]
    }

    expect(head(renderRouteHtml(indexHtml, route('/')))).toEqual(head(indexHtml))
  })
})

describe('emitRouteHtml', () => {
  let directory = ''
  afterEach(() => {
    if (directory !== '') rmSync(directory, { recursive: true, force: true })
  })

  it('writes a file for every route and the 404 page', () => {
    directory = mkdtempSync(join(tmpdir(), 'forma-ui-emit-'))
    mkdirSync(directory, { recursive: true })
    writeFileSync(join(directory, 'index.html'), indexHtml)

    const written = emitRouteHtml(directory)

    expect(written).toHaveLength(routes.length + 1)
    expect(readFileSync(join(directory, 'docs/components/dialog/index.html'), 'utf8')).toContain(
      '<title>Dialog · Forma UI</title>',
    )
    expect(readFileSync(join(directory, '404.html'), 'utf8')).toContain('noindex')
  })
})
