import type { ThemeStoreOptions } from './themeStore'

// A JavaScript string literal that is also safe inside an HTML <script> element. JSON.stringify covers quotes,
// backslashes and line breaks; the only thing left is `</script>` (and `<!--`), which the HTML parser would read
// as the end of the element or as the start of a comment, so every `<` becomes its escape.
const literal = (value: string) => JSON.stringify(value).replaceAll('<', '\\u003c')

/**
 * The first-paint script: a string for an inline `<script>` in `<head>`, before the stylesheet paints. It sets the
 * stored `light` or `dark` on `<html>` before React renders, so a reload does not flash the theme the operating system
 * prefers. Any other stored value, or none, leaves the attribute off and `prefers-color-scheme` decides, as it does
 * for `system` in `createThemeStore`.
 *
 * It has no dependencies, leaves no global behind and never throws: its only variable is block-scoped, so it neither
 * overwrites nor clashes with a global of the page, and storage that cannot be read just leaves the page as the system
 * has it.
 * The options are the ones of `createThemeStore`, and they must be the same. Any `storageKey` and `attribute` are
 * safe to pass, whatever characters they hold.
 *
 * It has to be in the HTML that is served, in `<head>` before the stylesheet paints: a `<script>` that React renders
 * on the client does not run, and one that React renders on the server comes out HTML-escaped.
 *
 * @example
 * // In index.html, or in a `transformIndexHtml` hook:
 * const html = `<script>${themeScript({ storageKey: 'my-app-theme' })}</script>`
 */
export function themeScript({ storageKey, attribute = 'data-theme' }: ThemeStoreOptions): string {
  return (
    `try{const t=localStorage.getItem(${literal(storageKey)});` +
    `if(t==="light"||t==="dark")document.documentElement.setAttribute(${literal(attribute)},t)}catch{}`
  )
}
