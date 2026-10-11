import { describe, it, expect } from 'vitest'
import { evaluarContrasena } from './passwordPolicy'

describe('evaluarContrasena', () => {
  it('vacía: nada cumplido, débil', () => {
    const r = evaluarContrasena('')
    expect(r.requisitos).toEqual({ longitud: false, letra: false, numero: false })
    expect(r.valida).toBe(false)
    expect(r.fuerza).toBe('debil')
  })

  it.each([
    ['corta1', { longitud: false, letra: true, numero: true }],
    ['solamenteletras', { longitud: true, letra: true, numero: false }],
    ['1234567890', { longitud: true, letra: false, numero: true }],
  ])('%s no cumple todos los requisitos', (pass, requisitos) => {
    const r = evaluarContrasena(pass)
    expect(r.requisitos).toEqual(requisitos)
    expect(r.valida).toBe(false)
  })

  it('cuenta letras con acento y ñ como letras', () => {
    expect(evaluarContrasena('ñññññññ1').requisitos.letra).toBe(true)
    expect(evaluarContrasena('árbol2026').valida).toBe(true)
  })

  it.each(['Password1', 'contraseña123', 'Diasporas2026', 'a12345678', '87654321x', 'aaaaaaa1', '11111111a'])(
    '%s es demasiado común',
    pass => {
      const r = evaluarContrasena(pass)
      expect(r.comun).toBe(true)
      expect(r.valida).toBe(false)
    },
  )

  it('rechaza la que contiene la parte local del email', () => {
    const r = evaluarContrasena('mgarcia2026', 'MGarcia@ull.edu.es')
    expect(r.contieneEmail).toBe(true)
    expect(r.valida).toBe(false)
  })

  it('no salta con partes locales muy cortas', () => {
    expect(evaluarContrasena('banana2024', 'ana@ull.edu.es').contieneEmail).toBe(false)
  })

  it('común y email solo se evalúan cuando ya cumple los requisitos', () => {
    const r = evaluarContrasena('password', 'password@x.com')
    expect(r.comun).toBe(false)
    expect(r.contieneEmail).toBe(false)
  })

  it.each([
    ['viaje2canarias', 'fuerte'],
    ['Viaje-2-isla', 'fuerte'],
    ['libro2026', 'aceptable'],
    ['casaazul12', 'aceptable'],
  ])('%s → %s', (pass, fuerza) => {
    expect(evaluarContrasena(pass).fuerza).toBe(fuerza)
  })
})
