import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

// base.css is imported as it is by every consumer, so it must not hold a selector that could match their markup.
// The guard lists whatever is not one of the two allowed classes. It reads the rules through jsdom's CSS parser,
// which silently drops the at-rules and the syntax it does not know (`@starting-style`, `@view-transition`), and
// Chromium applies those. So two textual checks do not depend on the parser: the file needs no at-rule, and every
// `{` must belong to a rule that the parser kept.
const allowedSelectors = ['.forma-scroll-locked', '.forma-visually-hidden']

function selectorsOutsideTheAllowedClasses(css: string): string[] {
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, '')
  const atRules = withoutComments.match(/@[\w-]+/g)
  if (atRules) return atRules

  const style = document.createElement('style')
  // The parser gets the original text: `/*` and `*/` inside strings are not comments, and stripping them as if they
  // were could hide a rule between two strings.
  style.textContent = css
  document.head.append(style)
  try {
    const rules = Array.from(style.sheet!.cssRules)
    const offending = rules.flatMap((rule) => {
      if (rule.type !== CSSRule.STYLE_RULE) return [rule.cssText]
      const { selectorText, cssRules } = rule as CSSStyleRule
      // CSS nesting keeps `& button { … }` inside the outer rule, whose own selector is still allowed.
      if (cssRules.length > 0) return [rule.cssText]
      // Every part of a selector list counts: `.forma-visually-hidden, button` is not allowed.
      return selectorText
        .split(',')
        .map((selector) => selector.trim())
        .filter((selector) => !allowedSelectors.includes(selector))
    })
    if (offending.length > 0) return offending
    const openBraces = withoutComments.match(/\{/g)?.length ?? 0
    return openBraces === rules.length ? [] : ['a rule that the parser dropped']
  } finally {
    style.remove()
  }
}

describe('base.css', () => {
  const css = readFileSync(join(import.meta.dirname, 'base.css'), 'utf8')

  it('holds no selector other than the two utility classes', () => {
    expect(selectorsOutsideTheAllowedClasses(css)).toEqual([])
  })

  it('defines both utility classes', () => {
    const style = document.createElement('style')
    style.textContent = css
    document.head.append(style)
    const defined = Array.from(style.sheet!.cssRules).map((rule) => (rule as CSSStyleRule).selectorText)
    style.remove()

    expect(defined.sort()).toEqual(allowedSelectors)
  })
})

describe('the base.css guard', () => {
  it.each([
    ['an element selector', 'button { margin: 0 }', 'button'],
    ['the universal selector', '* { box-sizing: border-box }', '*'],
    [
      'a pseudo-class on an allowed class',
      '.forma-visually-hidden:focus { clip-path: none }',
      '.forma-visually-hidden:focus',
    ],
    ['a pseudo-class alone', ':focus-visible { outline: none }', ':focus-visible'],
    ['a descendant of an allowed class', '.forma-visually-hidden a { color: red }', '.forma-visually-hidden a'],
    [
      'the allowed class qualified by an element',
      'html.forma-scroll-locked { overflow: hidden }',
      'html.forma-scroll-locked',
    ],
    ['a class of the consumer', '.card { padding: 0 }', '.card'],
    ['an attribute selector', '[hidden] { display: none }', '[hidden]'],
    ['a bad selector in a list with an allowed one', '.forma-scroll-locked, body { overflow: hidden }', 'body'],
    [
      'a rule between strings that look like comment markers',
      '.forma-visually-hidden { content: "/*" } body { margin: 0 } .forma-scroll-locked { content: "*/" }',
      'body',
    ],
  ])('rejects %s', (_, css, selector) => {
    expect(selectorsOutsideTheAllowedClasses(css)).toEqual([selector])
  })

  it.each([
    [
      'an at-rule that wraps an allowed class',
      '@media (prefers-reduced-motion: reduce) { .forma-scroll-locked { overflow: hidden } }',
      '@media',
    ],
    ['an at-rule that jsdom does not know', '@starting-style { body { opacity: 0 } }', '@starting-style'],
    ['an at-rule that holds no selector', '@view-transition { navigation: auto }', '@view-transition'],
    [
      'an at-rule nested in an allowed class',
      '.forma-visually-hidden { @media (min-width: 1px) { border: 0 } }',
      '@media',
    ],
    [
      'an at-rule in a file that also has a comment',
      '/* ok */ .forma-scroll-locked { overflow: hidden } @property --x { syntax: "*"; inherits: false }',
      '@property',
    ],
  ])('rejects %s', (_, css, atRule) => {
    expect(selectorsOutsideTheAllowedClasses(css)).toEqual([atRule])
  })

  it('rejects a nested descendant of an allowed class', () => {
    const offending = selectorsOutsideTheAllowedClasses(
      '.forma-scroll-locked { overflow: hidden; & button { margin: 0 } }',
    )

    expect(offending).toHaveLength(1)
    expect(offending[0]).toMatch(/^\.forma-/)
  })

  it('rejects a rule that the parser drops without an at-rule', () => {
    expect(selectorsOutsideTheAllowedClasses('.forma-scroll-locked { overflow: hidden } [ { margin: 0 }')).toEqual([
      'a rule that the parser dropped',
    ])
  })

  it('does not count an at-sign inside a comment', () => {
    expect(selectorsOutsideTheAllowedClasses('/* @media is not used here */ .forma-scroll-locked { top: 0 }')).toEqual(
      [],
    )
  })

  it('accepts the two allowed classes', () => {
    expect(
      selectorsOutsideTheAllowedClasses('.forma-visually-hidden { border: 0 } .forma-scroll-locked { top: 0 }'),
    ).toEqual([])
  })
})
