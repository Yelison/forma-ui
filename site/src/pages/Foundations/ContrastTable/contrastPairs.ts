import contract from '../../../../../design/resolve-c3f02f8/contrast-pairs.json'

/** What a pair is held to: text (WCAG 1.4.3) or the parts of a control and graphics (1.4.11). */
export type ContrastKind = 'text' | 'nonText'

export interface ContrastPair {
  /** The color token without its `--color-` prefix, as the contract writes it. */
  foreground: string
  background: string
  kind: ContrastKind
  /** The themes the pair is painted in. */
  themes: readonly string[]
}

function toKind(kind: string): ContrastKind {
  if (kind === 'text' || kind === 'nonText') return kind
  throw new Error(`Unknown contrast kind "${kind}" in contrast-pairs.json`)
}

/**
 * The pairs of colors that are painted together, which is the contract the package's own contrast test checks. The
 * file is the one source of them: there is no second list in the site to fall out of line with it.
 */
export const contrastPairs: readonly ContrastPair[] = contract.pairs.map(
  ({ foreground, background, kind, themes }) => ({ foreground, background, kind: toKind(kind), themes }),
)

/** The minimum ratio of each kind of pair. */
export const contrastThresholds: Readonly<Record<ContrastKind, number>> = contract.thresholds
