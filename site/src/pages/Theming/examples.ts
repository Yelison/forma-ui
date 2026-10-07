import { themeScript } from '@yelison/forma-ui'
import type { GuideExample } from '../guide'

const storageKey = 'my-app-theme'

/** What the guide tells the reader to type, so a test can hold it against the package it describes. */
export const examples = {
  attribute: {
    caption: 'index.html',
    code: `<html data-theme="dark">  <!-- light or dark: the choice of the person -->
<html>                    <!-- system: no attribute, prefers-color-scheme decides -->`,
  },
  store: {
    caption: 'theme.tsx',
    code: `import { createThemeStore, useTheme } from '@yelison/forma-ui'

export const themeStore = createThemeStore({ storageKey: '${storageKey}' })

export function ThemeStatus() {
  // preference: 'light' | 'dark' | 'system'. resolved: 'light' | 'dark', what is painted now.
  const { preference, resolved, setPreference } = useTheme(themeStore)
  return (
    <button onClick={() => setPreference('system')} disabled={preference === 'system'}>
      Follow the system (now {resolved})
    </button>
  )
}`,
  },
  // What the package really returns: the guide shows its output, not a copy of it.
  firstPaint: {
    caption: 'index.html',
    code: `<head>
  <script>${themeScript({ storageKey })}</script>
</head>`,
  },
  provider: {
    caption: 'main.tsx',
    code: `import { FormaProvider } from '@yelison/forma-ui'

// The provider replaces the text of the components. The theme does not need it.
<FormaProvider strings={{ buttonLoading: 'Enviando…', dialogClose: 'Cerrar' }}>
  <App />
</FormaProvider>`,
  },
} as const satisfies Record<string, GuideExample>
