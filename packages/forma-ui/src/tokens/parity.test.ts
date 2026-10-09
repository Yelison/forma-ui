import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { declarationMap, findRule, parseCss } from '../../scripts/css-blocks.ts'
import {
  type ContrastContract,
  type ContrastPair,
  contrastContract,
  generate,
  loadSources,
} from '../../scripts/build-tokens.ts'

// Semantic parity with Resolve at c3f02f8 (design/resolve-c3f02f8): the same names, values or aliases, and blocks.
const snapshot = (name: string) =>
  readFileSync(resolve(import.meta.dirname, '../../../../design/resolve-c3f02f8', name), 'utf8')
const resolveTokens = parseCss(snapshot('tokens.css'))
const resolveGlobal = parseCss(snapshot('global.css'))
const generated = parseCss(generate(loadSources(resolve(import.meta.dirname, '../../tokens'))).css)

const DARK_MEDIA = '@media (prefers-color-scheme: dark)'
const DARK_SELECTOR = ":root:not([data-theme='light'])"
const DARK_ATTRIBUTE = ":root[data-theme='dark']"
const MOBILE = '@media (max-width: 767.98px)'

// Resolve's app layout stays in Resolve (global.css): none of it belongs to the library.
const APP_LAYOUT = [
  '--header-height',
  '--page-gutter',
  '--sidebar-expanded',
  '--sidebar-collapsed',
  '--drawer-width',
  '--reading-width',
]

// The only allowed differences from Resolve's files, with their expected values.
const D12_FONT_FAMILY = "'Inter Variable', Inter, system-ui, -apple-system, 'Segoe UI', sans-serif"
const D10_NEW_TOKENS: Record<string, string> = {
  '--badge-min-height': '28px',
  '--spinner-size': '16px',
  '--tooltip-max-width': '240px',
  '--dialog-width': '440px',
  '--dialog-width-wide': '640px',
  '--z-sticky': '20',
  '--z-dropdown': '30',
  '--z-menu': '80',
  '--z-tooltip': '90',
  '--z-toast': '100',
  '--z-overlay': '200',
}

const rootOf = (stylesheet: typeof generated) => declarationMap(findRule(stylesheet, ':root'))
const libraryOnly = (map: Map<string, string>) => new Map([...map].filter(([name]) => !APP_LAYOUT.includes(name)))

describe('parity with Resolve c3f02f8', () => {
  it('declares in :root every token of tokens.css and the library part of global.css, plus the allowed differences', () => {
    const expected = new Map([
      ...rootOf(resolveTokens),
      ...libraryOnly(rootOf(resolveGlobal)),
      ...Object.entries(D10_NEW_TOKENS),
    ])
    expect(Object.fromEntries(rootOf(generated))).toEqual(Object.fromEntries(expected))
  })

  it('differs from tokens.css and global.css only in --font-family (D12) and the D10 tokens', () => {
    const resolveRoot = new Map([...rootOf(resolveTokens), ...rootOf(resolveGlobal)])
    const different = [...rootOf(generated)].filter(([name, value]) => resolveRoot.get(name) !== value)
    const allowed = Object.entries(D10_NEW_TOKENS)
    // Resolve's tokens.css has `Inter` alone; global.css already overrides it with the D12 stack.
    expect(rootOf(resolveTokens).get('--font-family')).toBe("Inter, system-ui, -apple-system, 'Segoe UI', sans-serif")
    expect(rootOf(resolveGlobal).get('--font-family')).toBe(D12_FONT_FAMILY)
    expect(rootOf(generated).get('--font-family')).toBe(D12_FONT_FAMILY)
    expect(different).toEqual(allowed)
    for (const [name] of allowed) expect(resolveRoot.has(name)).toBe(false)
  })

  it('declares both dark blocks exactly as tokens.css does', () => {
    const darkMedia = findRule(findRule(generated, DARK_MEDIA), DARK_SELECTOR)
    const expectedMedia = findRule(findRule(resolveTokens, DARK_MEDIA), DARK_SELECTOR)
    expect(Object.fromEntries(declarationMap(darkMedia))).toEqual(Object.fromEntries(declarationMap(expectedMedia)))
    expect(Object.fromEntries(declarationMap(findRule(generated, DARK_ATTRIBUTE)))).toEqual(
      Object.fromEntries(declarationMap(findRule(resolveTokens, DARK_ATTRIBUTE))),
    )
  })

  it('keeps the light and dark color-scheme declarations', () => {
    expect(rootOf(generated).get('color-scheme')).toBe('light')
    expect(declarationMap(findRule(generated, DARK_ATTRIBUTE)).get('color-scheme')).toBe('dark')
  })

  it('overrides the control and button heights below 768px as global.css does', () => {
    const expected = declarationMap(findRule(findRule(resolveGlobal, MOBILE), ':root'))
    expect(expected.size).toBe(2)
    expect(Object.fromEntries(declarationMap(findRule(findRule(generated, MOBILE), ':root')))).toEqual(
      Object.fromEntries(expected),
    )
  })

  it('emits the viewport override after :root and the dark blocks after both, in Resolve order', () => {
    expect(generated.rules.map((rule) => rule.prelude)).toEqual([':root', MOBILE, DARK_MEDIA, DARK_ATTRIBUTE])
  })

  it('leaves the app layout tokens and their media queries in Resolve', () => {
    const css = JSON.stringify(generated)
    for (const name of APP_LAYOUT) expect(css).not.toContain(name)
    expect(generated.rules.map((rule) => rule.prelude).filter((prelude) => prelude.includes('min-width'))).toEqual([])
  })
})

// The contrast pairs are Resolve's (contrast-pairs.json in the snapshot, extracted from tokens.contrast.test.ts): the
// package keeps its own copy in tokens/contrast-pairs.json, and the snapshot stays as the evidence. The equality is
// strict except for the pairs in DIFFERENCES: a pair that differs from Resolve on purpose is listed there with its
// reason, and the comparison leaves it out on both sides. Today the list is empty.
interface Difference {
  /** The pair, written as the generator names it in its errors: `foreground on background`. */
  pair: string
  reason: string
}

const DIFFERENCES: Difference[] = []

const pairName = ({ foreground, background }: ContrastPair) => `${foreground} on ${background}`
const withoutDeclared = (pairs: ContrastPair[], differences: Difference[]) =>
  pairs.filter((pair) => !differences.some(({ pair: declared }) => declared === pairName(pair)))

describe('contrast pairs and Resolve', () => {
  // The snapshot's pairs carry a note of where each is painted, which the package leaves out; its exclusions are the
  // tokens Resolve's test checks on no pair.
  const resolveContract = JSON.parse(snapshot('contrast-pairs.json')) as ContrastContract & {
    excluded: { subject: string }[]
  }
  const resolvePairs = resolveContract.pairs.map(({ foreground, background, kind, themes }) => ({
    foreground,
    background,
    kind,
    themes,
  }))
  const shipped = contrastContract(resolve(import.meta.dirname, '../../tokens'))

  it('holds the same pairs as Resolve, in its order, with the same kind and themes', () => {
    expect(resolvePairs).toHaveLength(40)
    expect(withoutDeclared(shipped.pairs, DIFFERENCES)).toEqual(withoutDeclared(resolvePairs, DIFFERENCES))
  })

  it('holds the same thresholds as Resolve', () => {
    expect(shipped.thresholds).toEqual(resolveContract.thresholds)
  })

  it('gives each difference it declares a reason, and declares no pair that Resolve and the package both lack', () => {
    const known = new Set([...resolvePairs, ...shipped.pairs].map(pairName))
    for (const { pair, reason } of DIFFERENCES) {
      expect(reason.trim(), pair).not.toBe('')
      expect(known.has(pair), pair).toBe(true)
    }
  })

  describe('a declared difference', () => {
    const declared: Difference[] = [{ pair: 'brand on bg', reason: 'a test double' }]
    const edited = (name: string, change: Partial<ContrastPair> | undefined) =>
      resolvePairs.flatMap((pair) => (pairName(pair) !== name ? [pair] : change ? [{ ...pair, ...change }] : []))

    it('lets the package differ on that pair: another kind, other themes, or none at all', () => {
      for (const change of [{ kind: 'text' as const }, { themes: ['light' as const] }, undefined]) {
        expect(withoutDeclared(edited('brand on bg', change), declared)).toEqual(
          withoutDeclared(resolvePairs, declared),
        )
      }
    })

    it('does not let it differ on any other pair', () => {
      expect(withoutDeclared(edited('ink on bg', { kind: 'nonText' }), declared)).not.toEqual(
        withoutDeclared(resolvePairs, declared),
      )
      expect(withoutDeclared(edited('ink on bg', undefined), declared)).not.toEqual(
        withoutDeclared(resolvePairs, declared),
      )
      // Nor on a pair that shares its foreground or its background with the declared one.
      expect(withoutDeclared(edited('brand on surface', { kind: 'text' }), declared)).not.toEqual(
        withoutDeclared(resolvePairs, declared),
      )
      expect(withoutDeclared(edited('ink on bg', { themes: ['dark'] }), declared)).not.toEqual(
        withoutDeclared(resolvePairs, declared),
      )
    })
  })

  // What Resolve leaves out of its contrast test on purpose stays out of the pairs.
  it('checks none of the tokens Resolve leaves out, and brand only as a non-text color', () => {
    const excludedTokens = resolveContract.excluded.flatMap(({ subject }) =>
      [...subject.matchAll(/--color-([a-z-]+)/g)].map((match) => match[1]),
    )
    expect(excludedTokens.toSorted()).toEqual(['disabled', 'focus', 'line', 'overlay'])
    const colorsInPairs = shipped.pairs.flatMap((pair) => [pair.foreground, pair.background])
    expect(colorsInPairs.filter((name) => excludedTokens.includes(name))).toEqual([])
    const brandPairs = shipped.pairs.filter((pair) => pair.foreground === 'brand')
    expect(brandPairs.length).toBeGreaterThan(0)
    expect(brandPairs.every((pair) => pair.kind === 'nonText')).toBe(true)
  })
})
