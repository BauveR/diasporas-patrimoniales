import { useEffect, useLayoutEffect, useRef } from 'react'
import type { Location, NavigationType } from 'react-router-dom'
import { scrollToSection } from '../lib/scrollToSection'
import { localizePathname } from '../i18n/routing'
import { DEFAULT_LOCALE } from '../i18n/config'

// Posición de scroll de cada entrada del historial (location.key) — como el
// <ScrollRestoration> de React Router. Antes solo Home recordaba la suya:
// al volver atrás/adelante a cualquier otra página (Perfil, Privacidad…) se
// heredaba el scroll de la anterior, a menudo el final de Home.
const posiciones: Record<string, number> = {}

// Reintentos para que el salto no lo pise nada que llegue un poco después:
// la página lazy terminando de aparecer, la animación de salida de la
// anterior, o iOS re-aplicando su propio desplazamiento al cerrarse el
// teclado (ej. tras escribir el teléfono en la tarjeta de inscripción).
// Si la persona toca o usa la rueda en el medio, se deja de insistir.
const REINTENTOS_MS = [0, 100, 300, 600]

function irA(top: number): () => void {
  let cancelado = false
  const timers: ReturnType<typeof setTimeout>[] = []
  const cancelar = () => {
    cancelado = true
    timers.forEach(clearTimeout)
    window.removeEventListener('wheel', cancelar)
    window.removeEventListener('touchstart', cancelar)
  }
  window.addEventListener('wheel', cancelar, { passive: true })
  window.addEventListener('touchstart', cancelar, { passive: true })

  const saltar = () => {
    if (cancelado) return
    // Si la página todavía no es tan alta (contenido lazy), el navegador
    // recorta; el siguiente reintento llega más cerca.
    if (Math.abs(window.scrollY - top) > 1) window.scrollTo(0, top)
  }
  saltar()
  for (const ms of REINTENTOS_MS.slice(1)) timers.push(setTimeout(saltar, ms))
  timers.push(setTimeout(cancelar, REINTENTOS_MS.at(-1)! + 50))
  return cancelar
}

// Todo el scroll por navegación vive acá (lo usa App), no en las páginas:
// debajo de <Routes location={...}> React Router reporta useNavigationType()
// siempre como 'POP', así que solo el nivel de App sabe si fue un click
// (PUSH/REPLACE) o un back/forward.
//  - Página nueva (PUSH/REPLACE): arriba del todo.
//  - Atrás/adelante (POP): donde estaba esa entrada, o arriba si no hay dato.
//  - Link con hash ("/#programa"): scroll a esa sección de Home.
//  - Misma URL otra vez (logo/"Inicio" estando ya en Home): subir en suave.
// No mueve nada al abrir o cerrar un modal con `background` (la página de
// fondo no cambia) ni al cambiar solo de idioma (/perfil → /en/perfil).
export function useScrollAlNavegar(location: Location, navType: NavigationType, background: Location | undefined) {
  const pathSinIdioma = localizePathname(location.pathname, DEFAULT_LOCALE)
  const prevRef = useRef({ pathSinIdioma, pathname: location.pathname, key: location.key, conModal: !!background })

  // Guarda la posición de la entrada actual mientras se scrollea (sin modal
  // abierto: con modal, el scroll es el de la página de fondo, no el suyo).
  // La entrada "actual" sale de un ref que el layout effect de abajo cambia
  // en el mismo instante de la navegación — con una clave fija por efecto,
  // el evento de scroll que provoca el propio salto llegaba cuando todavía
  // escuchaba el listener de la página anterior y le pisaba su posición
  // (ej. Home quedaba guardada en 0 y al volver atrás aparecía arriba).
  const actualRef = useRef({ key: location.key, conModal: !!background })
  useEffect(() => {
    const guardar = () => {
      if (!actualRef.current.conModal) posiciones[actualRef.current.key] = window.scrollY
    }
    window.addEventListener('scroll', guardar, { passive: true })
    return () => window.removeEventListener('scroll', guardar)
  }, [])

  // Layout effect: el salto ocurre antes de pintar la página nueva, no un
  // frame después con la anterior ya visible en otra posición.
  useLayoutEffect(() => {
    const prev = prevRef.current
    prevRef.current = { pathSinIdioma, pathname: location.pathname, key: location.key, conModal: !!background }
    if (prev.key === location.key) return
    // La posición de la página que se deja, tal como está justo ahora (antes
    // de cualquier salto); desde aquí, el scroll cuenta para la nueva entrada.
    if (!prev.conModal) posiciones[prev.key] = window.scrollY
    actualRef.current = { key: location.key, conModal: !!background }

    // Abrir un modal, o cerrarlo volviendo atrás: la página de fondo se queda.
    if (background || (navType === 'POP' && prev.conModal)) return

    // El teclado de iOS abierto (ej. tras escribir el teléfono) vuelve a
    // desplazar la página al cerrarse: se cierra antes de saltar.
    const activo = document.activeElement
    if (activo instanceof HTMLInputElement || activo instanceof HTMLTextAreaElement) activo.blur()

    if (navType === 'POP') return irA(posiciones[location.key] ?? 0)
    if (location.hash) return scrollToSection(location.hash.slice(1))
    if (prev.pathSinIdioma !== pathSinIdioma) return irA(0)
    if (prev.pathname === location.pathname) window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [pathSinIdioma, location.pathname, location.key, navType, background, location.hash])
}
