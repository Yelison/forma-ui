import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createThemeStore } from './themeStore'
import { useTheme } from './useTheme'

const STORAGE_KEY = 'test-theme'
const newStore = () => createThemeStore({ storageKey: STORAGE_KEY })
// The store is created once per consumer, as an application does it, and not on every render.
const renderTheme = (store = newStore()) => renderHook(() => useTheme(store))

afterEach(() => {
  vi.restoreAllMocks()
})

// Ported from Resolve's useTheme.test.tsx (commit c3f02f8), which tested a hook over module state. The behaviors are
// the same; the store is now explicit, and so is the storage key.
describe('useTheme', () => {
  it('follows the system by default without forcing an attribute', () => {
    const { result } = renderTheme()
    expect(result.current.preference).toBe('system')
    expect(result.current.resolved).toBe('light')
    expect(document.documentElement).not.toHaveAttribute('data-theme')
  })

  it('toggles, applies and remembers the preference', () => {
    const { result } = renderTheme()
    act(() => result.current.toggle())
    expect(result.current.resolved).toBe('dark')
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
    expect(localStorage.getItem(STORAGE_KEY)).toBe('dark')
  })

  it('restores the stored preference and goes back to the system', () => {
    localStorage.setItem(STORAGE_KEY, 'dark')
    const { result } = renderTheme()
    expect(result.current.preference).toBe('dark')
    act(() => result.current.setPreference('system'))
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    expect(document.documentElement).not.toHaveAttribute('data-theme')
  })

  it('treats an invalid stored value as the system', () => {
    localStorage.setItem(STORAGE_KEY, 'sepia')
    const { result } = renderTheme()
    expect(result.current.preference).toBe('system')
  })

  it('shares the preference between consumers of one store: changing it in one shows in the other', () => {
    const store = newStore()
    const shell = renderTheme(store)
    const appearance = renderTheme(store)
    act(() => appearance.result.current.setPreference('dark'))
    expect(shell.result.current.preference).toBe('dark')
    expect(shell.result.current.resolved).toBe('dark')
    // The topbar button, from the other consumer, starts from the theme that is painted and goes light on the first click.
    act(() => shell.result.current.toggle())
    expect(appearance.result.current.preference).toBe('light')
    expect(document.documentElement).toHaveAttribute('data-theme', 'light')
  })

  it('follows a change of the stored preference made in another tab', () => {
    const { result } = renderTheme()
    act(() => {
      localStorage.setItem(STORAGE_KEY, 'dark')
      window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY }))
    })
    expect(result.current.preference).toBe('dark')
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
  })

  it('without storage the choice lasts the session and is shared too', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    const store = newStore()
    const first = renderTheme(store)
    const second = renderTheme(store)
    act(() => first.result.current.setPreference('dark'))
    expect(second.result.current.preference).toBe('dark')
    vi.restoreAllMocks()
    // When storage is back, what it holds rules again.
    act(() => first.result.current.setPreference('system'))
    expect(second.result.current.preference).toBe('system')
  })

  it('toggles twice when it is called twice before the next render', () => {
    const { result } = renderTheme()
    act(() => {
      result.current.toggle()
      result.current.toggle()
    })
    expect(result.current.resolved).toBe('light')
  })

  it('keeps the same toggle when the theme changes, so a memoized child does not re-render', () => {
    const { result } = renderTheme()
    const { toggle } = result.current
    act(() => result.current.setPreference('dark'))
    expect(result.current.resolved).toBe('dark')
    expect(result.current.toggle).toBe(toggle)
  })
})
