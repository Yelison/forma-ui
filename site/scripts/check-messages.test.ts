import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { checkCatalogues, checkMessages } from './check-messages'

const check = (source: Record<string, unknown>, translation: Record<string, unknown>) =>
  checkMessages({ file: 'en.json', messages: source }, { file: 'es.json', messages: translation })

// Each check runs the FormatJS CLI twice, which takes a moment on a busy machine.
describe('checkMessages', { timeout: 30_000 }, () => {
  it('has nothing to say about catalogues that agree', () => {
    expect(check({ a: 'Hello {name}', b: 'Close' }, { a: 'Hola {name}', b: 'Cerrar' })).toEqual([])
  })

  it('reports a key that the translation is missing', () => {
    expect(check({ a: 'Hello', b: 'Close' }, { a: 'Hola' })).toEqual(['es.json: missing "b"'])
  })

  it('reports a key that only the translation has', () => {
    expect(check({ a: 'Hello' }, { a: 'Hola', stale: 'Viejo' })).toEqual(['es.json: "stale" is not in en.json'])
  })

  it('reports a message that is not valid ICU, in either file', () => {
    expect(check({ a: 'Hello {name' }, { a: 'Hola {name}' })).toEqual(['en.json: "a" is not valid ICU'])
    expect(check({ a: 'Hello' }, { a: 'Hola <b>' })).toEqual(['es.json: "a" is not valid ICU'])
  })

  it('reports a plural without the required other branch', () => {
    expect(check({ a: '{count, plural, one {# file}}' }, { a: 'x' })).toEqual(['en.json: "a" is not valid ICU'])
  })

  it('reports a value that is not a string', () => {
    expect(check({ a: 'Hello' }, { a: 3 })).toEqual(['es.json: "a" is not a string'])
  })

  it('reports an argument that the translation lost or renamed', () => {
    expect(check({ a: 'Hello {name}' }, { a: 'Hola' })).toEqual(['es.json: "a" uses none, but en.json uses name'])
    expect(check({ a: 'Hello {name}' }, { a: 'Hola {nombre}' })).toEqual([
      'es.json: "a" uses nombre, but en.json uses name',
    ])
  })

  it('counts the tags of rich text as arguments, since the caller renders them', () => {
    expect(check({ a: 'Read <b>this</b>' }, { a: 'Lee esto' })).toEqual(['es.json: "a" uses none, but en.json uses b'])
    expect(check({ a: 'Read <b>this</b>' }, { a: 'Lee <b>esto</b>' })).toEqual([])
  })

  it('finds the arguments inside the branches of a plural', () => {
    const source = { a: '{count, plural, one {{name} has # file} other {{name} has # files}}' }
    expect(check(source, { a: '{count, plural, one {# archivo} other {# archivos}}' })).toEqual([
      'es.json: "a" uses count, but en.json uses count, name',
    ])
  })
})

const directory = mkdtempSync(join(tmpdir(), 'check-catalogues-'))
afterAll(() => rmSync(directory, { recursive: true, force: true }))

/** A directory of catalogues with the files given (`{ 'page.en.json': { a: 'Hello' } }`), which each test gets anew. */
let made = 0
function catalogues(files: Record<string, Record<string, string>>): string {
  const target = join(directory, `case-${made++}`)
  mkdirSync(target)
  for (const [file, messages] of Object.entries(files)) writeFileSync(join(target, file), JSON.stringify(messages))
  return target
}

const pair = { 'common.en.json': { a: 'Hello' }, 'common.es.json': { a: 'Hola' } }
const names = ['common', 'page']

describe('checkCatalogues', { timeout: 30_000 }, () => {
  it('has nothing to say about pairs that agree', () => {
    const target = catalogues({
      ...pair,
      'page.en.json': { b: 'Close {name}' },
      'page.es.json': { b: 'Cerrar {name}' },
    })

    expect(checkCatalogues(target, names)).toEqual([])
  })

  it('reports the key that the Spanish catalogue of a page is missing, naming the file', () => {
    const target = catalogues({
      ...pair,
      'page.en.json': { b: 'Close', c: 'Open' },
      'page.es.json': { b: 'Cerrar' },
    })

    expect(checkCatalogues(target, names)).toEqual(['page.es.json: missing "c"'])
  })

  it('reports a page whose translation lost an argument', () => {
    const target = catalogues({ ...pair, 'page.en.json': { b: 'Close {name}' }, 'page.es.json': { b: 'Cerrar' } })

    expect(checkCatalogues(target, names)).toEqual(['page.es.json: "b" uses none, but page.en.json uses name'])
  })

  it('reports a catalogue that has no file in one language', () => {
    const target = catalogues({ ...pair, 'page.en.json': { b: 'Close' } })

    expect(checkCatalogues(target, names)).toEqual(['page.es.json is missing'])
  })

  it('reports a file that is not part of any pair, since nothing would load it', () => {
    const target = catalogues({
      ...pair,
      'page.en.json': { b: 'Close' },
      'page.es.json': { b: 'Cerrar' },
      'old.en.json': {},
    })

    expect(checkCatalogues(target, names)).toEqual(['old.en.json is not a catalogue of any name: nothing loads it'])
  })

  it('reports an id that two catalogues both define, which the page that loads both could not tell apart', () => {
    const target = catalogues({ ...pair, 'page.en.json': { a: 'Hi' }, 'page.es.json': { a: 'Hola' } })

    expect(checkCatalogues(target, names)).toEqual([
      'page.en.json: "a" is also in common.en.json, and a page that loads both would show one of them',
    ])
  })
})

describe('the catalogues of the site', { timeout: 30_000 }, () => {
  it('agree: every Spanish catalogue has the keys, the ICU syntax and the arguments of its English one', () => {
    expect(checkCatalogues(resolve(import.meta.dirname, '../src/i18n/catalogs'))).toEqual([])
  })
})
