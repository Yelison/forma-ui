import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import en from '../src/i18n/en.json'
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
    const html = renderRouteHtml(indexHtml, route('/changelog/'), { en: messages })

    expect(html).toContain('<title>A &amp; B &lt;i&gt;</title>')
    expect(html).toContain('content="Say &quot;hi&quot;"')
  })

  describe('the head in the other languages', () => {
    const parse = (html: string) => new DOMParser().parseFromString(html, 'text/html')
    const description = (page: Document) => page.querySelector('meta[name="description"]')?.getAttribute('content')

    // Runs the script of the HTML on the page the HTML describes, with the <html lang> the language script would set.
    const openIn = (html: string, lang: string) => {
      const page = parse(html)
      page.documentElement.lang = lang
      for (const script of page.querySelectorAll('head script')) new Function('document', script.textContent)(page)
      return page
    }

    it('puts the title and the description in Spanish on the page of a Spanish visitor, before any JS runs', () => {
      const page = openIn(renderRouteHtml(indexHtml, route('/docs/foundations/')), 'es')

      expect(page.title).toBe('Fundamentos · Forma UI')
      expect(description(page)).toMatch(/^Roles de color/)
    })

    it('leaves the English head for an English visitor, so a crawler that does not run scripts reads English', () => {
      const html = renderRouteHtml(indexHtml, route('/docs/foundations/'))
      const page = openIn(html, 'en')

      expect(page.title).toBe('Foundations · Forma UI')
      expect(description(page)).toMatch(/^Color roles/)
      expect(description(parse(html))).toMatch(/^Color roles/)
    })

    it('names a component page after its component in Spanish too', () => {
      const page = openIn(renderRouteHtml(indexHtml, route('/docs/components/icon-button/')), 'es')

      expect(page.title).toBe('IconButton · Forma UI')
      expect(description(page)).toBe('Referencia del componente IconButton: variantes, estados, API y accesibilidad.')
    })

    it('does the same for the not-found page', () => {
      expect(openIn(renderRouteHtml(indexHtml, notFoundRoute), 'es').title).toBe('Página no encontrada · Forma UI')
    })

    // The script reads <title> and the meta description, so it has to come after them, and before the app.
    it('comes after <title> and the meta description', () => {
      const html = renderRouteHtml(indexHtml, route('/docs/foundations/'))

      expect(html.indexOf('document.title=')).toBeGreaterThan(html.indexOf('<meta name="description"'))
      expect(html.indexOf('document.title=')).toBeGreaterThan(html.indexOf('</title>'))
    })

    it('is not written when the site has no other language', () => {
      expect(renderRouteHtml(indexHtml, route('/docs/foundations/'), { en })).not.toContain('document.title=')
    })

    it('stays one script element whatever the translation holds', () => {
      const es = {
        'route.changelog.title': '</script><img src=x onerror=alert(1)>',
        'route.changelog.description': '<!-- <script>',
      }
      const html = renderRouteHtml(indexHtml, route('/changelog/'), { en, es })

      expect(parse(html).querySelectorAll('head script')).toHaveLength(1)
      expect(parse(html).querySelector('img')).toBeNull()
      expect(openIn(html, 'es').title).toBe('</script><img src=x onerror=alert(1)>')
    })
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

// What `vite build` leaves in dist/ for the parts that matter here: the template with the app's script, and the manifest.
const appScript = '<script type="module" crossorigin src="/forma-ui/assets/index-app.js"></script>'
const builtTemplate = indexHtml.replace('</head>', `${appScript}</head>`)
const builtManifest = {
  'index.html': { file: 'assets/index-app.js', isEntry: true },
  'src/pages/Foundations/index.ts': {
    file: 'assets/Foundations-page.js',
    isDynamicEntry: true,
    css: ['assets/Foundations-page.css'],
    imports: ['_shared.js', 'index.html'],
  },
  '_shared.js': { file: 'assets/shared-chunk.js', css: ['assets/shared-chunk.css'] },
}

describe('renderRouteHtml preloads', () => {
  it('adds the tags it is given at the end of the head', () => {
    const html = renderRouteHtml(
      builtTemplate,
      route('/docs/foundations/'),
      undefined,
      '<link rel="modulepreload" href="/x.js" />',
    )

    expect(html.indexOf('<link rel="modulepreload" href="/x.js" />')).toBeGreaterThan(html.indexOf(appScript))
    expect(html.indexOf('<link rel="modulepreload"')).toBeLessThan(html.indexOf('</head>'))
  })
})

describe('emitRouteHtml', () => {
  let directory = ''
  afterEach(() => {
    if (directory !== '') rmSync(directory, { recursive: true, force: true })
  })

  function build(manifest: object = builtManifest) {
    directory = mkdtempSync(join(tmpdir(), 'forma-ui-emit-'))
    writeFileSync(join(directory, 'index.html'), builtTemplate)
    mkdirSync(join(directory, '.vite'))
    writeFileSync(join(directory, '.vite/manifest.json'), JSON.stringify(manifest))
    return directory
  }
  const read = (file: string) => readFileSync(join(directory, file), 'utf8')

  it('writes a file for every route and the 404 page', () => {
    const written = emitRouteHtml(build())

    expect(written).toHaveLength(routes.length + 1)
    expect(read('docs/components/dialog/index.html')).toContain('<title>Dialog · Forma UI</title>')
    expect(read('404.html')).toContain('noindex')
  })

  it('preloads the chunk of a lazy page, what it imports and its stylesheets, with the base of the build', () => {
    emitRouteHtml(build())

    const html = read('docs/foundations/index.html')
    expect(html).toContain('<link rel="modulepreload" crossorigin href="/forma-ui/assets/Foundations-page.js" />')
    expect(html).toContain('<link rel="modulepreload" crossorigin href="/forma-ui/assets/shared-chunk.js" />')
    expect(html).toContain('<link rel="stylesheet" crossorigin href="/forma-ui/assets/Foundations-page.css" />')
    expect(html).toContain('<link rel="stylesheet" crossorigin href="/forma-ui/assets/shared-chunk.css" />')
    // The app is already loading: it is not preloaded again.
    expect(html.match(/index-app\.js/g)).toHaveLength(1)
  })

  it('leaves the other routes without preloads', () => {
    emitRouteHtml(build())

    expect(read('docs/getting-started/index.html')).not.toContain('modulepreload')
    expect(read('404.html')).not.toContain('modulepreload')
  })

  it('deletes the manifest, which is not part of what is published', () => {
    emitRouteHtml(build())

    expect(existsSync(join(directory, '.vite'))).toBe(false)
  })

  it('fails when the build has no manifest', () => {
    directory = mkdtempSync(join(tmpdir(), 'forma-ui-emit-'))
    writeFileSync(join(directory, 'index.html'), builtTemplate)

    expect(() => emitRouteHtml(directory)).toThrow('build.manifest')
  })

  it('fails when the build splits off a page that is not listed, so its route would not preload it', () => {
    const manifest = {
      ...builtManifest,
      'src/pages/Catalog/index.ts': { file: 'assets/Catalog.js', isDynamicEntry: true },
    }

    expect(() => emitRouteHtml(build(manifest))).toThrow('src/pages/Catalog/index.ts loads on demand')
  })

  it('fails when a listed page has no lazy chunk in the build', () => {
    const { 'src/pages/Foundations/index.ts': _removed, ...manifest } = builtManifest

    expect(() => emitRouteHtml(build(manifest))).toThrow('no lazy chunk')
  })
})
