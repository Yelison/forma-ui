import type { IntlShape } from 'react-intl'

/**
 * A contrast ratio with two decimals, cut and not rounded: a failing 4.497 must not be printed as the 4.50 that would
 * pass. The separator is the language's own.
 */
export function formatRatio(intl: IntlShape, ratio: number): string {
  return intl.formatNumber(ratio, { minimumFractionDigits: 2, maximumFractionDigits: 2, roundingMode: 'trunc' })
}
