import { catalogNames } from '../src/i18n/catalogNames'
import { loadCatalogs, type Messages } from '../src/i18n/loadCatalogs'
import type { Locale } from '../src/i18n/locale'

/**
 * Every message of the site in each language: what a test that renders one page with its own messages replaces the
 * catalogues of the app with. It is the same loader the app uses, asked for all the catalogues, so a test never holds a
 * message the app could not load.
 */
export const messages: Record<Locale, Messages> = {
  en: await loadCatalogs('en', catalogNames),
  es: await loadCatalogs('es', catalogNames),
}
