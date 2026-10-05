import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import './i18n/config'
import App from './App.tsx'

history.scrollRestoration = 'manual'

// index.html trae metadatos estáticos para crawlers sin JS (ver ahí); con la
// app corriendo los reemplaza SeoHead, así que se quitan para no duplicarlos.
document.querySelectorAll('[data-seo-static]').forEach(el => el.remove())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
