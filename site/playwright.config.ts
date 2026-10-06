import { defineConfig, devices } from '@playwright/test'

// Another checkout may be serving its own preview build at the same time (see docs/development/herdr.md): each one
// takes its own port from the environment. Without it the port is the base of PLAYWRIGHT_PORT (slot 0, the main
// checkout), never Vite's own 4173, which Resolve's checkouts use.
const PORT = Number(process.env.PLAYWRIGHT_PORT || 4280)

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
    // Builds the library and then the site before serving them, so a spec never runs against a stale build.
    command: `npm --prefix .. run build && npm run preview -- --port ${PORT} --strictPort`,
    url: BASE_URL,
    // The build runs here, and tsc reports its errors on stdout: pipe it so a failed build shows why.
    stdout: 'pipe',
    // Never test a server this run did not start: if something already listens on the port, the run fails.
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
