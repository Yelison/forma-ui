import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { type ContrastPair, contrastContract, generate, loadSources } from '../../scripts/build-tokens.ts'
import { contrastRatio, relativeLuminance } from './contrast.ts'

describe('relativeLuminance', () => {
  it('is 0 for black and 1 for white', () => {
    expect(relativeLuminance('#000000')).toBe(0)
    expect(relativeLuminance('#ffffff')).toBe(1)
  })

  it('weighs the red, green and blue primaries with the WCAG coefficients', () => {
    expect(relativeLuminance('#ff0000')).toBeCloseTo(0.2126, 10)
    expect(relativeLuminance('#00ff00')).toBeCloseTo(0.7152, 10)
    expect(relativeLuminance('#0000ff')).toBeCloseTo(0.0722, 10)
  })

  it('reads the short form, in either case', () => {
    expect(relativeLuminance('#0af')).toBe(relativeLuminance('#00aaff'))
    expect(relativeLuminance('#00AAFF')).toBe(relativeLuminance('#00aaff'))
  })

  it.each(['rgb(0, 0, 0)', 'red', '#12345', '#1234567', '#ggg', '000000', '#00000080', ''])(
    'rejects %j instead of guessing',
    (color) => {
      expect(() => relativeLuminance(color)).toThrow(`Not a #rgb or #rrggbb color: "${color}"`)
    },
  )

  // WCAG 2.0 printed 0.03928 as the sRGB breakpoint; the standard says 0.04045. They only differ for a channel in
  // between, and an 8-bit channel is k/255, so none can land there: the choice never changes a ratio (Resolve used
  // 0.03928 and these tokens agree with it).
  it('has no 8-bit channel between the two sRGB breakpoints', () => {
    const between = Array.from({ length: 256 }, (_, channel) => channel).filter(
      (channel) => channel / 255 > 0.03928 && channel / 255 <= 0.04045,
    )
    expect(between).toEqual([])
  })

  // The channels on each side of the breakpoint, with the values the standard's formula gives for them.
  it('uses the linear segment up to channel 10 and the power curve from 11', () => {
    expect(relativeLuminance('#0a0a0a')).toBeCloseTo(0.003035269835488375, 12)
    expect(relativeLuminance('#0b0b0b')).toBeCloseTo(0.003346535763899161, 12)
  })
})

describe('contrastRatio', () => {
  it('is 21 for black on white', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 10)
  })

  it('is 1 for a color on itself', () => {
    expect(contrastRatio('#3569f6', '#3569f6')).toBe(1)
  })

  it('does not depend on which color is the foreground', () => {
    expect(contrastRatio('#ffffff', '#000000')).toBe(contrastRatio('#000000', '#ffffff'))
    expect(contrastRatio('#616d81', '#f5f7fb')).toBe(contrastRatio('#f5f7fb', '#616d81'))
  })

  // The grey that crosses 4.5:1 on white: #767676 is the lightest that passes AA text, #777777 is the next one up.
  it('puts AA text on either side of #767676 on white', () => {
    expect(contrastRatio('#767676', '#ffffff')).toBeCloseTo(4.542224959605253, 10)
    expect(contrastRatio('#777777', '#ffffff')).toBeCloseTo(4.478089453577214, 10)
  })
})

// The contract: the pairs of tokens/contrast-pairs.json, as dist/contrast-pairs.json ships them, run against the
// colors the token source resolves to, so a token edit that breaks a pair fails here before it ships. The test only
// reads: a failing pair is reported, never fixed, and the tokens are not touched. That the pairs are Resolve's is
// checked in parity.test.ts.
type Theme = ContrastPair['themes'][number]

const tokensDirectory = resolve(import.meta.dirname, '../../tokens')
const contract = contrastContract(tokensDirectory)
const resolved = JSON.parse(generate(loadSources(tokensDirectory)).json) as Record<Theme, Record<string, string>>

// The pairs name tokens without their `--color-` prefix.
function colorOf(theme: Theme, name: string): string {
  const color = resolved[theme][`--color-${name}`]
  if (color === undefined) throw new Error(`The token source has no --color-${name} in the ${theme} theme`)
  return color
}

const checks = contract.pairs.flatMap((pair) => pair.themes.map((theme) => ({ ...pair, theme })))

describe('contrast contract on the token source', () => {
  it('keeps the WCAG thresholds: 4.5:1 for text (1.4.3) and 3:1 for non-text (1.4.11)', () => {
    expect(contract.thresholds).toEqual({ text: 4.5, nonText: 3 })
  })

  it('has pairs to check, each in at least one theme', () => {
    expect(contract.pairs.length).toBeGreaterThan(0)
    expect(checks.length).toBeGreaterThanOrEqual(contract.pairs.length)
  })

  it.each(checks)('$theme: $foreground on $background ($kind)', ({ foreground, background, kind, theme }) => {
    const ratio = contrastRatio(colorOf(theme, foreground), colorOf(theme, background))
    const needed = contract.thresholds[kind]
    // Three decimals: with two, 4.497 would read as "4.50 < 4.5".
    expect(
      ratio,
      `${foreground} on ${background} (${theme}): ${ratio.toFixed(3)}:1, needs ${needed}:1 (${kind})`,
    ).toBeGreaterThanOrEqual(needed)
  })
})
