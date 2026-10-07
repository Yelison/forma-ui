import { useLayoutEffect, useState, type RefObject } from 'react'

/**
 * Whether the content of an element is wider than the element, so that it scrolls sideways. That depends on the
 * layout, which only the browser knows once the element is on the page: it is measured after each render of `content`
 * and again when the window changes size, the one thing that moves the width of a block in the page.
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
    window.addEventListener('resize', measure)
    element.addEventListener('blur', measure)
    return () => {
      window.removeEventListener('resize', measure)
      element.removeEventListener('blur', measure)
    }
  }, [ref, content])

  return scrolls
}
