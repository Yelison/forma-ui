/// <reference types="vitest/config" />
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { themeScript } from '@yelison/forma-ui'
import { defineConfig } from 'vite'
import { firstPaintScripts } from './scripts/first-paint.ts'
import { messagesAst } from './scripts/messages-ast.ts'
import { defaultLocale, localeStorageKey, locales } from './src/i18n/locale.ts'
import { localeScript } from './src/i18n/localeScript.ts'
import { siteBasePath } from './src/routes.ts'
import { themeStorageKey } from './src/theme.ts'

// Several checkouts can run side by side (see docs/development/herdr.md): each one takes its own ports from the
// environment. Without those variables the ports are the bases of DEV_SERVER_PORT and PLAYWRIGHT_PORT (slot 0, the
// main checkout), never Vite's own 5173 and 4173. A busy port is an error, not a reason to move to another one,
// which could belong to another checkout.
const devServerPort = Number(process.env.DEV_SERVER_PORT || 5280)
const previewPort = Number(process.env.PLAYWRIGHT_PORT || 4280)

const pseudoDirectory = '__pseudo__'

// The site imports @yelison/forma-ui the way a consumer does: through the workspace link and the package's exports
// map, which point at the built dist/. There is deliberately no alias to the library's sources.
export default defineConfig(({ command, mode, isPreview }) => ({
  // The pseudo-locale build is served by the same preview as the real one, from a directory of its own inside dist/.
  base: mode === 'pseudo' ? `${siteBasePath}${pseudoDirectory}/` : siteBasePath,
  build: { outDir: mode === 'pseudo' ? `dist/${pseudoDirectory}` : 'dist' },
  resolve: {
    // The production build ships the messages as syntax trees (scripts/messages-ast.ts), so react-intl never parses an
    // ICU message and the parser is left out of the bundle: this entry has `parse` throw instead. Tests and the dev
    // server pass plain strings, which need the real parser.
    alias:
      command === 'build'
        ? [
            {
              find: /^@formatjs\/icu-messageformat-parser$/,
              replacement: '@formatjs/icu-messageformat-parser/no-parser.js',
            },
          ]
        : [],
  },
  // The preview stands in for GitHub Pages: a path is answered by its own HTML file (scripts/emit-route-html.ts) or by
  // 404, never by the app shell. The dev server has no such files, so it keeps the single-page fallback.
  appType: isPreview ? 'mpa' : 'spa',
  plugins: [
    react(),
    firstPaintScripts([
      // The library's own theme script, with the key the theme store of the site uses, and the language script, which
      // is generated from `pickLocale`, the function the app resolves the language with too.
      themeScript({ storageKey: themeStorageKey }),
      localeScript({ storageKey: localeStorageKey, locales, fallback: defaultLocale }),
    ]),
    messagesAst({
      directory: resolve(import.meta.dirname, 'src/i18n'),
      // `npm run build:pseudo` builds the site with accented, longer text in place of the messages, to check that no
      // layout depends on the length of English. It is never what is deployed.
      pseudoLocale: mode === 'pseudo' ? 'en-XA' : undefined,
    }),
  ],
  server: {
    port: devServerPort,
    strictPort: true,
  },
  preview: {
    port: previewPort,
    strictPort: true,
  },
  test: {
    // The machine is shared in development (see docs/development/herdr.md), so two workers; CI has it to itself.
    maxWorkers: process.env.CI ? 3 : 2,
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.ts'],
    css: { modules: { classNameStrategy: 'non-scoped' } },
  },
}))
