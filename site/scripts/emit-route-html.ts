// Writes one HTML file for each route after `vite build`, plus 404.html, so that GitHub Pages answers a deep link with
// 200 and its own page head. Each file is the built index.html (same scripts, same stylesheet, same first-paint theme
// script) with the English <title>, meta description and canonical link of its route: only the English head is in the
// static HTML, and the app updates it for the language of the visitor once it runs (see src/head).
//
//   node --experimental-strip-types scripts/emit-route-html.ts
//
// The script sticks to erasable TypeScript and relative `.ts` imports so that type stripping can run it.
import { existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { createIntl } from 'react-intl'
import en from '../src/i18n/en.json' with { type: 'json' }
import { canonicalUrl, notFoundRoute, routes, type SiteRoute } from '../src/routes.ts'

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

/** The built index.html with the English head of a route. */
export function renderRouteHtml(template: string, route: SiteRoute, messages: Record<string, string> = en): string {
  const intl = createIntl({ locale: 'en', messages })
  const values = route.key === 'component' ? { component: route.componentName } : undefined
  const title = escapeHtml(intl.formatMessage({ id: `route.${route.key}.title` }, values))
  const description = escapeHtml(intl.formatMessage({ id: `route.${route.key}.description` }, values))

  let html = replaceOnce(template, /<title>[^<]*<\/title>/, `<title>${title}</title>`, '<title>')
  html = replaceOnce(
    html,
    /<meta\s+name="description"[^>]*>/,
    `<meta name="description" content="${description}" />`,
    'meta description',
  )
  // The not-found page answers many paths, so it has no canonical address and is not for search engines.
  const canonical =
    route.key === 'notFound'
      ? '<meta name="robots" content="noindex" />'
      : `<link rel="canonical" href="${escapeHtml(canonicalUrl(route.path))}" />`
  return replaceOnce(html, /<link\s+rel="canonical"[^>]*>/, canonical, 'canonical link')
}

/** Writes the HTML of every route, and 404.html, into a built `dist/` directory. Returns the files it wrote. */
export function emitRouteHtml(distDirectory: string): string[] {
  const template = readFileSync(join(distDirectory, 'index.html'), 'utf8')
  const written: string[] = []
  for (const route of [...routes, notFoundRoute]) {
    const file = join(distDirectory, outputPath(route))
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file, renderRouteHtml(template, route))
    written.push(outputPath(route))
  }
  return written
}

// Whoever imports this module may have an argv[1] that is no file at all (a test runner, `node -e`).
function isMainModule(): boolean {
  const entry = process.argv[1]
  return entry !== undefined && existsSync(entry) && realpathSync(entry) === import.meta.filename
}

if (isMainModule()) {
  const written = emitRouteHtml(resolve(import.meta.dirname, '../dist'))
  console.log(`emit-route-html: wrote ${written.length} files (${written.join(', ')}).`)
}
