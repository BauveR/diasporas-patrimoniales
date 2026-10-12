import { describe, it, expect, vi, afterEach } from 'vitest'
import { enviarCorreoConfirmacion } from './correoConfirmacion'

const user = { getIdToken: async () => 'token' }

describe('enviarCorreoConfirmacion', () => {
  afterEach(() => vi.unstubAllGlobals())

  it.each([[200, true], [429, false], [502, false]])('respuesta %i → %s', async (status, esperado) => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.stubGlobal('fetch', async () => ({ ok: status < 300, status }))
    expect(await enviarCorreoConfirmacion(user, [1])).toBe(esperado)
  })

  it('sin red → false (no lanza)', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.stubGlobal('fetch', async () => { throw new TypeError('Failed to fetch') })
    expect(await enviarCorreoConfirmacion(user, [1, 2])).toBe(false)
  })
})
