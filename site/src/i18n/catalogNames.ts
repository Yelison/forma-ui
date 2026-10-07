// The catalogues of messages of the site, by name: plain data with no imports, because the app, the scripts that read
// the catalogues (check-messages.ts, emit-route-html.ts) and the Vite plugin all have to agree on the list. Each name is
// a pair of files in src/i18n/catalogs, one per language (`<name>.<language>.json`).

/**
 * Every catalogue. A message lives in the one that the pages which show it load, whatever the prefix of its id says:
 *
 * - `common`: the chrome (bar, drawer, footer), the messages of every route, the search and what several pages share.
 * - `home`, `foundations`, `catalog`, `detail`, `gettingStarted`: the page of that name.
 * - `guides`: what the guides share (the table of contents, the copy button, the next step).
 * - `specimens`: the sample words and states that the catalog and the references of the components all show.
 * - `docs.<component>`: the reference of one component.
 */
export const catalogNames = [
  'common',
  'home',
  'foundations',
  'catalog',
  'guides',
  'gettingStarted',
  'specimens',
  'detail',
  'docs.badge',
  'docs.button',
  'docs.dialog',
  'docs.iconButton',
  'docs.input',
  'docs.tooltip',
] as const

export type CatalogName = (typeof catalogNames)[number]
