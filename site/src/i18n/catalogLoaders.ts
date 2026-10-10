import type { CatalogName } from './catalogNames'
import type { Locale } from './locale'

/** What a catalogue module exports: its messages. The production build makes them syntax trees (messages-ast.ts). */
interface CatalogModule {
  default: Record<string, string>
}

/**
 * The module of each catalogue in each language, which the bundler turns into a chunk of its own: nothing is downloaded
 * until `loadCatalogs` asks for it. The imports are literal paths so that the bundler (and the type of `MessageId`)
 * can see every file; `check-messages` fails for a file that is not in the list of names, and the type check for a name
 * with no entry here.
 */
export const catalogLoaders = {
  common: { en: () => import('./catalogs/common.en.json'), es: () => import('./catalogs/common.es.json') },
  home: { en: () => import('./catalogs/home.en.json'), es: () => import('./catalogs/home.es.json') },
  foundations: {
    en: () => import('./catalogs/foundations.en.json'),
    es: () => import('./catalogs/foundations.es.json'),
  },
  catalog: { en: () => import('./catalogs/catalog.en.json'), es: () => import('./catalogs/catalog.es.json') },
  guides: { en: () => import('./catalogs/guides.en.json'), es: () => import('./catalogs/guides.es.json') },
  gettingStarted: {
    en: () => import('./catalogs/gettingStarted.en.json'),
    es: () => import('./catalogs/gettingStarted.es.json'),
  },
  theming: { en: () => import('./catalogs/theming.en.json'), es: () => import('./catalogs/theming.es.json') },
  accessibility: {
    en: () => import('./catalogs/accessibility.en.json'),
    es: () => import('./catalogs/accessibility.es.json'),
  },
  changelog: { en: () => import('./catalogs/changelog.en.json'), es: () => import('./catalogs/changelog.es.json') },
  specimens: { en: () => import('./catalogs/specimens.en.json'), es: () => import('./catalogs/specimens.es.json') },
  detail: { en: () => import('./catalogs/detail.en.json'), es: () => import('./catalogs/detail.es.json') },
  'docs.badge': {
    en: () => import('./catalogs/docs.badge.en.json'),
    es: () => import('./catalogs/docs.badge.es.json'),
  },
  'docs.button': {
    en: () => import('./catalogs/docs.button.en.json'),
    es: () => import('./catalogs/docs.button.es.json'),
  },
  'docs.dialog': {
    en: () => import('./catalogs/docs.dialog.en.json'),
    es: () => import('./catalogs/docs.dialog.es.json'),
  },
  'docs.iconButton': {
    en: () => import('./catalogs/docs.iconButton.en.json'),
    es: () => import('./catalogs/docs.iconButton.es.json'),
  },
  'docs.input': {
    en: () => import('./catalogs/docs.input.en.json'),
    es: () => import('./catalogs/docs.input.es.json'),
  },
  'docs.radio': {
    en: () => import('./catalogs/docs.radio.en.json'),
    es: () => import('./catalogs/docs.radio.es.json'),
  },
  'docs.tabs': {
    en: () => import('./catalogs/docs.tabs.en.json'),
    es: () => import('./catalogs/docs.tabs.es.json'),
  },
  'docs.tooltip': {
    en: () => import('./catalogs/docs.tooltip.en.json'),
    es: () => import('./catalogs/docs.tooltip.es.json'),
  },
} satisfies Record<CatalogName, Record<Locale, () => Promise<CatalogModule>>>
