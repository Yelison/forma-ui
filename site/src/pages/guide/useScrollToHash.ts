import { useEffect } from 'react'
import { useLocation } from 'react-router'

/**
 * Scrolls to the section that the address names once the page is there. A direct link with an anchor arrives before the
 * page does (it loads on demand), so the browser found nothing to scroll to. The ids are plain English words, so the
 * hash is not decoded: a malformed one (`#100%`) finds nothing, where decoding it would throw and take the page with it.
 */
export function useScrollToHash() {
  const { hash } = useLocation()

  useEffect(() => {
    if (hash !== '') document.getElementById(hash.slice(1))?.scrollIntoView()
  }, [hash])
}
