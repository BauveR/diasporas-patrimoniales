import { describe, it, expect, beforeEach } from 'vitest'
import { estadoReset, registrarEnvioReset, ESPERA_RESET_S, MAX_ENVIOS_RESET } from './limiteReset'

describe('límite de correos de recuperar contraseña', () => {
  beforeEach(() => sessionStorage.clear())

  it('sin envíos: se puede enviar ya', () => {
    expect(estadoReset(1_000)).toEqual({ envios: 0, esperaS: 0, agotado: false })
  })

  it(`tras un envío hay que esperar ${ESPERA_RESET_S} s`, () => {
    registrarEnvioReset(1_000)
    expect(estadoReset(1_000).esperaS).toBe(ESPERA_RESET_S)
    expect(estadoReset(1_000 + 30_000).esperaS).toBe(30)
    expect(estadoReset(1_000 + ESPERA_RESET_S * 1000).esperaS).toBe(0)
  })

  it(`al ${MAX_ENVIOS_RESET}º envío queda agotado`, () => {
    for (let i = 0; i < MAX_ENVIOS_RESET; i++) registrarEnvioReset(i * 100_000)
    expect(estadoReset(10_000_000).agotado).toBe(true)
  })
})
