/**
 * Loads the page again, which is what "Retry" does when something of the site failed to load.
 *
 * It is not a lazy shortcut: a document that failed to import a module keeps the failure for that address for as long as
 * it lives, so asking for the same chunk again in place fails without reaching the network, even once the connection is
 * back (measured in Chromium: the second `import()` of an aborted chunk issued no request). A reload starts a new
 * document, and it also fetches the HTML again, which names the chunks of the version that is published now: after a
 * deployment the ones this page knew may be gone.
 */
export function reloadPage() {
  window.location.reload()
}
