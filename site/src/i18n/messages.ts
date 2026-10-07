import type { catalogLoaders } from './catalogLoaders'

type IdsOf<Catalogue> = Catalogue extends unknown ? keyof Catalogue : never

/**
 * The id of every message. It comes from the English catalogues, the source language, so a typo in an id fails the type
 * check. The Spanish ones are held to the same ids by scripts/check-messages.ts, which also checks the ICU syntax and
 * the arguments.
 */
export type MessageId = IdsOf<
  Awaited<ReturnType<(typeof catalogLoaders)[keyof typeof catalogLoaders]['en']>>['default']
>
