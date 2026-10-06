import { version } from '@yelison/forma-ui'

// Placeholder page: it proves that the site builds against the built package. The documentation site, with its
// i18n mechanism and bilingual copy, replaces it in Phase 4; until then it renders only the product name and a version.
export function App() {
  return (
    <main>
      <h1>Forma UI</h1>
      <p data-testid="library-version">{version}</p>
    </main>
  )
}
