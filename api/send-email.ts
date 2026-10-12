import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getAuth } from 'firebase-admin/auth'
import { FieldValue, getFirestore } from 'firebase-admin/firestore'
import { Resend } from 'resend'
import { getAdminApp } from './_lib/firebaseAdmin.js'
import { renderConfirmacionEmail, IDIOMAS_EMAIL, type DiaEmailData, type IdiomaEmail } from './_lib/emailTemplate.js'
import { diaDe } from './_lib/dia.js'
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
// Tope de emails de confirmación por usuario y actividad, POR DÍA (hora de
// Canarias) — no por inscripción: el contador vive en
// emailsConfirmacion/{uid}_{id} (fuera de inscritos/, que se borra al
// liberar plaza), así que darse de baja y volver a inscribirse en bucle no
// lo resetea. Sin esto, cualquiera con una cuenta email/contraseña (sin
// verificar) podía registrarse con el correo de otra persona y llamar a
// este endpoint sin límite para llenarle la bandeja (y gastar la cuota de
// Resend). Antes era de por vida y bloqueaba las pruebas del admin; por día
// sigue acotando el abuso (6 correos/día como mucho a una dirección, una
// cuenta por email en Firebase). El admin no tiene tope. Las reglas de
// Firestore no abren esta colección al cliente (catch-all `if false`), así
// que solo este endpoint (Admin SDK) puede leer/escribir el contador.
export const MAX_EMAILS_POR_DIA = 3

// Envíos ya hechos HOY según el contador guardado. Uno de otro día — o de
// antes de que se guardara el día (contadores de por vida) — cuenta como 0.
export function enviadosHoy(datos: { enviados?: number; dia?: string } | undefined, hoy: string): number {
  return datos?.dia === hoy ? (datos.enviados ?? 0) : 0
}

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

  const { idToken, actividadIds, idioma: idiomaPedido } = (req.body ?? {}) as { idToken?: unknown; actividadIds?: unknown; idioma?: unknown }
  // El idioma en que se hizo la inscripción (la web lo manda); cualquier otro
  // valor, en español.
  const idioma: IdiomaEmail = IDIOMAS_EMAIL.includes(idiomaPedido as IdiomaEmail) ? idiomaPedido as IdiomaEmail : 'es'
  const etiquetaFecha = { es: 'es-ES', en: 'en-GB', fr: 'fr-FR', pt: 'pt-PT' }[idioma]
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

  const [snaps, userSnap] = await Promise.all([
    Promise.all(
      ids.map(id => Promise.all([
        db.doc(`actividades/${id}/inscritos/${uid}`).get(),
        db.doc(`actividades/${id}`).get(),
      ])),
    ),
    db.doc(`users/${uid}`).get(),
  ])
  const esAdmin = userSnap.data()?.role === 'admin'

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
    fecha: new Date(actividad.fecha + 'T00:00:00').toLocaleDateString(etiquetaFecha, {
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
    idioma,
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

  // Reserva el envío en una transacción ANTES de mandar: dos llamadas en
  // paralelo no pueden colarse las dos por debajo del tope. El admin no
  // reserva nada (sin tope, para poder probar).
  const contadorRefs = ids.map(id => db.doc(`emailsConfirmacion/${uid}_${id}`))
  if (!esAdmin) {
    const hoy = diaDe(new Date())
    const permitido = await db.runTransaction(async tx => {
      const contadores = await Promise.all(contadorRefs.map(ref => tx.get(ref)))
      const previos = contadores.map(snap => enviadosHoy(snap.data() as { enviados?: number; dia?: string } | undefined, hoy))
      if (previos.some(n => n >= MAX_EMAILS_POR_DIA)) return false
      contadorRefs.forEach((ref, i) => tx.set(ref, { dia: hoy, enviados: previos[i] + 1 }))
      return true
    })
    if (!permitido) {
      return res.status(429).json({ error: 'email_limit_reached' })
    }
  }

  const { error } = await resend.emails.send({ from, to: tokenEmail, subject, html, text })
  if (error) {
    // No se expone al cliente (podría filtrar detalles del proveedor), pero
    // sin esto el 502 queda sin ninguna pista en los Runtime Logs.
    console.error('resend.emails.send failed:', error)
    // El email no salió — devolver la reserva para que no cuente contra el tope.
    if (!esAdmin) {
      await Promise.all(contadorRefs.map(ref => ref.set({ enviados: FieldValue.increment(-1) }, { merge: true })))
        .catch(err => console.error('no se pudo devolver la reserva de email:', err))
    }
    return res.status(502).json({ error: 'email_send_failed' })
  }

  return res.status(200).json({ ok: true })
}
