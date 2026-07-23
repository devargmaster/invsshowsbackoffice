import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { applyTheme, THEME_CACHE_KEY, type ThemePalette } from './theme/applyTheme'

// Aplica la última paleta cacheada antes del primer render — reduce el
// flash de colores default en visitas repetidas (ThemeBootstrap la
// refresca desde la API después, dentro de <App/>).
const cached = localStorage.getItem(THEME_CACHE_KEY)
if (cached) {
  try {
    applyTheme(JSON.parse(cached) as ThemePalette)
  } catch {
    // cache corrupto, se ignora — queda el default de index.css
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
