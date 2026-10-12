import type { InscripcionPendiente } from './inscripcionPendiente'

// El login de Google por redirección (navegadores de iPhone que no son
// Safari — ver utils/navegadorIntegrado.ts) recarga la página al volver de
// Google, y con ella se pierde todo lo que AuthPage sabía en memoria: a
// dónde ir después (la jornada desde "Inscribirme", la página protegida que
// se pedía, o la bienvenida) y la marca de inscripción pendiente. Se guarda
// aquí justo antes de salir hacia Google y se recupera una sola vez al volver.

export type DestinoTrasLogin =
  | { tipo: 'returnTo'; ruta: string }
  | { tipo: 'bienvenida' }
  | { tipo: 'volver'; ruta: string | null }

type Pendiente = { destino: DestinoTrasLogin; inscripcion: InscripcionPendiente | null; en: number }

const CLAVE = 'login_google_redireccion'
// Más que esto entre salir y volver de Google = una marca olvidada (se
// cerró la pestaña a medias), no un login en curso.
const CADUCA_MS = 15 * 60_000

export function guardarLoginGooglePendiente(destino: DestinoTrasLogin, inscripcion: InscripcionPendiente | null) {
  try {
    sessionStorage.setItem(CLAVE, JSON.stringify({ destino, inscripcion, en: Date.now() } satisfies Pendiente))
  } catch {
    // Sin sessionStorage: al volver irá a la bienvenida, no se rompe nada.
  }
}

// Hay un login por redirección a medio terminar en esta pestaña (sin
// consumirlo: la pantalla decide si mostrar "Entrando…").
export function hayLoginGooglePendiente(): boolean {
  return leer() !== null
}

// Lo devuelve y lo borra: solo se completa una vez.
export function consumirLoginGooglePendiente(): Omit<Pendiente, 'en'> | null {
  const p = leer()
  try { sessionStorage.removeItem(CLAVE) } catch { /* nada */ }
  return p ? { destino: p.destino, inscripcion: p.inscripcion } : null
}

function leer(): Pendiente | null {
  try {
    const crudo = sessionStorage.getItem(CLAVE)
    if (!crudo) return null
    const p = JSON.parse(crudo) as Pendiente
    if (typeof p?.en !== 'number' || Date.now() - p.en > CADUCA_MS) return null
    return p
  } catch {
    return null
  }
}
