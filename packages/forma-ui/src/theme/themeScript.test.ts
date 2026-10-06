import { afterEach, describe, expect, it, vi } from 'vitest'
import { themeScript } from './themeScript'
import { createThemeStore } from './themeStore'

const root = document.documentElement

afterEach(() => {
  vi.restoreAllMocks()
  root.removeAttribute('theme-mode')
})

// Runs the script the way a page does, as the body of an inline <script>.
const run = (script: string) => new Function(script)()

// Keys that would break a naive `'${key}'`: quotes, a backslash, a line break and the end of the element itself.
const hostileKeys = [
  `it's`,
  `say "hi"`,
  `back\\slash`,
  'two\nlines',
  '</script><img src=x onerror=alert(1)>',
  '</SCRIPT >',
  '<!-- <script>',
]

describe('themeScript', () => {
  it.each([
    ['light', 'light'],
    ['dark', 'dark'],
  ])('sets the stored %s theme on <html>', (stored, expected) => {
    localStorage.setItem('app-theme', stored)
    run(themeScript({ storageKey: 'app-theme' }))
    expect(root).toHaveAttribute('data-theme', expected)
  })

  it.each(['sepia', 'system', ''])('leaves the attribute off for the stored value %j', (stored) => {
    localStorage.setItem('app-theme', stored)
    run(themeScript({ storageKey: 'app-theme' }))
    expect(root).not.toHaveAttribute('data-theme')
  })

  it('leaves the attribute off when nothing is stored', () => {
    run(themeScript({ storageKey: 'app-theme' }))
    expect(root).not.toHaveAttribute('data-theme')
  })

  it('reads the key it was given and ignores other keys', () => {
    localStorage.setItem('other-theme', 'dark')
    run(themeScript({ storageKey: 'app-theme' }))
    expect(root).not.toHaveAttribute('data-theme')
  })

  it('sets the attribute it was given', () => {
    localStorage.setItem('app-theme', 'dark')
    run(themeScript({ storageKey: 'app-theme', attribute: 'theme-mode' }))
    expect(root).toHaveAttribute('theme-mode', 'dark')
    expect(root).not.toHaveAttribute('data-theme')
  })

  it('does not throw when storage cannot be read, as in private mode', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(() => run(themeScript({ storageKey: 'app-theme' }))).not.toThrow()
    expect(root).not.toHaveAttribute('data-theme')
  })

  describe('with a hostile storage key', () => {
    it.each(hostileKeys)('stays one script element, with nothing injected: %j', (storageKey) => {
      const script = themeScript({ storageKey })
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
      localStorage.setItem(storageKey, 'dark')
      run(themeScript({ storageKey }))
      expect(root).toHaveAttribute('data-theme', 'dark')
    })

    it('is also safe in the attribute name', () => {
      const script = themeScript({ storageKey: 'app-theme', attribute: '</script><b>' })
      const page = new DOMParser().parseFromString(
        `<!doctype html><head><script>${script}</script></head>`,
        'text/html',
      )
      expect(page.querySelectorAll('script')).toHaveLength(1)
      expect(page.querySelector('b')).toBeNull()
    })
  })

  // The script and the store read the same storage, in two pieces of code: they must give the same answer.
  describe('agrees with the store', () => {
    it.each(['light', 'dark', 'sepia', 'system', null])('on the stored value %j', (stored) => {
      if (stored !== null) localStorage.setItem('app-theme', stored)
      const store = createThemeStore({ storageKey: 'app-theme' })

      run(themeScript({ storageKey: 'app-theme' }))
      const painted = root.getAttribute('data-theme')

      expect(painted ?? 'system').toBe(store.getPreference())
    })
  })
})
