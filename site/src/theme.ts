import { createThemeStore } from '@yelison/forma-ui'

/** Where the visitor's theme is remembered. The first-paint script in index.html reads the same key. */
export const themeStorageKey = 'forma-ui-theme'

/** The theme preference of the site. The theme switcher (task 4.3) reads and writes it through `useTheme`. */
export const themeStore = createThemeStore({ storageKey: themeStorageKey })
