import { useEffect, useRef } from 'react'
import { isApplePlatform } from './shortcut'

// The shortcut is the platform's own: ⌘K on Apple devices, Ctrl+K elsewhere. A text area or an editable region has
// shortcuts of its own, and the editor keeps the key there: the search must not take it away. A plain text field has
// none, so the shortcut works from the filter of the catalog.
const editor = 'textarea, [contenteditable]:not([contenteditable="false"])'

/**
 * Calls `onTrigger` when the shortcut that the trigger prints is pressed, ⌘+K on Apple devices and Ctrl+K elsewhere,
 * and keeps the browser from also acting on it (Firefox focuses its search bar). On an Apple device Ctrl+K is left to
 * the text field, where it deletes to the end of the line. Any other key, Shift or Alt with it, a composition in
 * progress and the editors that have the shortcut for themselves are left alone, so the event is only stopped when it
 * is handled.
 */
export function useSearchShortcut(onTrigger: () => void) {
  // The listener is added once, and calls whichever handler the last render made.
  const onTriggerRef = useRef(onTrigger)
  useEffect(() => {
    onTriggerRef.current = onTrigger
  })

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const modifier = isApplePlatform() ? event.metaKey : event.ctrlKey
      const isShortcut = event.key.toLowerCase() === 'k' && modifier && !event.shiftKey && !event.altKey
      if (!isShortcut || event.isComposing) return
      if (event.target instanceof Element && event.target.closest(editor)) return
      event.preventDefault()
      onTriggerRef.current()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])
}
