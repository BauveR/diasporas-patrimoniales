import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { VercelRequest, VercelResponse } from '@vercel/node'

const set = vi.fn()
vi.mock('firebase-admin/firestore', () => ({
  getFirestore: () => ({ doc: (ruta: string) => ({ set: (...args: unknown[]) => set(ruta, ...args) }) }),
  FieldValue: { increment: (n: number) => ({ increment: n }) },
}))
vi.mock('./_lib/firebaseAdmin.js', () => ({ getAdminApp: () => ({}) }))

const { default: handler, esEventoValido, diaDe } = await import('./conexion.js')

function respuesta() {
  const res = { statusCode: 0, headers: {} as Record<string, string> } as unknown as VercelResponse & { statusCode: number }
  res.status = (c: number) => { res.statusCode = c; return res }
  res.json = () => res
  res.end = () => res
  res.setHeader = () => res
  return res
}

describe('api/conexion', () => {
  beforeEach(() => set.mockReset())

  it('solo acepta los tres eventos conocidos', () => {
    expect(esEventoValido('modo_compatible')).toBe(true)
    expect(esEventoValido('sin_conexion')).toBe(true)
    expect(esEventoValido('recuperado')).toBe(true)
    expect(esEventoValido('__proto__')).toBe(false)
    expect(esEventoValido({ evento: 'x' })).toBe(false)
  })

  it('el día se calcula en hora de Canarias', () => {
    // 23:30 UTC del 31/12 = 23:30 en Canarias en invierno → sigue siendo 31/12
    expect(diaDe(new Date('2026-12-31T23:30:00Z'))).toBe('2026-12-31')
    // 23:30 UTC del 30/6 = 00:30 del 1/7 en Canarias (verano, UTC+1)
    expect(diaDe(new Date('2026-06-30T23:30:00Z'))).toBe('2026-07-01')
  })

  it('suma 1 al contador del día (cuerpo JSON o texto de sendBeacon)', async () => {
    for (const body of [{ evento: 'modo_compatible' }, JSON.stringify({ evento: 'modo_compatible' })]) {
      const res = respuesta()
      await handler({ method: 'POST', body } as VercelRequest, res)
      expect(res.statusCode).toBe(204)
    }
    expect(set).toHaveBeenCalledTimes(2)
    const [ruta, datos, opciones] = set.mock.calls[0]
    expect(ruta).toMatch(/^telemetriaConexion\/\d{4}-\d{2}-\d{2}$/)
    expect(datos).toEqual({ modo_compatible: { increment: 1 } })
    expect(opciones).toEqual({ merge: true })
  })

  it('rechaza eventos desconocidos y otros métodos sin escribir nada', async () => {
    const malo = respuesta()
    await handler({ method: 'POST', body: { evento: 'borrar_todo' } } as VercelRequest, malo)
    expect(malo.statusCode).toBe(400)
    const get = respuesta()
    await handler({ method: 'GET' } as VercelRequest, get)
    expect(get.statusCode).toBe(405)
    expect(set).not.toHaveBeenCalled()
  })
})
