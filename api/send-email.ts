import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { Resend } from 'resend'
import { getAdminApp } from './_lib/firebaseAdmin.js'
import { renderConfirmacionEmail } from './_lib/emailTemplate.js'

type ActividadDoc = {
  titulo: string
  fecha: string
  hora: string
  duracion: string
  puntoEncuentro: string
  organizador: string
  contacto: string
  sedeId: number
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'method_not_allowed' })
  }

  const { idToken, actividadId } = (req.body ?? {}) as { idToken?: unknown; actividadId?: unknown }
  if (typeof idToken !== 'string' || !idToken || typeof actividadId !== 'number') {
    return res.status(400).json({ error: 'invalid_body' })
  }

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

  const inscritoRef = db.doc(`actividades/${actividadId}/inscritos/${uid}`)
  const actividadRef = db.doc(`actividades/${actividadId}`)
  const [inscritoSnap, actividadSnap] = await Promise.all([inscritoRef.get(), actividadRef.get()])

  if (!inscritoSnap.exists) {
    return res.status(403).json({ error: 'not_registered' })
  }
  if (!actividadSnap.exists) {
    return res.status(404).json({ error: 'actividad_not_found' })
  }

  const actividad = actividadSnap.data() as ActividadDoc
  const sedeSnap = await db.doc(`sedes/${actividad.sedeId}`).get()
  const sede = sedeSnap.data() as { nombre?: string; isla?: string } | undefined

  const fechaStr = new Date(actividad.fecha + 'T00:00:00').toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const nombre = (inscritoSnap.data()?.displayName as string | undefined) || tokenName || 'participante'

  const { subject, html, text } = renderConfirmacionEmail({
    nombre,
    titulo: actividad.titulo,
    fecha: fechaStr,
    hora: actividad.hora,
    duracion: actividad.duracion,
    puntoEncuentro: actividad.puntoEncuentro,
    organizador: actividad.organizador,
    contacto: actividad.contacto,
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
