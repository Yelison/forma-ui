import { useCallback, useSyncExternalStore } from 'react'
import type { ResolvedTheme, ThemePreference, ThemeStore } from './themeStore'

/** What {@link useTheme} returns. */
export interface UseThemeResult {
  /** What the user chose. `system` until they pick a theme, and whenever the stored value is not valid. */
  preference: ThemePreference
  /** The theme that is painted now; it follows the operating system while the preference is `system`. */
  resolved: ResolvedTheme
  /** Saves a preference and applies it to the document. */
  setPreference(preference: ThemePreference): void
  /** Switches to the theme that is not painted when it is called. Its identity changes only with the store. */
  toggle(): void
}

// Without a document there is no stored choice and no media query: render what a first visit shows.
const getServerPreference = (): ThemePreference => 'system'
const getServerResolved = (): ResolvedTheme => 'light'

/**
 * Reads a theme store in a component. Every component that reads the same store sees the same preference, and the
 * preference follows other tabs and the operating system.
 *
 * @example
 * const themeStore = createThemeStore({ storageKey: 'my-app-theme' })
 * const { resolved, toggle } = useTheme(themeStore)
 */
export function useTheme(store: ThemeStore): UseThemeResult {
  const preference = useSyncExternalStore(store.subscribe, store.getPreference, getServerPreference)
  const resolved = useSyncExternalStore(store.subscribe, store.getResolved, getServerResolved)

  // It reads the painted theme when it is called, not the one of the last render: two calls in a row alternate twice,
  // and the function only changes with the store.
  const toggle = useCallback(() => {
    store.setPreference(store.getResolved() === 'dark' ? 'light' : 'dark')
  }, [store])

  return { preference, resolved, setPreference: store.setPreference, toggle }
}
