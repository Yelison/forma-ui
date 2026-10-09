/// <reference types="vitest/config" />
import { readFileSync } from 'node:fs'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { cssModulesManifest, scopedClassName } from './scripts/scoped-name.ts'

// Unit tests (jsdom) are configured here; browser-mode tests have their own config, vitest.browser.config.ts.
export default defineConfig({
  plugins: [react()],
  css: {
    // The class names are part of the package: see scripts/scoped-name.ts.
    modules: { generateScopedName: scopedClassName },
  },
  build: {
    // The token generator writes dist/tokens.css and dist/tokens.json before Vite runs; `npm run build` cleans dist first.
    emptyOutDir: false,
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
      // The name of each entry chunk: with `preserveModules` below, every module is one, named after its source file.
      fileName: (_format, name) => `${name}.js`,
      // One stylesheet for every component, exported as ./styles.css. Vite extracts it instead of importing it from
      // a module, so importing the package stays free of side effects and the consumer decides where the CSS goes.
      cssFileName: 'styles',
    },
    // Stated although lib mode defaults to it: a stylesheet per module would put `import './x.css'` in the modules.
    cssCodeSplit: false,
    rolldownOptions: {
      // The package declares react and react-dom as peer dependencies: it never bundles a second copy of them,
      // nor of the JSX runtime. The pattern covers subpaths such as react/jsx-runtime and react-dom/client.
      external: [/^react(-dom)?($|\/)/],
      // One file per source module, in the folders of src/ (`dist/components/Badge/Badge.js`), and `index.js` as a
      // barrel that re-exports them. A single bundled file is one module for the consumer's bundler, so a chunk that
      // loads on demand and uses Dialog dragged everything the page used (Dialog, Tooltip, Field…) into the entry
      // chunk. As separate modules, with `sideEffects` in package.json, only the modules in use travel. The layout of
      // dist/ is not API: package.json `exports` is the only way in, and scripts/pack-check/ guards the result.
      output: { preserveModules: true, preserveModulesRoot: 'src' },
      plugins: [
        {
          // The classes each CSS module generated, for scripts/check-consumer.ts. It is a build product, not a part
          // of the package: package.json leaves it out of `files`.
          name: 'emit-css-modules-manifest',
          generateBundle() {
            this.emitFile({
              type: 'asset',
              fileName: 'css-modules.json',
              source: `${JSON.stringify(cssModulesManifest(), null, 2)}\n`,
            })
          },
        },
        {
          // base.css is exported on its own (./base.css) and no module imports it, so Vite would never see it.
          // Importing it from index.ts would instead put its rules in a bundled stylesheet and make the entry
          // point a side effect.
          name: 'emit-base-css',
          generateBundle() {
            this.emitFile({
              type: 'asset',
              fileName: 'base.css',
              source: readFileSync(new URL('./src/styles/base.css', import.meta.url), 'utf8'),
            })
          },
        },
      ],
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: { modules: { classNameStrategy: 'non-scoped' } },
    coverage: {
      provider: 'v8',
      // Name the sources instead of relying on what the tests import: a module no test loads still counts as 0%.
      include: ['src/**/*.{ts,tsx}'],
      // tokens.ts is written by scripts/build-tokens.ts, and its tests cover the generator.
      exclude: ['src/**/*.test.{ts,tsx}', 'src/tokens/tokens.ts'],
      thresholds: { statements: 80, branches: 75, functions: 75, lines: 80 },
    },
  },
})
