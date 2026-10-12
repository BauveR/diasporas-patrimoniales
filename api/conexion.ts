import type { VercelRequest, VercelResponse } from '@vercel/node'
import { FieldValue, getFirestore } from 'firebase-admin/firestore'
import { getAdminApp } from './_lib/firebaseAdmin.js'
import { diaDe } from './_lib/dia.js'

export { diaDe }

// Contador anónimo de problemas de conexión con Firestore (ver
// src/lib/conexion.ts): lo manda el navegador cuando activa el modo
// compatible o muestra el aviso. Vive en nuestro dominio a propósito —
// llega aunque la red bloquee los servicios de Google, que es justo lo que
// se quiere medir. Sin datos personales: ni IP, ni email, ni cookies; solo
// "pasó este evento tal día". El panel admin (EstadoConexion) lo lee.
export const EVENTOS_CONEXION = ['modo_compatible', 'recuperado', 'sin_conexion'] as const
export type EventoConexion = typeof EVENTOS_CONEXION[number]

// Cada llamada es una escritura en Firestore, y este endpoint no lleva
// sesión (tiene que funcionar justo cuando Firebase no carga). Sin límites,
// un script podía llamarlo en bucle y gastar las 20.000 escrituras diarias
// del plan gratuito — y con ellas, las inscripciones de ese día. Dos
// barreras baratas, sin lecturas extra:
//  1. Solo desde la propia web (cabecera Origin/Referer del navegador).
//  2. Por IP, como mucho MAX_POR_IP avisos cada VENTANA_MS. Una pestaña
//     normal manda 1–3 en toda la visita. El contador vive en memoria de la
//     instancia de Vercel: no es exacto entre instancias, pero corta bucles.
const ORIGENES_PERMITIDOS = [
  /^https:\/\/(www\.)?diasporaspatrimoniales\.com$/,
  /^https:\/\/[a-z0-9-]+\.vercel\.app$/,
  /^http:\/\/localhost(:\d+)?$/,
]
export const MAX_POR_IP = 6
export const VENTANA_MS = 10 * 60_000
const porIp = new Map<string, { n: number; desde: number }>()

export function origenPermitido(origin: string | undefined, referer: string | undefined): boolean {
  let o = origin
  if (!o && referer) {
    try { o = new URL(referer).origin } catch { o = undefined }
  }
  return !!o && ORIGENES_PERMITIDOS.some(re => re.test(o))
}

export function dentroDelLimite(ip: string, ahora = Date.now()): boolean {
  // Limpieza simple para que el mapa no crezca sin fin en una instancia larga.
  if (porIp.size > 5_000) porIp.clear()
  const r = porIp.get(ip)
  if (!r || ahora - r.desde > VENTANA_MS) {
    porIp.set(ip, { n: 1, desde: ahora })
    return true
  }
  r.n++
  return r.n <= MAX_POR_IP
}

function ipDe(req: VercelRequest): string {
  const xff = req.headers['x-forwarded-for']
  const primera = (Array.isArray(xff) ? xff[0] : xff)?.split(',')[0]?.trim()
  return primera || (req.headers['x-real-ip'] as string | undefined) || 'desconocida'
}

export function esEventoValido(evento: unknown): evento is EventoConexion {
  return typeof evento === 'string' && (EVENTOS_CONEXION as readonly string[]).includes(evento)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'method_not_allowed' })
  }

  if (!origenPermitido(req.headers.origin as string | undefined, req.headers.referer as string | undefined)) {
    return res.status(403).json({ error: 'forbidden_origin' })
  }
  if (!dentroDelLimite(ipDe(req))) {
    return res.status(429).json({ error: 'rate_limited' })
  }

  // sendBeacon manda el cuerpo como texto aunque sea JSON.
  let body: unknown = req.body
  if (typeof body === 'string') {
    try { body = JSON.parse(body) } catch { body = null }
  }
  const evento = (body as { evento?: unknown } | null)?.evento
  if (!esEventoValido(evento)) return res.status(400).json({ error: 'invalid_body' })

  const db = getFirestore(getAdminApp())
  // Un documento por día, un campo por evento: una escritura por incidente.
  // Las reglas solo dejan leerlo al admin; escribir, solo este endpoint.
  await db.doc(`telemetriaConexion/${diaDe(new Date())}`).set(
    { [evento]: FieldValue.increment(1) },
    { merge: true },
  )
  return res.status(204).end()
}
