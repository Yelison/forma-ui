// WCAG 2.x color contrast: https://www.w3.org/TR/WCAG22/#dfn-contrast-ratio
//
// Pure functions over `#rgb` and `#rrggbb` colors, which is what `dist/tokens.json` holds for every color token.
// Anything else (`rgb()`, alpha, named colors) throws instead of being guessed at.

// Linearizes an sRGB channel in 0..255. The sRGB breakpoint is 0.04045 (IEC 61966-2-1). WCAG 2.x printed 0.03928, taken
// from an older sRGB draft, until it was corrected in May 2021; the guidelines say the change has no practical effect,
// and for hex colors it provably has none: 10/255 = 0.03922 is below both values and 11/255 = 0.04314 is above both, so
// no 8-bit channel falls between them. Resolve's contrast test used 0.03928 and agrees with this one on every pair.
function linearize(channel: number): number {
  const value = channel / 255
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
}

function parseChannels(color: string): [red: number, green: number, blue: number] {
  const digits = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color)?.[1]
  if (digits === undefined) throw new Error(`Not a #rgb or #rrggbb color: "${color}"`)
  // The short form repeats each digit: `#0af` is `#00aaff`.
  const rgb = parseInt(digits.length === 3 ? [...digits].map((digit) => digit + digit).join('') : digits, 16)
  return [(rgb >> 16) & 0xff, (rgb >> 8) & 0xff, rgb & 0xff]
}

/** Relative luminance of a `#rgb` or `#rrggbb` color: 0 for black, 1 for white. */
export function relativeLuminance(color: string): number {
  const [red, green, blue] = parseChannels(color)
  return 0.2126 * linearize(red) + 0.7152 * linearize(green) + 0.0722 * linearize(blue)
}

/** Contrast ratio of two `#rgb` or `#rrggbb` colors, from 1 (identical) to 21 (black on white), in either order. */
export function contrastRatio(first: string, second: string): number {
  const [firstLuminance, secondLuminance] = [relativeLuminance(first), relativeLuminance(second)]
  return (Math.max(firstLuminance, secondLuminance) + 0.05) / (Math.min(firstLuminance, secondLuminance) + 0.05)
}
