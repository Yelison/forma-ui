let locks = 0

/**
 * Locks the document scroll while at least one modal overlay is open.
 * The lock is a counter: the returned function releases one lock, and only the last release unlocks the page.
 */
export function lockScroll(): () => void {
  const root = document.documentElement
  if (locks === 0) {
    // Compensate for the scrollbar that disappears so the content does not jump.
    const scrollbar = window.innerWidth - root.clientWidth
    if (scrollbar > 0) root.style.paddingRight = `${scrollbar}px`
  }
  locks += 1
  root.classList.add('forma-scroll-locked')
  let released = false
  return () => {
    if (released) return
    released = true
    locks -= 1
    if (locks === 0) {
      root.classList.remove('forma-scroll-locked')
      root.style.removeProperty('padding-right')
    }
  }
}
