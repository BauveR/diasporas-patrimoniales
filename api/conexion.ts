import type { VercelRequest, VercelResponse } from '@vercel/node'
import { FieldValue, getFirestore } from 'firebase-admin/firestore'
import { getAdminApp } from './_lib/firebaseAdmin.js'

// Contador anónimo de problemas de conexión con Firestore (ver
// src/lib/conexion.ts): lo manda el navegador cuando activa el modo
// compatible o muestra el aviso. Vive en nuestro dominio a propósito —
// llega aunque la red bloquee los servicios de Google, que es justo lo que
// se quiere medir. Sin datos personales: ni IP, ni email, ni cookies; solo
// "pasó este evento tal día". El panel admin (EstadoConexion) lo lee.
export const EVENTOS_CONEXION = ['modo_compatible', 'recuperado', 'sin_conexion'] as const
export type EventoConexion = typeof EVENTOS_CONEXION[number]

export function esEventoValido(evento: unknown): evento is EventoConexion {
  return typeof evento === 'string' && (EVENTOS_CONEXION as readonly string[]).includes(evento)
}

// Fecha en Canarias (Atlantic/Canary) — el día "de hoy" que verá el admin.
export function diaDe(fecha: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Atlantic/Canary' }).format(fecha)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'method_not_allowed' })
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
