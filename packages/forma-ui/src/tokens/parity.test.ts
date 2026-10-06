import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { declarationMap, findRule, parseCss } from '../../scripts/css-blocks.ts'
import { generate, loadSources } from '../../scripts/build-tokens.ts'

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
