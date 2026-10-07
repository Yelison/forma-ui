import { pickLocale } from './locale.ts'

export interface LocaleScriptOptions {
  /** The `localStorage` key that holds the choice: the one `readStoredLocale` reads. */
  storageKey: string
  /** The languages of the site. */
  locales: readonly string[]
  /** The language of a visitor whose browser speaks none of them. */
  fallback: string
}

// A JavaScript string literal that is also safe inside an HTML <script> element: JSON.stringify covers quotes,
// backslashes and line breaks, and every `<` becomes its escape so `</script>` and `<!--` cannot end the element or
// open a comment. The library's `themeScript` does the same; its helper is private to the package.
const literal = (value: unknown) => JSON.stringify(value).replaceAll('<', '\\u003c')

// The source of pickLocale as the build left it has the line breaks and tabs of the code. It goes into every page, so
// they are squeezed. A comment inside pickLocale would take the rest of the script with it: the tests that run the
// script against resolveLocale would fail at once.
const compact = (source: string) => source.replace(/\s+/g, ' ')

/**
 * The first-paint script for the language: a string for an inline `<script>` in `<head>`. It sets `<html lang>` to the
 * language the app is about to open in, with the logic of `pickLocale` (written into the script, not copied by hand),
 * so the page is in the right language before React renders and a Spanish visitor never sees English.
 *
 * It has no dependencies and never throws. Its variables are block-scoped and the function stays an expression, so it
 * leaves nothing in the global scope: a `const` at the top level of a classic script would be a global binding, and a
 * function declaration in a block, a global property. Storage that cannot be read leaves the browser to decide.
 *
 * It must be in the HTML that is served: a `<script>` that React renders on the client does not run.
 */
export function localeScript({ storageKey, locales, fallback }: LocaleScriptOptions): string {
  return (
    `try{const pick=${compact(pickLocale.toString())};let stored=null;` +
    `try{stored=localStorage.getItem(${literal(storageKey)})}catch{}` +
    `document.documentElement.lang=pick(${literal(locales)},${literal(fallback)},stored,navigator.languages)}catch{}`
  )
}

/** The title and the description of a page in one language. */
export interface PageHead {
  title: string
  description: string
}

/**
 * The head script: for an inline `<script>` right after `<title>` and the meta description, which the HTML of a route
 * has in English. If the language the page opens in (the `<html lang>` that `localeScript` set before it) has a head in
 * `heads`, it puts that title and description in their place. So a Spanish visitor's tab and a crawler that runs
 * scripts see Spanish before the JS of the app has even downloaded. Without a head for the language, such as English,
 * the HTML is left as it is.
 *
 * `heads` is a literal in the script, not JSON to parse, so there is nothing to be malformed, and like the other
 * first-paint scripts it leaves no global behind and never throws.
 */
export function headScript(heads: Readonly<Record<string, PageHead>>): string {
  return (
    `try{const head=${literal(heads)}[document.documentElement.lang];` +
    // `lang` is a language of the site, but `__proto__` and `constructor` must not be a head: a head has a title.
    `if(head&&typeof head.title==="string"){document.title=head.title;` +
    `const meta=document.querySelector('meta[name="description"]');` +
    `if(meta)meta.setAttribute("content",head.description)}}catch{}`
  )
}

/**
 * The catalogue script: for an inline `<script>` after `headScript`. It adds a `<link rel="modulepreload">` to `<head>`
 * for each URL that `hrefs` lists for the language the page opens in (the `<html lang>` that `localeScript` set before
 * it), so the browser fetches the messages of the page beside the app instead of after it. The app asks for them with
 * `import()`, which a preload of the same URL, in the same CORS mode (an empty `crossorigin`), answers.
 *
 * The language is only known to a script, not to the HTML, which is why the tags are not written into it: a link for
 * each language would download the one the visitor does not read. A language with no list, such as one the site does
 * not have, preloads nothing. Like the other first-paint scripts it leaves no global behind and never throws.
 */
export function catalogPreloadScript(hrefs: Readonly<Record<string, readonly string[]>>): string {
  return (
    // A language that is not a key (`fr`, `__proto__`) finds nothing a loop can run over: the `try` is what ends it.
    `try{for(const href of ${literal(hrefs)}[document.documentElement.lang]??[]){` +
    `const link=document.createElement("link");link.rel="modulepreload";link.setAttribute("crossorigin","");` +
    `link.href=href;document.head.append(link)}}catch{}`
  )
}
