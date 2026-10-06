import { afterEach } from 'vitest'
import { reset } from './support'

// Registered in vitest.browser.config.ts. The jsdom tests have their own setup, test/setup.ts.
afterEach(async () => {
  await reset()
})
