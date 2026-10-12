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

  it('manda el idioma activo para que el correo salga en ese idioma', async () => {
    const { default: i18n } = await import('../i18n/config')
    await i18n.changeLanguage('fr')
    let cuerpo: Record<string, unknown> = {}
    vi.stubGlobal('fetch', async (_u: string, init: { body: string }) => { cuerpo = JSON.parse(init.body); return { ok: true, status: 200 } })
    await enviarCorreoConfirmacion(user, [2])
    expect(cuerpo).toMatchObject({ actividadIds: [2], idioma: 'fr' })
    await i18n.changeLanguage('es')
  })
})
