// The browser entry that scripts/pack-check.ts bundles with Vite in production mode: the components the way an
// application mounts them. The bundle is searched for React copies, so the entry imports `react-dom/client` itself.
import { Button, FormaProvider } from '@yelison/forma-ui'
import { createRoot } from 'react-dom/client'

createRoot(document.getElementById('root')!).render(
  <FormaProvider>
    <Button>Save</Button>
  </FormaProvider>,
)
