import type { MessageId } from '../../i18n'

/** What a change did to the design: it adds something, adjusts what was there, or corrects a defect. */
export type ChangeType = 'added' | 'updated' | 'fixed'

export interface Change {
  type: ChangeType
  /** What changed, as one sentence. */
  summary: MessageId
  /** Where the change can be checked: an issue of Resolve, which is the source of the shared design. */
  source?: { label: string; href: string }
}

/** What a stage of the design is about, which the gray label of its version says. */
export type Stage = 'tokens' | 'library' | 'reference' | 'documentation'

export interface Release {
  /**
   * The number of the stage in the design history, as «0.4». It is not a version of the package, which has its own
   * numbers in its own `CHANGELOG.md`: the page calls it «Design 0.4».
   */
  version: string
  stage: Stage
  /** The day of the last change of the stage, in UTC, as `YYYY-MM-DD`. */
  date: string
  title: MessageId
  changes: readonly Change[]
}

const resolveIssue = (number: number) => ({
  label: `Resolve #${number}`,
  href: `https://github.com/Yelison/resolve/issues/${number}`,
})

/**
 * The design history of Forma UI, newest first: only what can be checked. Every day is a day in UTC, the one the page
 * prints it in, and says where it comes from:
 *
 * - 0.1: the day the last of the Resolve issues #14, #65 and #75 was closed (#75, 2026-10-06 07:54 UTC).
 * - 0.2: the day of the last commit of the extraction, `f1c98e9` (Dialog, 2026-10-07 01:01 UTC), after Button, Badge,
 *   Input and Tooltip (`a2a715b`, `fdd4f73`, `25d87fb`...); the 26 color tokens are the snapshot of Resolve at
 *   `c3f02f8` that the repository keeps in `design/resolve-c3f02f8`.
 * - 0.3: the day of `d7e7510` (2026-10-07 09:11 UTC), the commit that put the proposed sizes in the reference of
 *   Button; decision D15 of the plan, from the day before, is what made them proposals.
 * - 0.4: the day of the commits of the guides and of this changelog (2026-10-07 14:39 to 15:04 UTC).
 *
 * A change that cannot be traced to one of these does not belong here.
 */
export const releases = [
  {
    version: '0.4',
    stage: 'documentation',
    date: '2026-10-07',
    title: 'changelog.v04.title',
    changes: [
      { type: 'added', summary: 'changelog.v04.gettingStarted' },
      { type: 'added', summary: 'changelog.v04.guides' },
    ],
  },
  {
    version: '0.3',
    stage: 'reference',
    date: '2026-10-07',
    title: 'changelog.v03.title',
    changes: [{ type: 'added', summary: 'changelog.v03.sizes' }],
  },
  {
    version: '0.2',
    stage: 'library',
    date: '2026-10-07',
    title: 'changelog.v02.title',
    changes: [
      { type: 'added', summary: 'changelog.v02.tokens' },
      { type: 'added', summary: 'changelog.v02.components' },
    ],
  },
  {
    version: '0.1',
    stage: 'tokens',
    date: '2026-10-06',
    title: 'changelog.v01.title',
    changes: [
      { type: 'fixed', summary: 'changelog.v01.muted', source: resolveIssue(14) },
      { type: 'fixed', summary: 'changelog.v01.brand', source: resolveIssue(65) },
      { type: 'fixed', summary: 'changelog.v01.progress', source: resolveIssue(75) },
    ],
  },
] as const satisfies readonly Release[]
