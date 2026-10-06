import '@yelison/forma-ui/tokens.css'
import '@yelison/forma-ui/base.css'
import './styles/site.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { App } from './App'
import { IntlRoot } from './i18n'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <IntlRoot>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <App />
      </BrowserRouter>
    </IntlRoot>
  </StrictMode>,
)
