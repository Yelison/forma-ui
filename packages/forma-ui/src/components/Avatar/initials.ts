// Created on first use, not when the module loads: importing the package must not run any code (`sideEffects`).
let segmenter: Intl.Segmenter | undefined

/**
 * The user-perceived characters of `text`: an accented letter written as a base plus a combining mark, or an emoji
 * made of several code points, counts as one. Browsers without `Intl.Segmenter` (Firefox before 125) fall back to code
 * points, which still keeps surrogate pairs whole.
 */
function graphemes(text: string): string[] {
  if (typeof Intl.Segmenter !== 'function') return Array.from(text)
  segmenter ??= new Intl.Segmenter(undefined, { granularity: 'grapheme' })
  return Array.from(segmenter.segment(text), ({ segment }) => segment)
}

/**
 * The first letter of a word in capitals. `toUpperCase()` takes no locale, so the server and the client agree. A
 * letter that capitals would turn into several (`ß` into `SS`) stays as it is.
 */
function initialOf(word: string): string {
  const [first = ''] = graphemes(word)
  const upper = first.toUpperCase()
  return graphemes(upper).length === 1 ? upper : first
}

/** The first letter of the first name and of the last surname, in capitals. */
export function initialsOf(name: string): string {
  const words = name.split(/\s+/).filter(Boolean)
  const first = words[0] === undefined ? '' : initialOf(words[0])
  const last = words.length > 1 ? initialOf(words[words.length - 1] ?? '') : ''
  return first + last
}
