import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config.ts'

// The unit tests are configured in vite.config.ts; this file only adds how many workers they use, because Vitest
// reads vitest.config.ts first and then no longer reads the test block of vite.config.ts on its own. The machine
// is shared by several checkouts, so a local run takes two workers and CI, which has the machine to itself, three.
export default mergeConfig(viteConfig, defineConfig({ test: { maxWorkers: process.env.CI ? 3 : 2 } }))
