import { describe, expect, it } from 'vitest'
import en from '../src/i18n/en.json'
import es from '../src/i18n/es.json'
import { checkMessages } from './check-messages'

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

describe('the catalogues of the site', { timeout: 30_000 }, () => {
  it('agree: es.json has the keys, the ICU syntax and the arguments of en.json', () => {
    expect(check(en, es)).toEqual([])
  })
})
