/** The parts of a `font` shorthand token that the page lays out: `600 17px/24px 'Inter Variable', …`. */
export interface FontSpecification {
  weight: string
  size: string
  lineHeight: string
}

/** Reads the weight, size and line height of a `font` shorthand, or `null` when the value is not in that shape. */
export function parseFontShorthand(value: string): FontSpecification | null {
  const match = /^(\d{3}) (\S+)\/(\S+) /.exec(value)
  return match?.[1] && match[2] && match[3] ? { weight: match[1], size: match[2], lineHeight: match[3] } : null
}
