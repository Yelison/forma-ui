import type { ContrastKind } from './contrastPairs'

/** WCAG 1.4.6, Contrast (Enhanced): the AAA ratio for text. Non-text contrast has no enhanced level. */
export const textAaaRatio = 7

export type ContrastLevel = 'aaa' | 'aa' | 'passes' | 'fails'

/**
 * How a measured ratio stands against the threshold of its kind: `aaa` and `aa` for text, `passes` for non-text,
 * which has a single bar, and `fails` below it.
 */
export function contrastLevel(
  ratio: number,
  kind: ContrastKind,
  thresholds: Readonly<Record<ContrastKind, number>>,
): ContrastLevel {
  if (ratio < thresholds[kind]) return 'fails'
  if (kind === 'nonText') return 'passes'
  return ratio >= textAaaRatio ? 'aaa' : 'aa'
}
