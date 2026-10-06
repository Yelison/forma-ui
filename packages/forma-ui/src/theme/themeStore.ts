/** What the user chose: a fixed theme, or `system` to follow the operating system. */
export type ThemePreference = 'light' | 'dark' | 'system'

/** The theme that is actually painted. */
export type ResolvedTheme = 'light' | 'dark'

/** Options of {@link createThemeStore}. */
export interface ThemeStoreOptions {
  /** The `localStorage` key that holds the preference. The inline script from `themeScript` must use the same key. */
  storageKey: string
  /**
   * The attribute that `light` and `dark` set on `<html>`; `system` removes it. Defaults to `'data-theme'`, which is
   * the one the selectors in `tokens.css` listen to: another attribute only makes sense with your own stylesheet.
   */
  attribute?: string
}

/**
 * An external store with the theme preference. It is the shape that `useSyncExternalStore` takes, so every method is
 * a stable function that needs no `this`.
 */
export interface ThemeStore {
  /** The stored preference. A missing, unreadable or unknown stored value is `system`. */
  getPreference(): ThemePreference
  /** The theme that is painted: the preference, or the operating system's when the preference is `system`. */
  getResolved(): ResolvedTheme
  /**
   * Saves the preference and applies it to `<html>` right away. When storage is unavailable (private mode, blocked)
   * the choice lasts in memory, for this store only.
   */
  setPreference(preference: ThemePreference): void
  /**
   * Calls `listener` when the preference changes, here or in another tab, and when the operating system switches
   * between light and dark. While anyone is subscribed the store also keeps `<html>` in line with the stored value.
   * Returns the function that unsubscribes.
   */
  subscribe(listener: () => void): () => void
}

const DARK_QUERY = '(prefers-color-scheme: dark)'

/**
 * Creates the theme store of one application. Each store has its own listeners and in-memory fallback: stores with
 * different keys do not wake each other, although two stores that write the same `attribute` share the document.
 *
 * Creating a store has no effect on the page: the document is touched when a preference is set or someone subscribes.
 */
export function createThemeStore({ storageKey, attribute = 'data-theme' }: ThemeStoreOptions): ThemeStore {
  const listeners = new Set<() => void>()
  // The choice made while storage is unavailable; `null` whenever storage holds what was chosen.
  let memoryPreference: ThemePreference | null = null
  let disconnect: (() => void) | undefined

  function readStored(): ThemePreference {
    try {
      const stored = localStorage.getItem(storageKey)
      return stored === 'light' || stored === 'dark' ? stored : 'system'
    } catch {
      return 'system'
    }
  }

  function writeStored(preference: ThemePreference) {
    try {
      if (preference === 'system') localStorage.removeItem(storageKey)
      else localStorage.setItem(storageKey, preference)
    } catch {
      // Storage is unavailable: `setPreference` keeps the choice in memory.
    }
  }

  const getPreference = () => memoryPreference ?? readStored()

  const systemTheme = (): ResolvedTheme => (window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light')

  function getResolved(): ResolvedTheme {
    const preference = getPreference()
    return preference === 'system' ? systemTheme() : preference
  }

  // `system` removes the attribute and leaves the decision to the `prefers-color-scheme` rules of the stylesheet.
  function applyAttribute() {
    const root = document.documentElement
    const preference = getPreference()
    if (preference === 'system') root.removeAttribute(attribute)
    else root.setAttribute(attribute, preference)
  }

  const notify = () => listeners.forEach((listener) => listener())

  function onPreferenceChange() {
    applyAttribute()
    notify()
  }

  // One set of window listeners per store, however many components subscribe.
  function connect() {
    const media = window.matchMedia(DARK_QUERY)
    const onStorage = (event: StorageEvent) => {
      // A null key means the other tab cleared the whole storage.
      if (event.key === null || event.key === storageKey) onPreferenceChange()
    }
    window.addEventListener('storage', onStorage)
    media.addEventListener('change', notify)
    applyAttribute()
    return () => {
      window.removeEventListener('storage', onStorage)
      media.removeEventListener('change', notify)
    }
  }

  function setPreference(preference: ThemePreference) {
    writeStored(preference)
    // If storage did not take the value, the store holds it; when it did, storage is the source of truth again.
    memoryPreference = readStored() === preference ? null : preference
    onPreferenceChange()
  }

  function subscribe(listener: () => void) {
    listeners.add(listener)
    disconnect ??= connect()
    return () => {
      listeners.delete(listener)
      if (listeners.size === 0) {
        disconnect?.()
        disconnect = undefined
      }
    }
  }

  return { getPreference, getResolved, setPreference, subscribe }
}
