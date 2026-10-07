import { useEffect } from 'react'

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

/**
 * Locks the document scroll while `active` is `true`, for an overlay of your own such as a drawer.
 *
 * Every overlay of the library shares one counter, so two overlays open at once keep the page locked until the last of
 * them closes. The lock is the `forma-scroll-locked` class on `<html>`, which `@yelison/forma-ui/base.css` defines:
 * without that stylesheet the hook still counts, but the page keeps scrolling.
 */
export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return
    return lockScroll()
  }, [active])
}
