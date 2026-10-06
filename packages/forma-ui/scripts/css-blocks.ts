// A minimal CSS reader for the token tests: comments are dropped, whitespace is collapsed, and a stylesheet becomes a
// tree of rules. It understands only what Resolve's token files and the generated tokens.css use: top-level rules,
// at-rules with nested rules, block-less at-rules and `name: value;` declarations. It is not a general CSS parser.

export interface CssRule {
  prelude: string
  declarations: [name: string, value: string][]
  rules: CssRule[]
  // At-rules without a block, such as `@import '...'`.
  statements: string[]
}

const collapse = (text: string) => text.replace(/\s+/g, ' ').trim()

function parseBody(text: string, start: number, closing: boolean): [CssRule, number] {
  const rule: CssRule = { prelude: '', declarations: [], rules: [], statements: [] }
  let buffer = ''
  let i = start
  while (i < text.length) {
    const char = text[i] as string
    if (char === '}') {
      if (!closing) throw new Error(`Unexpected "}" at offset ${i}`)
      return [rule, i + 1]
    }
    if (char === ';') {
      if (collapse(buffer).startsWith('@')) {
        rule.statements.push(collapse(buffer))
        buffer = ''
        i++
        continue
      }
      const separator = buffer.indexOf(':')
      if (separator < 0) throw new Error(`Declaration without a colon: "${collapse(buffer)}"`)
      rule.declarations.push([collapse(buffer.slice(0, separator)), collapse(buffer.slice(separator + 1))])
      buffer = ''
      i++
    } else if (char === '{') {
      const [child, next] = parseBody(text, i + 1, true)
      child.prelude = collapse(buffer)
      rule.rules.push(child)
      buffer = ''
      i = next
    } else {
      buffer += char
      i++
    }
  }
  if (closing) throw new Error('Unclosed block')
  if (collapse(buffer) !== '') throw new Error(`Trailing text: "${collapse(buffer)}"`)
  return [rule, i]
}

export function parseCss(text: string): CssRule {
  return parseBody(text.replace(/\/\*[\s\S]*?\*\//g, ''), 0, false)[0]
}

// The declarations of a rule as a map; a name declared twice in one block is an error, not a silent override.
export function declarationMap(rule: CssRule): Map<string, string> {
  const map = new Map<string, string>()
  for (const [name, value] of rule.declarations) {
    if (map.has(name)) throw new Error(`"${name}" is declared twice in "${rule.prelude}"`)
    map.set(name, value)
  }
  return map
}

export function findRule(parent: CssRule, prelude: string): CssRule {
  const matches = parent.rules.filter((rule) => rule.prelude === prelude)
  if (matches.length !== 1) throw new Error(`Expected exactly one "${prelude}" rule, found ${matches.length}`)
  return matches[0] as CssRule
}
