import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from './App.tsx'
import { LanguageProvider } from './i18n/LanguageProvider'
import { ThemeProvider } from './theme/ThemeProvider'

import './theme/fonts.css'
import './theme/tokens.css'
import './index.css'

// Marks that the bundle runs, so CSS features that hide content until a script
// acts (the scroll reveal) can be scoped to it and stay fail-open without it.
document.documentElement.classList.add('js')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </ThemeProvider>
  </StrictMode>,
)
