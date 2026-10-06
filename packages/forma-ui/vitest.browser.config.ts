import react from '@vitejs/plugin-react'
import { playwright } from '@vitest/browser-playwright'
import { defineConfig } from 'vitest/config'

// Several checkouts can run side by side (see docs/development/herdr.md): each one takes its own ports from the
// environment. Browser mode starts a Vite server that would otherwise bind Vitest's fixed default port, so it takes
// the checkout's Vite port and fails instead of falling back to a port that belongs to another checkout.
const devServerPort = process.env.DEV_SERVER_PORT

export default defineConfig({
  plugins: [react()],
  test: {
    api: devServerPort ? { port: Number(devServerPort), strictPort: true } : undefined,
    include: ['test/browser/**/*.test.{ts,tsx}'],
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [{ browser: 'chromium' }],
    },
  },
})
