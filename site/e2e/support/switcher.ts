import type { Locator } from '@playwright/test'

/**
 * The live region of a switcher, found from its button: each switcher carries its own, so that the drawer, a modal
 * dialog that leaves the rest of the page inert, still has one that is heard.
 */
export const liveRegionOf = (trigger: Locator) => trigger.locator('xpath=..').getByRole('status')
