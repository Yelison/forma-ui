const locales = ['en', 'es'] as const
export type Locale = (typeof locales)[number]

/** Where the visitor's choice is remembered. The first-paint script of task 4.2 will read the same key. */
export const localeStorageKey = 'forma-ui-locale'

const isLocale = (value: string): value is Locale => locales.some((locale) => locale === value)

/**
 * The language the site opens in: the stored choice if there is a valid one, then the first browser language the
 * site speaks (`es-MX` is Spanish), then English. Nothing in the URL takes part: paths are the same in both languages.
 */
export function resolveLocale(stored: string | null, navigatorLanguages: readonly string[]): Locale {
  if (stored !== null && isLocale(stored)) return stored

  for (const tag of navigatorLanguages) {
    const language = tag.split('-')[0]?.toLowerCase() ?? ''
    if (isLocale(language)) return language
  }
  return 'en'
}

/** The stored choice, or null when there is none or storage cannot be read (private mode, blocked cookies). */
export function readStoredLocale(): string | null {
  try {
    return localStorage.getItem(localeStorageKey)
  } catch {
    return null
  }
}
