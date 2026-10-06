import { cpSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { declarationMap, findRule, parseCss } from '../../scripts/css-blocks.ts'
import { type SourceFile, generate, loadSources, main } from '../../scripts/build-tokens.ts'
import { type TokenName, tokenNames } from './tokens.ts'

const packageRoot = resolve(import.meta.dirname, '../..')
const sources = () => loadSources(join(packageRoot, 'tokens'))

// A copy of the real sources, edited through `tree`: the groups of every file side by side (`tree.color.link`).
function edited(edit: (tree: Record<string, any>) => void): SourceFile[] {
  const files = structuredClone(sources())
  edit(Object.assign({}, ...files.map((file) => file.data)))
  return files
}

describe('dark blocks', () => {
  const css = parseCss(generate(sources()).css)
  const media = findRule(findRule(css, '@media (prefers-color-scheme: dark)'), ":root:not([data-theme='light'])")
  const attribute = findRule(css, ":root[data-theme='dark']")

  it('are identical', () => {
    expect(media.declarations).toEqual(attribute.declarations)
    expect(media.declarations.length).toBeGreaterThan(20)
  })

  it('hold every token with modes, including the ones equal in both themes, and nothing else', () => {
    const dark = declarationMap(attribute)
    const light = declarationMap(findRule(css, ':root'))
    expect(dark.get('--color-on-brand')).toBe('#ffffff')
    expect(dark.get('--color-link')).toBe('var(--color-blue-ink)')
    expect([...dark.keys()].filter((name) => !name.startsWith('--color-') && name !== 'color-scheme')).toEqual([])
    expect([...light.keys()].filter((name) => name.startsWith('--color-'))).toEqual(
      [...dark.keys()].filter((name) => name.startsWith('--color-')),
    )
  })
})

describe('determinism', () => {
  it('gives the same bytes on two runs', () => {
    expect(generate(sources())).toEqual(generate(sources()))
  })

  it('writes the same bytes when the command runs twice, and records no date', () => {
    const workspace = mkdtempSync(join(tmpdir(), 'forma-tokens-'))
    try {
      const root = join(workspace, 'package')
      const figma = join(workspace, 'figma', 'variables.json')
      cpSync(join(packageRoot, 'tokens'), join(root, 'tokens'), { recursive: true })
      const written = () =>
        ['dist/tokens.css', 'dist/tokens.json', 'src/tokens/tokens.ts']
          .map((file) => readFileSync(join(root, file), 'utf8'))
          .concat(readFileSync(figma, 'utf8'))
      main(['--figma', figma], root)
      const first = written()
      main(['--figma', figma], root)
      expect(written()).toEqual(first)
      expect(first.join('\n')).not.toMatch(/\d{4}-\d{2}-\d{2}/)
    } finally {
      rmSync(workspace, { recursive: true, force: true })
    }
  })

  it('keeps the committed src/tokens/tokens.ts equal to a fresh generation', () => {
    expect(readFileSync(join(packageRoot, 'src/tokens/tokens.ts'), 'utf8')).toBe(generate(sources()).ts)
  })
})

describe('errors', () => {
  it('fails on an alias to a missing token and names the token path', () => {
    const files = edited(({ color }) => {
      color.link.$value = '{color.does-not-exist}'
      color.link.$extensions.forma.modes.light = '{color.does-not-exist}'
    })
    expect(() => generate(files)).toThrow(/Token "color\.link".*\{color\.does-not-exist\}.*does not exist/)
  })

  it('names the mode when only the dark value has the broken alias', () => {
    const files = edited(({ color }) => {
      color.link.$extensions.forma.modes.dark = '{color.nope}'
    })
    expect(() => generate(files)).toThrow(/Token "color\.link" \(\$extensions\.forma\.modes\.dark\)/)
  })

  it('names the field when a composite value holds the broken alias', () => {
    const files = edited(({ font }) => {
      font.body.$value.fontFamily = '{font.missing}'
    })
    expect(() => generate(files)).toThrow(/Token "font\.body" \(\$value\.fontFamily\)/)
  })

  it('fails on an alias cycle', () => {
    const files = edited(({ color }) => {
      color['progress-track'].$value = '{color.link}'
      color['progress-track'].$extensions.forma.modes = { light: '{color.link}', dark: '{color.link}' }
      color.link.$value = '{color.progress-track}'
      color.link.$extensions.forma.modes = { light: '{color.progress-track}', dark: '{color.progress-track}' }
    })
    expect(() => generate(files)).toThrow(/Alias cycle: color\.link -> color\.progress-track -> color\.link/)
  })

  it('fails when $value and the light mode disagree', () => {
    const files = edited(({ color }) => {
      color.muted.$value = '#000000'
    })
    expect(() => generate(files)).toThrow(/"color\.muted" has a \$value that differs from its light mode/)
  })

  it('fails on an alias embedded in a longer string', () => {
    const files = edited(({ shadow }) => {
      shadow.popover.$value = '0 8px 24px {color.overlay}'
    })
    expect(() => generate(files)).toThrow(/Token "shadow\.popover".*an alias must fill the whole value/)
  })

  it('fails on a token without a type', () => {
    const files = edited(({ z }) => {
      delete z.menu.$type
    })
    expect(() => generate(files)).toThrow(/token "z\.menu" has no \$type/)
  })
})

describe('dist/tokens.json', () => {
  const json = JSON.parse(generate(sources()).json) as {
    light: Record<TokenName, string>
    dark: Record<TokenName, string>
  }

  it('has the same keys in both themes, in the order of tokenNames', () => {
    expect(Object.keys(json.light)).toEqual([...tokenNames])
    expect(Object.keys(json.dark)).toEqual([...tokenNames])
  })

  it('holds resolved values, never var()', () => {
    for (const theme of [json.light, json.dark]) {
      for (const [name, value] of Object.entries(theme)) expect(value, name).not.toMatch(/var\(|[{}]/)
    }
    expect(json.light['--color-link']).toBe('#2455cd')
    expect(json.dark['--color-link']).toBe('#9bbcff')
    expect(json.light['--color-progress-track']).toBe('#e4e9f1')
    expect(json.dark['--color-progress-track']).toBe('#202b3d')
    expect(json.light['--font-body']).toBe(
      "400 14px/20px 'Inter Variable', Inter, system-ui, -apple-system, 'Segoe UI', sans-serif",
    )
  })

  it('resolves a mode-less token through the mode of the token it points to', () => {
    expect(json.light['--focus-ring']).toBe('2px solid #3569f6')
    expect(json.dark['--focus-ring']).toBe('2px solid #9bbcff')
  })

  it('reports the desktop value of a token with a viewport override', () => {
    expect(json.light['--button-height']).toBe('42px')
    expect(json.dark['--control-height']).toBe('40px')
  })
})

describe('--figma output', () => {
  const figma = JSON.parse(generate(sources()).figma) as {
    source: string
    variables: {
      name: string
      type: string
      codeSyntax: { WEB: string }
      values: Record<string, { value: unknown; alias?: string }>
    }[]
    textStyles: { name: string; fontSize: number }[]
    skipped: { name: string }[]
  }
  const variable = (name: string) => figma.variables.find((entry) => entry.name === name)

  it('maps names to Figma paths and CSS code syntax, with aliases kept', () => {
    expect(variable('color/link')).toMatchObject({
      type: 'COLOR',
      codeSyntax: { WEB: 'var(--color-link)' },
      values: {
        light: { value: '#2455cd', alias: 'color/blue-ink' },
        dark: { value: '#9bbcff', alias: 'color/blue-ink' },
      },
    })
    expect(variable('space/12')).toMatchObject({ type: 'FLOAT', values: { light: { value: 12 } } })
    expect(variable('duration/fast')?.values.light?.value).toBe(120)
  })

  it('names its source', () => {
    expect(figma.source).toBe('tokens/*.tokens.json, generated by scripts/build-tokens.ts')
  })

  it('exports typography as text styles and lists what has no variable type', () => {
    expect(figma.textStyles.find((style) => style.name === 'font/body')?.fontSize).toBe(14)
    expect(figma.skipped.map((entry) => entry.name)).toEqual(['focus/ring', 'shadow/popover'])
  })

  it('refuses a path inside the package', () => {
    expect(() => main(['--figma', join(packageRoot, 'figma.json')], packageRoot)).toThrow(/outside the package/)
  })
})

describe('source', () => {
  let tokensDir: string
  beforeAll(() => {
    tokensDir = mkdtempSync(join(tmpdir(), 'forma-extra-'))
    cpSync(join(packageRoot, 'tokens'), tokensDir, { recursive: true })
    cpSync(join(tokensDir, 'z-index.tokens.json'), join(tokensDir, 'extra.tokens.json'))
  })
  afterAll(() => rmSync(tokensDir, { recursive: true, force: true }))

  it('rejects a token file that FILE_ORDER does not list', () => {
    expect(() => loadSources(tokensDir)).toThrow(/extra\.tokens\.json/)
  })
})
