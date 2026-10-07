import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { compileMessages } from './formatjs'

// ICU syntax tree node types of @formatjs/icu-messageformat-parser.
const literal = 0
const argument = 1
const plural = 6

const directory = mkdtempSync(join(tmpdir(), 'formatjs-'))
afterAll(() => rmSync(directory, { recursive: true, force: true }))

const write = (name: string, messages: Record<string, string>) => {
  const file = join(directory, name)
  writeFileSync(file, JSON.stringify(messages))
  return file
}

describe('compileMessages', () => {
  it('turns each message into its ICU syntax tree', () => {
    const file = write('catalogue.json', {
      greeting: 'Hello, {name}',
      items: '{count, plural, one {# item} other {# items}}',
    })

    const compiled = compileMessages(file)

    expect(compiled.greeting).toEqual([
      { type: literal, value: 'Hello, ' },
      { type: argument, value: 'name' },
    ])
    expect(compiled.items?.[0]).toMatchObject({ type: plural, value: 'count' })
  })

  it('refuses a message that is not valid ICU, which names the problem', () => {
    const file = write('invalid.json', { broken: 'Hello, {name' })

    expect(() => compileMessages(file)).toThrow(/EXPECT_ARGUMENT_CLOSING_BRACE/)
  })

  it('can leave the invalid messages out instead, to report them all', () => {
    const file = write('mixed.json', { broken: 'Hello, {name', fine: 'Hello' })

    expect(Object.keys(compileMessages(file, { skipErrors: true }))).toEqual(['fine'])
  })

  it('returns no message when none is valid and the invalid ones are left out', () => {
    const file = write('none.json', { broken: 'Hello, {name' })

    expect(compileMessages(file, { skipErrors: true })).toEqual({})
  })

  it('pseudo-localizes the messages when it is given a pseudo-locale', () => {
    const file = write('pseudo.json', { title: 'Menu' })

    const [first, middle] = compileMessages(file, { pseudoLocale: 'en-XA' }).title ?? []

    expect(first).toEqual({ type: literal, value: '[' })
    expect(middle).toMatchObject({ type: literal, value: expect.not.stringMatching(/^Menu$/) })
  })
})
