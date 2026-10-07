import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { catalogNames } from '../src/i18n/catalogNames'
import en from '../src/i18n/catalogs/common.en.json'
import { locales } from '../src/i18n/locale'
import { notFoundRoute, routes } from '../src/routes'
import { emitRouteHtml, outputPath, renderRouteHtml } from './emit-route-html'

const indexHtml = readFileSync(join(import.meta.dirname, '../index.html'), 'utf8')
const route = (path: string) => {
  const found = routes.find((candidate) => candidate.path === path)
  if (!found) throw new Error(`no route ${path}`)
  return found
}

const parse = (html: string) => new DOMParser().parseFromString(html, 'text/html')

// Runs the scripts of the HTML on the page the HTML describes, with the <html lang> the language script would set.
const openIn = (html: string, lang: string) => {
  const page = parse(html)
  page.documentElement.lang = lang
  for (const script of page.querySelectorAll('head script')) new Function('document', script.textContent)(page)
  return page
}

const preloads = (page: Document) =>
  [...page.querySelectorAll('head link[rel="modulepreload"]')].map((link) => link.getAttribute('href'))

/** The URLs that the scripts of the head asked the browser to preload, once the page is in `lang`: not the tags. */
const preloadedIn = (html: string, lang: string) => {
  const tags = preloads(parse(html))
  return preloads(openIn(html, lang)).filter((href) => !tags.includes(href))
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
    const html = renderRouteHtml(indexHtml, route('/changelog/'), { catalogues: { en: messages } })

    expect(html).toContain('<title>A &amp; B &lt;i&gt;</title>')
    expect(html).toContain('content="Say &quot;hi&quot;"')
  })

  describe('the head in the other languages', () => {
    const description = (page: Document) => page.querySelector('meta[name="description"]')?.getAttribute('content')

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
      expect(renderRouteHtml(indexHtml, route('/docs/foundations/'), { catalogues: { en } })).not.toContain(
        'document.title=',
      )
    })

    it('stays one script element whatever the translation holds', () => {
      const es = {
        'route.changelog.title': '</script><img src=x onerror=alert(1)>',
        'route.changelog.description': '<!-- <script>',
      }
      const html = renderRouteHtml(indexHtml, route('/changelog/'), { catalogues: { en, es } })

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
  'src/pages/CatalogPage/index.ts': {
    file: 'assets/CatalogPage-page.js',
    isDynamicEntry: true,
    css: ['assets/CatalogPage-page.css'],
    imports: ['_shared.js', 'index.html'],
  },
  'src/pages/ComponentDetail/index.ts': {
    file: 'assets/ComponentDetail-page.js',
    isDynamicEntry: true,
    css: ['assets/ComponentDetail-page.css'],
    imports: ['_shared.js', 'index.html'],
  },
  '_shared.js': { file: 'assets/shared-chunk.js', css: ['assets/shared-chunk.css'] },
  ...Object.fromEntries(
    catalogNames.flatMap((name) =>
      locales.map((locale) => [
        `src/i18n/catalogs/${name}.${locale}.json`,
        { file: `assets/${name}.${locale}-hash.js`, isDynamicEntry: true },
      ]),
    ),
  ),
}

describe('renderRouteHtml catalogue preloads', () => {
  const catalogPreloads = { en: ['/forma-ui/en/common.js'], es: ['/forma-ui/es/common.js', '/forma-ui/es/page.js'] }
  const html = renderRouteHtml(builtTemplate, route('/docs/foundations/'), { catalogPreloads })

  it('preloads the catalogues of the language the page opens in, and not those of the other', () => {
    expect(preloadedIn(html, 'es')).toEqual(['/forma-ui/es/common.js', '/forma-ui/es/page.js'])
    expect(preloadedIn(html, 'en')).toEqual(['/forma-ui/en/common.js'])
  })

  it('preloads in the way the app imports them: with the anonymous CORS mode of a module', () => {
    const link = openIn(html, 'en').querySelector('head link[rel="modulepreload"]')

    expect(link?.getAttribute('crossorigin')).toBe('')
  })

  it('preloads nothing for a language the site does not have', () => {
    expect(preloadedIn(html, 'fr')).toEqual([])
  })

  it('comes after the language script and the meta description, and before the app and the stylesheet', () => {
    const script = html.indexOf('/forma-ui/en/common.js')

    expect(script).toBeGreaterThan(html.indexOf('<meta name="description"'))
    expect(script).toBeLessThan(html.indexOf(appScript))
    expect(script).toBeLessThan(html.indexOf('</head>'))
  })

  it('is not written without catalogues to preload', () => {
    expect(renderRouteHtml(builtTemplate, route('/docs/foundations/'))).not.toContain('modulepreload')
  })
})

describe('renderRouteHtml preloads', () => {
  it('adds the tags it is given at the end of the head', () => {
    const html = renderRouteHtml(builtTemplate, route('/docs/foundations/'), {
      preloads: '<link rel="modulepreload" href="/x.js" />',
    })

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

  it('preloads the chunk of the catalog on its own route, and not the one of Foundations', () => {
    emitRouteHtml(build())

    const html = read('docs/components/index.html')
    expect(html).toContain('<link rel="modulepreload" crossorigin href="/forma-ui/assets/CatalogPage-page.js" />')
    expect(html).toContain('<link rel="stylesheet" crossorigin href="/forma-ui/assets/CatalogPage-page.css" />')
    expect(html).not.toContain('Foundations-page')
  })

  it('preloads the chunk of the references on the page of each component', () => {
    emitRouteHtml(build())

    for (const file of ['button', 'icon-button', 'dialog']) {
      expect(read(`docs/components/${file}/index.html`)).toContain(
        '<link rel="modulepreload" crossorigin href="/forma-ui/assets/ComponentDetail-page.js" />',
      )
    }
    expect(read('docs/components/index.html')).not.toContain('ComponentDetail-page')
  })

  it('leaves the other routes without the preload of a page chunk', () => {
    emitRouteHtml(build())

    expect(read('docs/getting-started/index.html')).not.toContain('<link rel="modulepreload"')
    expect(read('404.html')).not.toContain('<link rel="modulepreload"')
  })

  describe('the catalogues of a route', () => {
    const forms = (language: string) => (file: string) => preloadedIn(read(file), language)
    const named = (language: string, ...names: string[]) =>
      names.map((name) => `/forma-ui/assets/${name}.${language}-hash.js`)

    it.each([
      ['index.html', ['common', 'home']],
      ['docs/getting-started/index.html', ['common']],
      ['docs/foundations/index.html', ['common', 'foundations']],
      ['docs/components/index.html', ['common', 'catalog', 'specimens']],
      ['docs/components/tooltip/index.html', ['common', 'detail', 'specimens', 'docs.tooltip']],
      ['404.html', ['common']],
    ])('are preloaded by %s, in the language of the visitor: %j', (file, names) => {
      emitRouteHtml(build())

      expect(forms('es')(file)).toEqual(named('es', ...names))
      expect(forms('en')(file)).toEqual(named('en', ...names))
    })
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

  it('fails when the build has not kept a catalogue as a chunk of its own, which no route could preload', () => {
    const manifest = Object.fromEntries(
      Object.entries(builtManifest).filter(([module]) => module !== 'src/i18n/catalogs/home.es.json'),
    )

    expect(() => emitRouteHtml(build(manifest))).toThrow('src/i18n/catalogs/home.es.json is a catalogue')
  })

  it('fails when a listed page has no lazy chunk in the build', () => {
    const { 'src/pages/Foundations/index.ts': _removed, ...manifest } = builtManifest

    expect(() => emitRouteHtml(build(manifest))).toThrow('no lazy chunk')
  })
})
