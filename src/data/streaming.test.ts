import { describe, expect, it } from 'vitest'
import { SESIONES_STREAMING, estadoSesion, idiomaStreamingPorDefecto, tiempoRestante } from './streaming'

const [primera] = SESIONES_STREAMING

describe('streaming', () => {
  it('PT cae a la versión inglesa; el resto usa su propio idioma', () => {
    expect(idiomaStreamingPorDefecto('pt')).toBe('en')
    expect(idiomaStreamingPorDefecto('es')).toBe('es')
    expect(idiomaStreamingPorDefecto('fr')).toBe('fr')
  })

  it('estado según la hora: programada → directo (con margen) → finalizada', () => {
    const inicio = Date.parse(primera.inicio)
    const fin = Date.parse(primera.fin)
    expect(estadoSesion(primera, inicio - 60 * 60_000)).toBe('programada')
    expect(estadoSesion(primera, inicio - 10 * 60_000)).toBe('directo')
    expect(estadoSesion(primera, fin + 20 * 60_000)).toBe('directo')
    expect(estadoSesion(primera, fin + 31 * 60_000)).toBe('finalizada')
  })

  it('cuenta atrás en días/horas/minutos y null una vez empezada', () => {
    const inicio = Date.parse(primera.inicio)
    expect(tiempoRestante(primera.inicio, inicio - (26 * 60 + 5) * 60_000)).toEqual({ dias: 1, horas: 2, minutos: 5 })
    expect(tiempoRestante(primera.inicio, inicio)).toBeNull()
  })

  it('cada sesión tiene los 3 idiomas con ids distintos', () => {
    const ids = SESIONES_STREAMING.flatMap(s => Object.values(s.videos))
    expect(ids).toHaveLength(12)
    expect(new Set(ids).size).toBe(12)
  })
})
