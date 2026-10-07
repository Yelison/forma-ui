import { useLayoutEffect } from 'react'

export interface DocumentHeadProps {
  /** The text of `<title>`, already in the active language. */
  title: string
  /** The text of the meta description, already in the active language. */
  description: string
  /** The absolute URL the page answers to, or none for a page that must not be indexed (not found). */
  canonicalUrl?: string
}

/**
 * Keeps the document head in line with the page on screen. The static HTML of each route already carries the English
 * title, description and canonical link (scripts/emit-route-html.ts); this updates them for the language of the
 * visitor and for client-side navigation. React 19 can render `<title>` itself, but it would add a second one next to
 * the one in the HTML, so the existing elements are updated instead.
 *
 * The update is a layout effect, not a passive one: it runs in the same commit that puts the page on screen, before the
 * browser paints. A passive effect runs after the first paint, so a Spanish visitor would see an English tab title and
 * description (and a crawler that runs scripts would read them) until it did.
 */
export function DocumentHead({ title, description, canonicalUrl }: DocumentHeadProps) {
  useLayoutEffect(() => {
    document.title = title
    document.head.querySelector('meta[name="description"]')?.setAttribute('content', description)

    const canonical = document.head.querySelector('link[rel="canonical"]')
    if (canonicalUrl === undefined) canonical?.removeAttribute('href')
    else canonical?.setAttribute('href', canonicalUrl)
  }, [title, description, canonicalUrl])

  return null
}
