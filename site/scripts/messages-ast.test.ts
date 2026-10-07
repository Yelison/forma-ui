import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { catalogueModule } from './messages-ast'

// ICU syntax tree node types of @formatjs/icu-messageformat-parser.
const literal = 0
const argument = 1

const directory = mkdtempSync(join(tmpdir(), 'messages-ast-'))
afterAll(() => rmSync(directory, { recursive: true, force: true }))
const write = (name: string, messages: Record<string, string>) => {
  const file = join(directory, name)
  writeFileSync(file, JSON.stringify(messages))
  return file
}

describe('catalogueModule', () => {
  it('replaces a catalogue of its directory by an ES module that exports the syntax trees', () => {
    const file = write('en.json', { hello: 'Hello, {name}' })

    const module = catalogueModule(file, { directory })

    expect(module).toEqual({ code: expect.stringMatching(/^export default /), map: null })
    expect(JSON.parse(module?.code.replace('export default ', '') ?? 'null')).toEqual({
      hello: [
        { type: literal, value: 'Hello, ' },
        { type: argument, value: 'name' },
      ],
    })
  })

  it('leaves alone every module that is not a catalogue of its directory', () => {
    expect(catalogueModule(join(tmpdir(), 'elsewhere.json'), { directory })).toBeNull()
    expect(catalogueModule(join(directory, 'script.ts'), { directory })).toBeNull()
  })

  it('passes the pseudo-locale on', () => {
    const file = write('pseudo-en.json', { title: 'Menu' })

    expect(catalogueModule(file, { directory, pseudoLocale: 'en-XA' })?.code).not.toContain('"Menu"')
  })
})
