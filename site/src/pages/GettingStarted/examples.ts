import { packageStatus } from '../../packageStatus'
import type { GuideExample } from '../guide'

/** What the guide tells the reader to type, so a test can hold it against the package it describes. */
export const examples = {
  install: {
    caption: 'terminal',
    code: `npm install ${packageStatus.name} react react-dom`,
  },
  entry: {
    caption: 'main.tsx',
    code: `import '@yelison/forma-ui/tokens.css'
import '@yelison/forma-ui/styles.css'
import '@yelison/forma-ui/base.css'
import './app.css' // yours go after the package's`,
  },
  css: {
    caption: 'app.css',
    code: `.card {
  padding: var(--space-24);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-panel);
  background: var(--color-surface);
  color: var(--color-ink);
  font: var(--font-body);
}`,
  },
  button: {
    caption: 'App.tsx',
    code: `import { Button, FormaProvider } from '@yelison/forma-ui'

export function App() {
  return (
    <FormaProvider>
      <Button variant="primary">Continue</Button>
    </FormaProvider>
  )
}`,
  },
  theme: {
    caption: 'theme.ts',
    code: `import { createThemeStore, themeScript, useTheme } from '@yelison/forma-ui'

export const themeStore = createThemeStore({ storageKey: 'my-app-theme' })

// In the HTML your server or build sends, in <head>:
export const firstPaint = \`<script>\${themeScript({ storageKey: 'my-app-theme' })}</script>\`

export function ThemeToggle() {
  const { resolved, toggle } = useTheme(themeStore)
  return <button onClick={toggle}>{resolved === 'dark' ? 'Light theme' : 'Dark theme'}</button>
}`,
  },
} as const satisfies Record<string, GuideExample>
