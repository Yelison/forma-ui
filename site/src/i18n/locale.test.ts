import { afterEach, describe, expect, it, vi } from 'vitest'
import { localeNames, localeStorageKey, readStoredLocale, resolveLocale, storeLocale } from './locale'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('resolveLocale', () => {
  it.each([
    ['es-MX', 'es'],
    ['es', 'es'],
    ['ES-es', 'es'],
    ['en-GB', 'en'],
  ])('reads %s as %s', (tag, expected) => {
    expect(resolveLocale(null, [tag])).toBe(expected)
  })

  it('falls back to English for a language the site does not speak', () => {
    expect(resolveLocale(null, ['fr'])).toBe('en')
    expect(resolveLocale(null, [])).toBe('en')
  })

  it('follows the order of the browser preferences and skips languages it does not speak', () => {
    expect(resolveLocale(null, ['fr-FR', 'es-ES', 'en-US'])).toBe('es')
  })

  it('lets the stored choice win over the browser', () => {
    expect(resolveLocale('en', ['es-ES'])).toBe('en')
    expect(resolveLocale('es', ['en-US'])).toBe('es')
  })

  it('ignores a stored value that is not a language of the site', () => {
    expect(resolveLocale('fr', ['es-ES'])).toBe('es')
    expect(resolveLocale('', ['es-ES'])).toBe('es')
  })
})

describe('readStoredLocale', () => {
  it('reads the choice stored under forma-ui-locale', () => {
    localStorage.setItem(localeStorageKey, 'es')
    expect(readStoredLocale()).toBe('es')
    expect(localeStorageKey).toBe('forma-ui-locale')
  })

  it('returns null when nothing is stored', () => {
    expect(readStoredLocale()).toBeNull()
  })

  it('returns null, and does not throw, when storage cannot be read', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(readStoredLocale()).toBeNull()
  })
})

describe('storeLocale', () => {
  it('stores the choice where readStoredLocale finds it', () => {
    storeLocale('es')
    expect(localStorage.getItem(localeStorageKey)).toBe('es')
    expect(readStoredLocale()).toBe('es')
  })

  it('does not throw when storage cannot be written', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(() => storeLocale('es')).not.toThrow()
  })
})

describe('localeNames', () => {
  it('names each language in itself, which is not a message and does not change with the language of the page', () => {
    expect(localeNames).toEqual({ en: 'English', es: 'Español' })
  })
})
