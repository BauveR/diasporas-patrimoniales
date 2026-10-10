import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import './i18n/config'
import App from './App.tsx'
import { recargarPorVersionNueva } from './lib/conexion'

history.scrollRestoration = 'manual'

// Tras un deploy, los chunks con hash de la versión anterior ya no existen:
// Vite avisa con este evento al fallar un import() dinámico. Recargar una
// vez trae la versión nueva (ver lib/conexion.ts) en vez de romper la
// pantalla o dejarla cargando.
window.addEventListener('vite:preloadError', event => {
  if (recargarPorVersionNueva()) event.preventDefault()
})

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
