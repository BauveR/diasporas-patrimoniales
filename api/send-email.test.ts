import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { VercelRequest, VercelResponse } from '@vercel/node'

// Firestore en memoria: lo justo para el endpoint (get/set por ruta y una
// transacción que lee y escribe sobre el mismo mapa).
const docs = new Map<string, Record<string, unknown>>()
const enviados: unknown[] = []
let resendError: unknown = null

const snap = (ruta: string) => ({ exists: docs.has(ruta), data: () => docs.get(ruta) })
vi.mock('firebase-admin/firestore', () => ({
  getFirestore: () => ({
    doc: (ruta: string) => ({
      ruta,
      get: async () => snap(ruta),
      // set con merge; los { inc: n } de FieldValue.increment se suman.
      set: async (datos: Record<string, unknown>) => {
        const previo = docs.get(ruta) ?? {}
        const nuevo = { ...previo }
        for (const [k, v] of Object.entries(datos)) {
          nuevo[k] = v && typeof v === 'object' && 'inc' in v ? ((previo[k] as number) ?? 0) + (v as { inc: number }).inc : v
        }
        docs.set(ruta, nuevo)
      },
    }),
    runTransaction: async (fn: (tx: unknown) => Promise<unknown>) => fn({
      get: async (ref: { ruta: string }) => snap(ref.ruta),
      set: (ref: { ruta: string }, datos: Record<string, unknown>) => { docs.set(ref.ruta, datos) },
    }),
  }),
  FieldValue: { increment: (n: number) => ({ inc: n }) },
}))
vi.mock('firebase-admin/auth', () => ({
  getAuth: () => ({ verifyIdToken: async () => ({ uid: 'u1', email: 'ana@ull.edu.es', name: 'Ana' }) }),
}))
vi.mock('resend', () => ({
  Resend: class { emails = { send: async (m: unknown) => { enviados.push(m); return { error: resendError } } } },
}))
vi.mock('./_lib/firebaseAdmin.js', () => ({ getAdminApp: () => ({}) }))

const { default: handler, enviadosHoy, MAX_EMAILS_POR_DIA } = await import('./send-email.js')
const { diaDe } = await import('./_lib/dia.js')

function respuesta() {
  const res = { statusCode: 0 } as unknown as VercelResponse & { statusCode: number }
  res.status = (c: number) => { res.statusCode = c; return res }
  res.json = () => res
  res.setHeader = () => res
  return res
}

async function pedir() {
  const res = respuesta()
  await handler({ method: 'POST', body: { idToken: 't', actividadIds: [1] } } as VercelRequest, res)
  return res.statusCode
}

describe('api/send-email — tope diario', () => {
  beforeEach(() => {
    docs.clear()
    enviados.length = 0
    resendError = null
    process.env.RESEND_FROM_EMAIL = 'Diásporas <noreply@diasporaspatrimoniales.com>'
    docs.set('actividades/1', { id: 1, titulo: 'Jornada 1', fecha: '2026-11-12', hora: '09:00', duracion: '8h', contacto: 'x', sedeId: 1 })
    docs.set('actividades/1/inscritos/u1', { displayName: 'Ana García' })
    docs.set('sedes/1', { nombre: 'TEA', isla: 'Tenerife' })
    docs.set('users/u1', { role: 'user' })
  })

  it('enviadosHoy: solo cuenta los de hoy; los de otro día o sin día (antiguos de por vida) cuentan 0', () => {
    expect(enviadosHoy({ enviados: 2, dia: '2026-10-12' }, '2026-10-12')).toBe(2)
    expect(enviadosHoy({ enviados: 3, dia: '2026-10-11' }, '2026-10-12')).toBe(0)
    expect(enviadosHoy({ enviados: 3 }, '2026-10-12')).toBe(0)
    expect(enviadosHoy(undefined, '2026-10-12')).toBe(0)
  })

  it(`envía ${MAX_EMAILS_POR_DIA} al día y el siguiente devuelve 429`, async () => {
    for (let i = 0; i < MAX_EMAILS_POR_DIA; i++) expect(await pedir()).toBe(200)
    expect(await pedir()).toBe(429)
    expect(enviados).toHaveLength(MAX_EMAILS_POR_DIA)
    expect(docs.get('emailsConfirmacion/u1_1')).toEqual({ dia: diaDe(new Date()), enviados: MAX_EMAILS_POR_DIA })
  })

  it('al día siguiente vuelve a poder (contador de ayer agotado)', async () => {
    docs.set('emailsConfirmacion/u1_1', { dia: '2000-01-01', enviados: 3 })
    expect(await pedir()).toBe(200)
    expect(docs.get('emailsConfirmacion/u1_1')).toEqual({ dia: diaDe(new Date()), enviados: 1 })
  })

  it('los contadores antiguos de por vida (sin día) ya no bloquean', async () => {
    docs.set('emailsConfirmacion/u1_1', { enviados: 3 })
    expect(await pedir()).toBe(200)
  })

  it('el admin no tiene tope ni deja contador', async () => {
    docs.set('users/u1', { role: 'admin' })
    for (let i = 0; i < MAX_EMAILS_POR_DIA + 2; i++) expect(await pedir()).toBe(200)
    expect(docs.has('emailsConfirmacion/u1_1')).toBe(false)
  })

  it('si Resend falla, devuelve 502 y no gasta el cupo', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    resendError = { message: 'fallo' }
    expect(await pedir()).toBe(502)
    expect(docs.get('emailsConfirmacion/u1_1')?.enviados).toBe(0)
  })
})
