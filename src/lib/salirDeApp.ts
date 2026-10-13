import { detectarNavegadorIntegrado, enlaceAbrirEnChrome } from '../utils/navegadorIntegrado'

// Dentro del navegador de Instagram/Facebook/LinkedIn… en Android, al pulsar
// "Inscribirme" o "Login" se abre directamente Chrome con la misma página, en
// vez de llevar a un login donde Google no funciona. Va dentro del toque de
// la persona (las apps bloquean el salto a otra app sin un gesto).
//
// Una sola vez por visita: si el móvil no tiene Chrome, Android vuelve a
// abrir la página dentro de la app (S.browser_fallback_url) y, sin esta
// marca, cada toque volvería a intentarlo en bucle. Al segundo toque sigue
// el camino normal: el login con el aviso y sus opciones.
const CLAVE = 'salida_app_intentada'

export function intentarAbrirEnChrome(rutaDestino: string, ua = navigator.userAgent): boolean {
  const nav = detectarNavegadorIntegrado(ua)
  if (!nav?.segura || !nav.android) return false
  try {
    if (sessionStorage.getItem(CLAVE)) return false
    sessionStorage.setItem(CLAVE, '1')
  } catch {
    return false
  }
  window.location.href = enlaceAbrirEnChrome(new URL(rutaDestino, window.location.origin).href)
  return true
}
