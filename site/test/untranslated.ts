const marked = /^⟦[\w.]+⟧$/

/**
 * The visible text and the accessible names under `root` that did not come from a message. Render with every message
 * replaced by a mark (`markedMessages`) and this lists whatever is still written in the source: a copy in one language
 * that no translation reaches. `fixedTerms` are the words that are never translated (the glossary).
 */
export function untranslatedText(root: HTMLElement, fixedTerms: readonly string[] = []): string[] {
  const found: string[] = []
  const isFixed = (text: string) => marked.test(text) || fixedTerms.includes(text)

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
    const text = node.textContent?.trim() ?? ''
    // A decorative glyph (aria-hidden) says nothing in any language, and code is never translated (the glossary): a
    // block of it (pre) and a name or a value in a line (code).
    if (text !== '' && !isFixed(text) && !node.parentElement?.closest('[aria-hidden="true"], pre, code'))
      found.push(text)
  }

  for (const element of root.querySelectorAll('[aria-label], [title], [alt], [placeholder]')) {
    for (const attribute of ['aria-label', 'title', 'alt', 'placeholder']) {
      const value = element.getAttribute(attribute)
      if (value !== null && !isFixed(value)) found.push(`${attribute}="${value}"`)
    }
  }
  return found
}
