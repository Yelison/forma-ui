import type { AlertTone } from '@yelison/forma-ui'

/** The tones of Alert in the order the page shows them: one list for the page and the catalog. */
export const alertTones = ['blue', 'green', 'amber', 'red'] as const satisfies readonly AlertTone[]
