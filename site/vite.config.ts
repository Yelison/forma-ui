/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Several checkouts can run side by side (see docs/development/herdr.md): each one takes its own ports from the
// environment, and without those variables the defaults are the usual single-checkout ones.
const devServerPort = process.env.DEV_SERVER_PORT

// The site imports @yelison/forma-ui the way a consumer does: through the workspace link and the package's exports
// map, which point at the built dist/. There is deliberately no alias to the library's sources.
export default defineConfig({
  // GitHub Pages serves the site under /forma-ui/.
  base: '/forma-ui/',
  plugins: [react()],
  server: {
    port: devServerPort ? Number(devServerPort) : undefined,
    strictPort: Boolean(devServerPort),
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: { modules: { classNameStrategy: 'non-scoped' } },
  },
})
