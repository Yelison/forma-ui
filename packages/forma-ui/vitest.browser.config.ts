import react from '@vitejs/plugin-react'
import { playwright } from '@vitest/browser-playwright'
import { defineConfig } from 'vitest/config'
import { scopedClassName } from './scripts/scoped-name.ts'

// Several checkouts can run side by side (see docs/development/herdr.md): each one takes its own ports from the
// environment. Browser mode starts a Vite server that would otherwise bind Vitest's fixed default port, so it takes
// the checkout's Vite port and fails instead of falling back to a port that belongs to another checkout.
const devServerPort = process.env.DEV_SERVER_PORT

export default defineConfig({
  plugins: [react()],
  // The runner serves each component's CSS Module under the same `forma-` class names as the built styles.css, so a
  // spec that loads that file with loadStyles() (test/browser/support.tsx) finds the classes it styles.
  css: { modules: { generateScopedName: scopedClassName } },
  test: {
    api: devServerPort ? { port: Number(devServerPort), strictPort: true } : undefined,
    include: ['test/browser/**/*.test.{ts,tsx}'],
    setupFiles: ['./test/browser/setup.ts'],
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [{ browser: 'chromium' }],
    },
  },
})
