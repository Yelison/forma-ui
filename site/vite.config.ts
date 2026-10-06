/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Several checkouts can run side by side (see docs/development/herdr.md): each one takes its own ports from the
// environment. Without those variables the ports are the bases of DEV_SERVER_PORT and PLAYWRIGHT_PORT (slot 0, the
// main checkout), never Vite's own 5173 and 4173. A busy port is an error, not a reason to move to another one,
// which could belong to another checkout.
const devServerPort = Number(process.env.DEV_SERVER_PORT || 5280)
const previewPort = Number(process.env.PLAYWRIGHT_PORT || 4280)

// The site imports @yelison/forma-ui the way a consumer does: through the workspace link and the package's exports
// map, which point at the built dist/. There is deliberately no alias to the library's sources.
export default defineConfig({
  // GitHub Pages serves the site under /forma-ui/.
  base: '/forma-ui/',
  plugins: [react()],
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
    include: ['src/**/*.test.{ts,tsx}'],
    css: { modules: { classNameStrategy: 'non-scoped' } },
  },
})
