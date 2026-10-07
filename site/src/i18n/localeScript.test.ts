import { createContext, runInContext } from 'node:vm'
import { describe, expect, it } from 'vitest'
import { headScript, localeScript } from './localeScript'
import { defaultLocale, localeStorageKey, locales, resolveLocale } from './locale'

const options = { storageKey: localeStorageKey, locales, fallback: defaultLocale }

interface Page {
  /** What `localStorage.getItem` answers for the key under test, or a function that throws when storage is blocked. */
  stored?: string | null | 'throws'
  languages?: readonly string[]
  storageKey?: string
}

/**
 * Runs the script the way a page does: as a classic script at global scope, in a context that has only the three
 * things the script may touch. Returns the context, so a test can see what the script left behind in it.
 */
function open({ stored = null, languages = [], storageKey = localeStorageKey }: Page = {}) {
  const documentElement = { lang: 'en' }
  const context = createContext({
    document: { documentElement },
    navigator: { languages },
    localStorage: {
      getItem(key: string) {
        if (stored === 'throws') throw new Error('blocked')
        return key === storageKey ? stored : null
      },
    },
  })
  return { context, documentElement }
}

const run = (script: string, page: Page) => {
  const { context, documentElement } = open(page)
  runInContext(script, context)
  return documentElement.lang
}

// Keys that would break a naive `'${key}'`: quotes, a backslash, line breaks (U+2028 and U+2029 are line terminators in
// JavaScript before ES2019) and the end of the element itself.
const hostileKeys = [
  `it's`,
  `say "hi"`,
  `back\\slash`,
  'two\nlines',
  '</script><img src=x onerror=alert(1)>',
  '</SCRIPT >',
  '<!-- <script>',
  'line separator',
  'paragraph separator',
]

describe('localeScript', () => {
  it.each([
    ['the stored language', { stored: 'es', languages: ['en-US'] }, 'es'],
    ['the stored language over a different browser language', { stored: 'en', languages: ['es-ES'] }, 'en'],
    ['the browser language when nothing is stored', { languages: ['es-MX'] }, 'es'],
    ['the first browser language the site speaks', { languages: ['fr-FR', 'es-ES', 'en-US'] }, 'es'],
    ['English for a browser the site does not speak', { languages: ['fr-FR'] }, 'en'],
    ['English when the browser lists no language', { languages: [] }, 'en'],
  ] as const)('sets <html lang> to %s', (_name, page, expected) => {
    expect(run(localeScript(options), page)).toBe(expected)
  })

  it('does not stop at an unreadable storage: the browser language still decides', () => {
    expect(run(localeScript(options), { stored: 'throws', languages: ['es-ES'] })).toBe('es')
  })

  it('leaves <html lang> as the HTML has it when it cannot read the browser languages', () => {
    const { context, documentElement } = open()
    context.navigator = undefined

    expect(() => runInContext(localeScript(options), context)).not.toThrow()
    expect(documentElement.lang).toBe('en')
  })

  // The script is a copy of resolveLocale made when the page is built: it must give the same answer for any input,
  // including the values that are properties of every object.
  describe('agrees with resolveLocale', () => {
    const storedValues = [null, 'en', 'es', 'fr', '', 'ES', 'es-MX', '__proto__', 'constructor', 'toString']
    const browsers = [[], ['fr-FR'], ['es-MX', 'en'], ['en-GB'], ['fr', 'es'], ['ES-es'], ['constructor']]

    it.each(storedValues)('for the stored value %j', (stored) => {
      for (const languages of browsers) {
        expect(run(localeScript(options), { stored, languages }), JSON.stringify(languages)).toBe(
          resolveLocale(stored, languages),
        )
      }
    })
  })

  it('reads the key it was given and ignores the others', () => {
    const script = localeScript({ ...options, storageKey: 'other-key' })

    expect(run(script, { stored: 'es', languages: ['en'], storageKey: 'other-key' })).toBe('es')
    expect(run(script, { stored: 'es', languages: ['en'] })).toBe('en')
  })

  it('serves the languages and the fallback it was given', () => {
    const script = localeScript({ storageKey: 'k', locales: ['de', 'fr'], fallback: 'de' })

    expect(run(script, { languages: ['fr-CA'] })).toBe('fr')
    expect(run(script, { languages: ['es'] })).toBe('de')
  })

  describe('with a hostile storage key', () => {
    it.each(hostileKeys)('stays one script element, with nothing injected: %j', (storageKey) => {
      const script = localeScript({ ...options, storageKey })
      const page = new DOMParser().parseFromString(
        `<!doctype html><head><script>${script}</script></head>`,
        'text/html',
      )
      const scripts = page.querySelectorAll('script')
      expect(scripts).toHaveLength(1)
      expect(scripts[0]?.textContent).toBe(script)
      expect(page.querySelector('img')).toBeNull()
      expect(page.body.textContent).toBe('')
    })

    it.each(hostileKeys)('still reads that exact key: %j', (storageKey) => {
      expect(run(localeScript({ ...options, storageKey }), { stored: 'es', languages: ['en'], storageKey })).toBe('es')
    })
  })

  it('leaves nothing behind in the global scope, so it can run twice and clash with nothing', () => {
    const script = localeScript(options)
    const { context } = open({ languages: ['es'] })
    const before = Object.keys(context)

    runInContext(script, context)
    // A top-level const or let is a global binding that a second run would redeclare, which is a SyntaxError.
    expect(() => runInContext(script, context)).not.toThrow()
    expect(Object.keys(context)).toEqual(before)
  })
})

describe('localeScript source', () => {
  it('is compact: it is in every page, so it has no line breaks, tabs or runs of spaces', () => {
    expect(localeScript(options)).not.toMatch(/[\n\t]| {2}/)
  })
})

interface HeadPage {
  /** The language <html lang> has when the script runs: the one the language script set. */
  lang: string
  /** Whether the page has a meta description to update. */
  description?: boolean
}

/** Runs a head script the way a page does, after <title> and the meta description: returns what it left in them. */
function openHead(script: string, { lang, description = true }: HeadPage) {
  const meta = { content: 'static description', setAttribute: (_name: string, value: string) => (meta.content = value) }
  const document = {
    documentElement: { lang },
    title: 'Static title',
    querySelector: (selector: string) => (selector === 'meta[name="description"]' && description ? meta : null),
  }
  const context = createContext({ document })
  runInContext(script, context)
  return { title: document.title, description: meta.content, context }
}

describe('headScript', () => {
  const heads = { es: { title: 'Fundamentos · Forma UI', description: 'Roles de color.' } }

  it('puts the head of the language in use in <title> and in the meta description', () => {
    expect(openHead(headScript(heads), { lang: 'es' })).toMatchObject({
      title: 'Fundamentos · Forma UI',
      description: 'Roles de color.',
    })
  })

  it('leaves the head of the HTML alone for a language it has no head for, such as the one the HTML is in', () => {
    expect(openHead(headScript(heads), { lang: 'en' })).toMatchObject({
      title: 'Static title',
      description: 'static description',
    })
  })

  // `lang` is only ever a language of the site, but the lookup must not find what every object has.
  it.each(['__proto__', 'constructor', 'toString', ''])('finds no head for the language %j', (lang) => {
    expect(openHead(headScript(heads), { lang })).toMatchObject({ title: 'Static title' })
  })

  it('does not stop at a page without a meta description: the title is still set', () => {
    expect(openHead(headScript(heads), { lang: 'es', description: false }).title).toBe('Fundamentos · Forma UI')
  })

  it('does not throw when the page has no document to read', () => {
    expect(() => runInContext(headScript(heads), createContext({}))).not.toThrow()
  })

  it('leaves nothing behind in the global scope, so it can run twice and clash with nothing', () => {
    const script = headScript(heads)
    const { context } = openHead(script, { lang: 'es' })
    const before = Object.keys(context)

    expect(() => runInContext(script, context)).not.toThrow()
    expect(Object.keys(context)).toEqual(before)
  })

  describe('with a hostile title or description', () => {
    const hostile = hostileKeys.map((text) => ({ es: { title: text, description: text } }))

    it.each(hostile)('stays one script element, with nothing injected: %j', (hostileHeads) => {
      const script = headScript(hostileHeads)
      const page = new DOMParser().parseFromString(
        `<!doctype html><head><script>${script}</script></head>`,
        'text/html',
      )
      expect(page.querySelectorAll('script')).toHaveLength(1)
      expect(page.querySelector('img')).toBeNull()
      expect(page.body.textContent).toBe('')
    })

    it.each(hostile)('still sets that exact text: %j', (hostileHeads) => {
      expect(openHead(headScript(hostileHeads), { lang: 'es' })).toMatchObject(hostileHeads.es)
    })
  })
})
