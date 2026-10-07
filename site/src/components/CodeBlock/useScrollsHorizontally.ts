import { useLayoutEffect, useState, type RefObject } from 'react'

/**
 * Whether the content of an element is wider than the element, so that it scrolls sideways. That depends on the
 * layout, which only the browser knows once the element is on the page: it is measured after each render of `content`
 * and again whenever the element changes size, which covers the window and its container changing width, and the
 * element going from hidden (a tab that is not shown measures 0 × 0) to visible.
 *
 * An element that has the focus keeps answering `true`, even when it no longer overflows: the answer decides whether it
 * is focusable, and taking that away from the element that has the focus would drop the focus on the page. It is
 * measured again when the focus leaves.
 */
export function useScrollsHorizontally(ref: RefObject<HTMLElement | null>, content: string): boolean {
  const [scrolls, setScrolls] = useState(false)

  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return
    const measure = () => setScrolls(element.scrollWidth > element.clientWidth || element === document.activeElement)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    element.addEventListener('blur', measure)
    return () => {
      observer.disconnect()
      element.removeEventListener('blur', measure)
    }
  }, [ref, content])

  return scrolls
}
