import { afterEach, describe, expect, it, vi } from 'vitest'
import { createThemeStore } from './themeStore'

const root = document.documentElement

// jsdom has no operating system: this stands in for it, and lets a test switch the system between light and dark.
function fakeSystemTheme(initial: 'light' | 'dark') {
  let dark = initial === 'dark'
  const listeners = new Set<() => void>()
  vi.spyOn(window, 'matchMedia').mockImplementation(
    () =>
      ({
        get matches() {
          return dark
        },
        addEventListener: (_type: string, listener: () => void) => listeners.add(listener),
        removeEventListener: (_type: string, listener: () => void) => listeners.delete(listener),
      }) as unknown as MediaQueryList,
  )
  return {
    switchTo(theme: 'light' | 'dark') {
      dark = theme === 'dark'
      listeners.forEach((listener) => listener())
    },
    watchers: () => listeners.size,
  }
}

function blockStorage() {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('blocked')
  })
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('blocked')
  })
  vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
    throw new Error('blocked')
  })
}

const storageEvent = (key: string | null) => window.dispatchEvent(new StorageEvent('storage', { key }))

afterEach(() => {
  root.removeAttribute('theme-mode')
  vi.restoreAllMocks()
})

describe('createThemeStore', () => {
  it('has no effect on the page until a preference is set or someone subscribes', () => {
    localStorage.setItem('app-theme', 'dark')
    createThemeStore({ storageKey: 'app-theme' })
    expect(root).not.toHaveAttribute('data-theme')
  })

  it('sets the attribute for light and dark, and removes it for the system', () => {
    const store = createThemeStore({ storageKey: 'app-theme' })
    store.setPreference('dark')
    expect(root).toHaveAttribute('data-theme', 'dark')
    store.setPreference('light')
    expect(root).toHaveAttribute('data-theme', 'light')
    store.setPreference('system')
    expect(root).not.toHaveAttribute('data-theme')
  })

  it('writes the attribute that it was given instead of data-theme', () => {
    const store = createThemeStore({ storageKey: 'app-theme', attribute: 'theme-mode' })
    store.setPreference('dark')
    expect(root).toHaveAttribute('theme-mode', 'dark')
    expect(root).not.toHaveAttribute('data-theme')
  })

  it('brings the document in line with the stored preference when someone subscribes', () => {
    localStorage.setItem('app-theme', 'dark')
    const store = createThemeStore({ storageKey: 'app-theme' })
    const unsubscribe = store.subscribe(() => {})
    expect(root).toHaveAttribute('data-theme', 'dark')
    unsubscribe()
  })

  it.each([
    ['light', 'light'],
    ['dark', 'dark'],
    ['sepia', 'system'],
    ['', 'system'],
  ])('reads the stored value %j as %s', (stored, expected) => {
    localStorage.setItem('app-theme', stored)
    expect(createThemeStore({ storageKey: 'app-theme' }).getPreference()).toBe(expected)
  })

  describe('resolving the system', () => {
    it('resolves system to what the operating system prefers, and a fixed theme to itself', () => {
      fakeSystemTheme('dark')
      const store = createThemeStore({ storageKey: 'app-theme' })
      expect(store.getResolved()).toBe('dark')
      store.setPreference('light')
      expect(store.getResolved()).toBe('light')
    })

    it('tells its subscribers when the operating system changes theme', () => {
      const system = fakeSystemTheme('light')
      const store = createThemeStore({ storageKey: 'app-theme' })
      const listener = vi.fn()
      const unsubscribe = store.subscribe(listener)
      system.switchTo('dark')
      expect(listener).toHaveBeenCalledTimes(1)
      expect(store.getResolved()).toBe('dark')
      unsubscribe()
    })
  })

  describe('listeners', () => {
    it('notifies on a change of the stored preference from another tab, and applies it', () => {
      const store = createThemeStore({ storageKey: 'app-theme' })
      const listener = vi.fn()
      const unsubscribe = store.subscribe(listener)
      localStorage.setItem('app-theme', 'dark')
      storageEvent('app-theme')
      expect(listener).toHaveBeenCalledTimes(1)
      expect(root).toHaveAttribute('data-theme', 'dark')
      unsubscribe()
    })

    it('notifies when another tab clears the whole storage', () => {
      localStorage.setItem('app-theme', 'dark')
      const store = createThemeStore({ storageKey: 'app-theme' })
      const listener = vi.fn()
      const unsubscribe = store.subscribe(listener)
      localStorage.clear()
      storageEvent(null)
      expect(listener).toHaveBeenCalledTimes(1)
      expect(root).not.toHaveAttribute('data-theme')
      unsubscribe()
    })

    it('ignores the storage events of other keys', () => {
      const store = createThemeStore({ storageKey: 'app-theme' })
      const listener = vi.fn()
      const unsubscribe = store.subscribe(listener)
      storageEvent('something-else')
      expect(listener).not.toHaveBeenCalled()
      unsubscribe()
    })

    it('stops listening to the window once the last subscriber leaves', () => {
      const system = fakeSystemTheme('light')
      const store = createThemeStore({ storageKey: 'app-theme' })
      const listener = vi.fn()
      const unsubscribeFirst = store.subscribe(listener)
      const unsubscribeSecond = store.subscribe(() => {})
      expect(system.watchers()).toBe(1)
      unsubscribeFirst()
      unsubscribeSecond()
      storageEvent('app-theme')
      system.switchTo('dark')
      expect(listener).not.toHaveBeenCalled()
      expect(system.watchers()).toBe(0)
    })
  })

  describe('two stores', () => {
    it('do not disturb each other when their keys and attributes differ', () => {
      const site = createThemeStore({ storageKey: 'site-theme' })
      const docs = createThemeStore({ storageKey: 'docs-theme', attribute: 'theme-mode' })
      const siteListener = vi.fn()
      const docsListener = vi.fn()
      const unsubscribeSite = site.subscribe(siteListener)
      const unsubscribeDocs = docs.subscribe(docsListener)

      docs.setPreference('dark')
      expect(docsListener).toHaveBeenCalledTimes(1)
      expect(siteListener).not.toHaveBeenCalled()
      expect(site.getPreference()).toBe('system')
      expect(localStorage.getItem('site-theme')).toBeNull()
      expect(root).not.toHaveAttribute('data-theme')

      localStorage.setItem('site-theme', 'light')
      storageEvent('site-theme')
      expect(siteListener).toHaveBeenCalledTimes(1)
      expect(docsListener).toHaveBeenCalledTimes(1)
      expect(docs.getPreference()).toBe('dark')
      expect(root).toHaveAttribute('theme-mode', 'dark')

      unsubscribeSite()
      unsubscribeDocs()
    })

    it('keep their in-memory choice apart when storage is blocked', () => {
      blockStorage()
      const first = createThemeStore({ storageKey: 'first-theme' })
      const second = createThemeStore({ storageKey: 'second-theme' })
      first.setPreference('dark')
      expect(first.getPreference()).toBe('dark')
      expect(second.getPreference()).toBe('system')
    })
  })

  describe('when storage is unavailable', () => {
    it('keeps the choice in memory if storage cannot be read or written, as in private mode', () => {
      blockStorage()
      const store = createThemeStore({ storageKey: 'app-theme' })
      const listener = vi.fn()
      const unsubscribe = store.subscribe(listener)
      expect(store.getPreference()).toBe('system')
      store.setPreference('dark')
      expect(store.getPreference()).toBe('dark')
      expect(store.getResolved()).toBe('dark')
      expect(root).toHaveAttribute('data-theme', 'dark')
      expect(listener).toHaveBeenCalledTimes(1)
      store.setPreference('system')
      expect(store.getPreference()).toBe('system')
      expect(root).not.toHaveAttribute('data-theme')
      unsubscribe()
    })

    it('keeps the choice in memory if storage can be read but not written', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('blocked')
      })
      const store = createThemeStore({ storageKey: 'app-theme' })
      store.setPreference('dark')
      expect(store.getPreference()).toBe('dark')
    })

    it('goes back to what storage holds once it works again', () => {
      const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('blocked')
      })
      const store = createThemeStore({ storageKey: 'app-theme' })
      store.setPreference('dark')
      setItem.mockRestore()
      store.setPreference('light')
      expect(store.getPreference()).toBe('light')
      expect(localStorage.getItem('app-theme')).toBe('light')
    })
  })
})
