import { defineConfig, devices } from '@playwright/test'

// Another checkout may be serving its own preview build at the same time (see docs/development/herdr.md).
const PORT = Number(process.env.PLAYWRIGHT_PORT || 4173)

// The site is published under /forma-ui/, so the base URL ends with it and specs navigate with relative paths.
const BASE_URL = `http://localhost:${PORT}/forma-ui/`

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // Serves the existing build: run `npm run build` first (the library, then the site), as the CI job does.
    command: `npm run preview -- --port ${PORT} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
