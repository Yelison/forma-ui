export interface SearchShortcut {
  /** The modifier as it is printed on the keys of the platform: `⌘` on Apple devices, `Ctrl` anywhere else. */
  modifier: string
  /** The shortcut as `aria-keyshortcuts` writes it. */
  keyShortcuts: string
}

/** Whether the page runs on an Apple device, where the shortcut is ⌘ K and Ctrl K is the keys of the text editing. */
export function isApplePlatform(): boolean {
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform)
}

/** The shortcut that opens the search, in the form of the platform the page runs on. */
export function searchShortcut(): SearchShortcut {
  return isApplePlatform() ? { modifier: '⌘', keyShortcuts: 'Meta+K' } : { modifier: 'Ctrl', keyShortcuts: 'Control+K' }
}
