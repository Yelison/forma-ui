// Writes one HTML file for each route after `vite build`, plus 404.html, so that GitHub Pages answers a deep link with
// 200 and its own page head. Each file is the built index.html (same scripts, same stylesheet, same first-paint theme
// script) with the English <title>, meta description and canonical link of its route: only the English head is in the
// static HTML, and the app updates it for the language of the visitor once it runs (see src/head).
//
//   node --experimental-strip-types scripts/emit-route-html.ts [distDirectory]
//
// The directory defaults to dist/ of the site; the pseudo-locale build (npm run build:pseudo) passes its own.
//
// A route whose page loads on demand also gets <link rel="modulepreload"> for its chunk (and its stylesheet), so the
// browser fetches it beside the app instead of after it. The chunk names come from Vite's manifest, which this script
// deletes once it has read it: it is not part of the site that is published.
//
// The script sticks to erasable TypeScript and relative `.ts` imports so that type stripping can run it.
import { existsSync, mkdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { createIntl } from 'react-intl'
import en from '../src/i18n/catalogs/common.en.json' with { type: 'json' }
import es from '../src/i18n/catalogs/common.es.json' with { type: 'json' }
import { defaultLocale } from '../src/i18n/locale.ts'
import { headScript, type PageHead } from '../src/i18n/localeScript.ts'
import { canonicalUrl, notFoundRoute, routes, type RouteKey, type SiteRoute } from '../src/routes.ts'

const escapeHtml = (text: string) =>
  text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')

/** Replaces the one element that `pattern` finds, and fails if there is none or more: the template changed under us. */
function replaceOnce(html: string, pattern: RegExp, replacement: string, description: string): string {
  if (html.match(new RegExp(pattern.source, 'g'))?.length !== 1) {
    throw new Error(`Expected exactly one ${description} in the HTML template`)
  }
  return html.replace(pattern, () => replacement)
}

/** The file of a route under dist/: the directory form `/docs/x/` is served as `docs/x/index.html`. */
export function outputPath(route: SiteRoute): string {
  return route.path.endsWith('/') ? `${route.path.slice(1)}index.html` : route.path.slice(1)
}

/** What the manifest of Vite says about one module of the build (the fields this script reads). */
export interface ManifestEntry {
  /** The built file, relative to the output directory. */
  file: string
  isEntry?: boolean
  isDynamicEntry?: boolean
  /** The keys of the chunks it imports statically. */
  imports?: readonly string[]
  /** The stylesheets that go with the chunk. */
  css?: readonly string[]
}

export type Manifest = Readonly<Record<string, ManifestEntry>>

/**
 * The module of each route whose page loads on demand, by the key of its route, as the manifest names it. A page that
 * App.tsx loads with `lazy` is listed here: the script fails when the build has a page the list does not know, or the
 * list names one the build does not have, so the two cannot drift apart.
 */
export const lazyPageModules: Readonly<Partial<Record<RouteKey, string>>> = {
  foundations: 'src/pages/Foundations/index.ts',
  components: 'src/pages/CatalogPage/index.ts',
  // The six reference pages share one route key, and so one chunk.
  component: 'src/pages/ComponentDetail/index.ts',
}

const pagesDirectory = 'src/pages/'

/** The tags that fetch the chunk of a lazy page, the chunks it shares and its stylesheets, ahead of the app. */
function preloadTags(manifest: Manifest, key: string, base: string): string {
  const chunks = new Set<string>()
  const stylesheets = new Set<string>()
  const visit = (name: string) => {
    const entry = manifest[name]
    if (entry === undefined) throw new Error(`The manifest has no module ${name}`)
    // The entry chunk is the app, which the page is already loading.
    if (entry.isEntry || chunks.has(entry.file)) return
    chunks.add(entry.file)
    entry.css?.forEach((file) => stylesheets.add(file))
    entry.imports?.forEach(visit)
  }
  visit(key)
  return [
    ...[...chunks].map((file) => `<link rel="modulepreload" crossorigin href="${base}${file}" />`),
    ...[...stylesheets].map((file) => `<link rel="stylesheet" crossorigin href="${base}${file}" />`),
  ].join('')
}

/** Checks that `lazyPageModules` and the pages that the build split off name the same modules. */
function assertLazyPagesAreListed(manifest: Manifest) {
  const listed = new Set(Object.values(lazyPageModules))
  for (const module of listed) {
    if (manifest[module]?.isDynamicEntry !== true) {
      throw new Error(`${module} is listed in lazyPageModules, but the build has no lazy chunk for it`)
    }
  }
  for (const [module, entry] of Object.entries(manifest)) {
    if (entry.isDynamicEntry && module.startsWith(pagesDirectory) && !listed.has(module)) {
      throw new Error(`${module} loads on demand but is not in lazyPageModules, so its route would not preload it`)
    }
  }
}

/** The URL prefix the build was made for (`/forma-ui/`, or the pseudo-locale's own), read from the app's script tag. */
function baseOf(template: string, manifest: Manifest): string {
  const entry = Object.values(manifest).find(({ isEntry }) => isEntry)
  const source = /<script[^>]*type="module"[^>]*src="([^"]+)"/.exec(template)?.[1]
  if (entry === undefined || source === undefined || !source.endsWith(entry.file)) {
    throw new Error('Expected the app script of index.html to be the entry of the manifest')
  }
  return source.slice(0, source.length - entry.file.length)
}

/** The messages of each language, by language. The one of the default language is the head of the HTML itself. */
export type Catalogues = Readonly<Record<string, Record<string, string>>>

/** The title and the description of a route in one language, from its catalogue. */
function pageHead(route: SiteRoute, locale: string, messages: Record<string, string>): PageHead {
  const intl = createIntl({ locale, messages })
  const values = route.key === 'component' ? { component: route.componentName } : undefined
  return {
    title: intl.formatMessage({ id: `route.${route.key}.title` }, values),
    description: intl.formatMessage({ id: `route.${route.key}.description` }, values),
  }
}

/**
 * The built index.html with the head of a route: in the default language, English, as the elements themselves, which
 * is what a crawler that does not run scripts reads. The other languages come as a script right after the meta
 * description (see `headScript`), which a visitor in one of them runs before the JS of the app has even arrived, so the
 * tab already has the title in their language. `preloads` are the tags of the chunk that the route loads on demand,
 * which go at the end of the head.
 */
export function renderRouteHtml(
  template: string,
  route: SiteRoute,
  catalogues: Catalogues = { en, es },
  preloads = '',
): string {
  const source = catalogues[defaultLocale]
  if (source === undefined) throw new Error(`Expected the catalogue of ${defaultLocale}, the language of the HTML`)
  const { title, description } = pageHead(route, defaultLocale, source)
  const others = Object.entries(catalogues).filter(([locale]) => locale !== defaultLocale)
  const translatedHead =
    others.length === 0
      ? ''
      : `<script>${headScript(Object.fromEntries(others.map(([locale, messages]) => [locale, pageHead(route, locale, messages)])))}</script>`

  let html = replaceOnce(template, /<title>[^<]*<\/title>/, `<title>${escapeHtml(title)}</title>`, '<title>')
  html = replaceOnce(
    html,
    /<meta\s+name="description"[^>]*>/,
    `<meta name="description" content="${escapeHtml(description)}" />${translatedHead}`,
    'meta description',
  )
  // The not-found page answers many paths, so it has no canonical address and is not for search engines.
  const canonical =
    route.key === 'notFound'
      ? '<meta name="robots" content="noindex" />'
      : `<link rel="canonical" href="${escapeHtml(canonicalUrl(route.path))}" />`
  html = replaceOnce(html, /<link\s+rel="canonical"[^>]*>/, canonical, 'canonical link')
  return preloads === '' ? html : replaceOnce(html, /<\/head>/, `${preloads}</head>`, '</head>')
}

/** Reads the manifest of Vite from a built `dist/`: the build has to have made it (`build.manifest`). */
function readManifest(distDirectory: string): Manifest {
  const file = join(distDirectory, '.vite', 'manifest.json')
  if (!existsSync(file)) throw new Error(`${file} does not exist: build the site with build.manifest enabled`)
  return JSON.parse(readFileSync(file, 'utf8')) as Manifest
}

/**
 * Writes the HTML of every route, and 404.html, into a built `dist/` directory, and deletes the manifest of the build
 * that it read (`dist/.vite`). Returns the files it wrote.
 */
export function emitRouteHtml(distDirectory: string): string[] {
  const template = readFileSync(join(distDirectory, 'index.html'), 'utf8')
  const manifest = readManifest(distDirectory)
  assertLazyPagesAreListed(manifest)
  const base = baseOf(template, manifest)
  const written: string[] = []
  for (const route of [...routes, notFoundRoute]) {
    const file = join(distDirectory, outputPath(route))
    const module = lazyPageModules[route.key]
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(
      file,
      renderRouteHtml(template, route, { en, es }, module === undefined ? '' : preloadTags(manifest, module, base)),
    )
    written.push(outputPath(route))
  }
  rmSync(join(distDirectory, '.vite'), { recursive: true, force: true })
  return written
}

// Whoever imports this module may have an argv[1] that is no file at all (a test runner, `node -e`).
function isMainModule(): boolean {
  const entry = process.argv[1]
  return entry !== undefined && existsSync(entry) && realpathSync(entry) === import.meta.filename
}

if (isMainModule()) {
  const written = emitRouteHtml(resolve(process.argv[2] ?? resolve(import.meta.dirname, '../dist')))
  console.log(`emit-route-html: wrote ${written.length} files (${written.join(', ')}).`)
}
