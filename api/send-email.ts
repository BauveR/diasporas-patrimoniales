import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { Resend } from 'resend'
import { getAdminApp } from './_lib/firebaseAdmin.js'
import { renderConfirmacionEmail, type DiaEmailData } from './_lib/emailTemplate.js'
import { PROGRAMA_DIA_1, PROGRAMA_DIA_2 } from '../src/data/programa.js'

type ActividadDoc = {
  id: number
  titulo: string
  fecha: string
  hora: string
  duracion: string
  contacto: string
  sedeId: number
}

// El evento tiene exactamente 2 actividades — una por jornada — así que id
// 1/2 identifican de forma estable qué agenda de programa.ts le corresponde
// a cada una. Mismo mapeo hardcodeado que ya usa ActividadExpandido.tsx en
// el sitio; sin match (no debería pasar hoy) el email simplemente no
// incluye agenda para esa actividad.
function getProgramaDia(actividadId: number) {
  if (actividadId === 1) return PROGRAMA_DIA_1
  if (actividadId === 2) return PROGRAMA_DIA_2
  return []
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'method_not_allowed' })
  }

  const { idToken, actividadIds } = (req.body ?? {}) as { idToken?: unknown; actividadIds?: unknown }
  const idsValidas = Array.isArray(actividadIds) && actividadIds.length > 0 && actividadIds.every(id => typeof id === 'number')
  if (typeof idToken !== 'string' || !idToken || !idsValidas) {
    return res.status(400).json({ error: 'invalid_body' })
  }
  const ids = actividadIds as number[]

  const app = getAdminApp()
  const auth = getAuth(app)
  const db = getFirestore(app)

  // El idToken prueba quién es el usuario; el resto del contenido del email
  // (título, fecha, sede...) se recalcula acá desde Firestore en vez de
  // confiar en lo que mande el cliente, para que este endpoint no pueda
  // usarse para mandar un email con datos arbitrarios.
  let uid: string
  let tokenEmail: string | undefined
  let tokenName: string | undefined
  try {
    const decoded = await auth.verifyIdToken(idToken)
    uid = decoded.uid
    tokenEmail = decoded.email
    tokenName = decoded.name
  } catch {
    return res.status(401).json({ error: 'invalid_token' })
  }

  if (!tokenEmail) {
    return res.status(400).json({ error: 'no_email' })
  }

  const snaps = await Promise.all(
    ids.map(id => Promise.all([
      db.doc(`actividades/${id}/inscritos/${uid}`).get(),
      db.doc(`actividades/${id}`).get(),
    ])),
  )

  if (snaps.some(([inscritoSnap]) => !inscritoSnap.exists)) {
    return res.status(403).json({ error: 'not_registered' })
  }
  if (snaps.some(([, actividadSnap]) => !actividadSnap.exists)) {
    return res.status(404).json({ error: 'actividad_not_found' })
  }

  const actividades = snaps.map(([, actividadSnap]) => actividadSnap.data() as ActividadDoc)
  const primeraInscrito = snaps[0][0]
  const sedeSnap = await db.doc(`sedes/${actividades[0].sedeId}`).get()
  const sede = sedeSnap.data() as { nombre?: string; isla?: string } | undefined

  const dias: DiaEmailData[] = actividades.map(actividad => ({
    titulo: actividad.titulo,
    fecha: new Date(actividad.fecha + 'T00:00:00').toLocaleDateString('es-ES', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    }),
    hora: actividad.hora,
    duracion: actividad.duracion,
    programa: getProgramaDia(actividad.id).map(item => ({
      hora: item.hora, titulo: item.titulo, moderador: item.moderador,
    })),
  }))

  const nombre = (primeraInscrito.data()?.displayName as string | undefined) || tokenName || 'participante'
  const primeraActividad = actividades[0]

  const { subject, html, text } = renderConfirmacionEmail({
    nombre,
    dias,
    contacto: primeraActividad.contacto,
    sedeNombre: sede?.nombre,
    sedeIsla: sede?.isla,
  })

  const resend = new Resend(process.env.RESEND_API_KEY)
  const from = process.env.RESEND_FROM_EMAIL
  if (!from) {
    return res.status(500).json({ error: 'missing_sender_config' })
  }

  const { error } = await resend.emails.send({ from, to: tokenEmail, subject, html, text })
  if (error) {
    // No se expone al cliente (podría filtrar detalles del proveedor), pero
    // sin esto el 502 queda sin ninguna pista en los Runtime Logs.
    console.error('resend.emails.send failed:', error)
    return res.status(502).json({ error: 'email_send_failed' })
  }

  return res.status(200).json({ ok: true })
}
