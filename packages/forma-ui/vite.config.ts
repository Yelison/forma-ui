/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Unit tests (jsdom) are configured here; browser-mode tests have their own config, vitest.browser.config.ts.
export default defineConfig({
  plugins: [react()],
  build: {
    // The token generator writes dist/tokens.css and dist/tokens.json before Vite runs; `npm run build` cleans dist first.
    emptyOutDir: false,
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
      fileName: 'index',
    },
    rolldownOptions: {
      // The package declares react and react-dom as peer dependencies: it never bundles a second copy of them,
      // nor of the JSX runtime. The pattern covers subpaths such as react/jsx-runtime and react-dom/client.
      external: [/^react(-dom)?($|\/)/],
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: { modules: { classNameStrategy: 'non-scoped' } },
  },
})
