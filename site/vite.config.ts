/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { themeScript } from '@yelison/forma-ui'
import { defineConfig, type Plugin } from 'vite'
import { siteBasePath } from './src/routes.ts'
import { themeStorageKey } from './src/theme.ts'

// Several checkouts can run side by side (see docs/development/herdr.md): each one takes its own ports from the
// environment. Without those variables the ports are the bases of DEV_SERVER_PORT and PLAYWRIGHT_PORT (slot 0, the
// main checkout), never Vite's own 5173 and 4173. A busy port is an error, not a reason to move to another one,
// which could belong to another checkout.
const devServerPort = Number(process.env.DEV_SERVER_PORT || 5280)
const previewPort = Number(process.env.PLAYWRIGHT_PORT || 4280)

// Puts the first-paint theme script in <head>, before the stylesheet paints, so a reload does not flash the theme the
// operating system prefers. It is the library's own script, with the key the theme store of the site uses.
function themeFirstPaint(): Plugin {
  return {
    name: 'forma-ui-theme-first-paint',
    transformIndexHtml: () => [
      { tag: 'script', children: themeScript({ storageKey: themeStorageKey }), injectTo: 'head-prepend' },
    ],
  }
}

// The site imports @yelison/forma-ui the way a consumer does: through the workspace link and the package's exports
// map, which point at the built dist/. There is deliberately no alias to the library's sources.
export default defineConfig({
  base: siteBasePath,
  plugins: [react(), themeFirstPaint()],
  server: {
    port: devServerPort,
    strictPort: true,
  },
  preview: {
    port: previewPort,
    strictPort: true,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.ts'],
    css: { modules: { classNameStrategy: 'non-scoped' } },
  },
})
