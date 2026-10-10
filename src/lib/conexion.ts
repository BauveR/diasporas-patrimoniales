// Redes de universidades/administraciones: sus proxies a menudo cortan las
// conexiones largas que usa Firestore para el tiempo real, y entonces los
// datos simplemente no llegan — sin error, el SDK sigue reintentando en
// silencio. Este módulo no importa Firebase a propósito: tiene que poder
// usarse aunque el propio chunk de Firebase sea lo que no cargó.

// Mensajes progresivos, como Gmail/Slack: primero "está tardando más de lo
// normal" (sin alarmar — en un móvil lento los datos suelen llegar igual),
// y recién a TIMEOUT_CONEXION_MS se da por fallido. Si Firestore declara
// antes que está offline, el fallo se trata en el momento.
export const AVISO_LENTO_MS = 8_000
export const TIMEOUT_CONEXION_MS = 20_000

const MODO_COMPATIBLE_KEY = 'firestore_modo_compatible'
const MODO_COMPATIBLE_INTENTADO_KEY = 'firestore_modo_compatible_intentado'
const REPORTADOS_KEY = 'conexion_reportados'

// Aviso anónimo a /api/conexion (nuestro dominio — llega aunque Google esté
// bloqueado) para que el panel admin muestre cuánta gente necesita el modo
// compatible. sendBeacon: sobrevive a la recarga que viene justo después.
// Como mucho una vez por evento y pestaña, para no inflar el contador.
export type EventoConexion = 'modo_compatible' | 'recuperado' | 'sin_conexion'

export function reportarConexion(evento: EventoConexion) {
  const reportados = (leer(() => sessionStorage, REPORTADOS_KEY) ?? '').split(',')
  if (reportados.includes(evento)) return
  escribir(() => sessionStorage, REPORTADOS_KEY, [...reportados.filter(Boolean), evento].join(','))
  try {
    const cuerpo = JSON.stringify({ evento })
    if (navigator.sendBeacon?.('/api/conexion', new Blob([cuerpo], { type: 'application/json' }))) return
    fetch('/api/conexion', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: cuerpo, keepalive: true }).catch(() => {})
  } catch { /* medir nunca debe romper la página */ }
}
const ULTIMA_RECARGA_KEY = 'recarga_automatica_en'

function leer(storage: () => Storage, key: string): string | null {
  try { return storage().getItem(key) } catch { return null }
}

function escribir(storage: () => Storage, key: string, value: string) {
  try { storage().setItem(key, value) } catch { /* modo privado, almacenamiento bloqueado */ }
}

// "Modo compatible": long polling forzado (lib/firebase.ts) — atraviesa
// mejor los proxies que el streaming normal, pero es más lento, así que
// solo se activa en la pestaña que ya falló. sessionStorage y no
// localStorage: quien lo activó en la red de la universidad vuelve al modo
// normal en la siguiente visita (ej. desde casa), en vez de quedar en el
// lento para siempre.
export function modoCompatibleActivo(): boolean {
  return leer(() => sessionStorage, MODO_COMPATIBLE_KEY) === '1'
}

// La instancia de Firestore se crea una sola vez, así que cambiar de
// transporte exige recargar la página.
function recargarEnModoCompatible() {
  escribir(() => sessionStorage, MODO_COMPATIBLE_KEY, '1')
  escribir(() => sessionStorage, MODO_COMPATIBLE_INTENTADO_KEY, '1')
  window.location.reload()
}

// Primer fallo de conexión de la pestaña: cambia sola a modo compatible y
// recarga, sin esperar a que la persona lea el aviso y pulse nada (el mismo
// patrón que Socket.IO/SignalR: si el transporte rápido no pasa, se cae al
// de peticiones cortas). Una sola vez por pestaña — si en modo compatible
// también falla, devuelve false y la UI muestra ConexionError.
export function cambiarAModoCompatibleAutomatico(): boolean {
  if (modoCompatibleActivo()) {
    reportarConexion('sin_conexion')
    return false
  }
  if (leer(() => sessionStorage, MODO_COMPATIBLE_INTENTADO_KEY) === '1') {
    reportarConexion('sin_conexion')
    return false
  }
  reportarConexion('modo_compatible')
  recargarEnModoCompatible()
  return true
}

// Los datos llegaron estando en modo compatible: el cambio sirvió.
export function reportarSiRecuperado() {
  if (modoCompatibleActivo()) reportarConexion('recuperado')
}

// Botón "Reintentar" de ConexionError: recarga en modo compatible (si ya lo
// estaba, simplemente vuelve a intentar).
export function reintentarEnModoCompatible() {
  recargarEnModoCompatible()
}

// Tras un deploy, quien tenía la web abierta pide chunks con hashes que ya
// no existen. Recarga una vez para traer la versión nueva — sin repetir si
// la recarga anterior fue hace menos de 30 s (evita un bucle si el fallo es
// otro, ej. sin conexión).
export function recargarPorVersionNueva(ahora = Date.now()): boolean {
  const ultima = Number(leer(() => sessionStorage, ULTIMA_RECARGA_KEY) ?? 0)
  if (ahora - ultima < 30_000) return false
  escribir(() => sessionStorage, ULTIMA_RECARGA_KEY, String(ahora))
  window.location.reload()
  return true
}

// Mensajes con los que fallan los import() dinámicos según el navegador.
export function esErrorDeCargaDeModulo(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error)
  return /Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed|Unable to preload CSS/i.test(msg)
}

// Últimos N días como 'YYYY-MM-DD' en hora de Canarias — el mismo formato
// con el que api/conexion.ts nombra cada documento diario de contadores.
export function ultimosDias(n: number, hoy = new Date()): string[] {
  const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'Atlantic/Canary' })
  return Array.from({ length: n }, (_, i) => fmt.format(new Date(hoy.getTime() - i * 86_400_000)))
}
