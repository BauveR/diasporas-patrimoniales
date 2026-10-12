import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { guardarLoginGooglePendiente, hayLoginGooglePendiente, consumirLoginGooglePendiente } from './loginGoogleRedireccion'

describe('login de Google por redirección: destino guardado', () => {
  beforeEach(() => sessionStorage.clear())
  afterEach(() => vi.useRealTimers())

  it('guarda el destino y la inscripción pendiente, y se consume una sola vez', () => {
    guardarLoginGooglePendiente({ tipo: 'volver', ruta: '/en/actividades/1' }, 1)
    expect(hayLoginGooglePendiente()).toBe(true)
    expect(consumirLoginGooglePendiente()).toEqual({ destino: { tipo: 'volver', ruta: '/en/actividades/1' }, inscripcion: 1 })
    expect(hayLoginGooglePendiente()).toBe(false)
    expect(consumirLoginGooglePendiente()).toBeNull()
  })

  it('caduca a los 15 minutos (pestaña cerrada a medias)', () => {
    vi.useFakeTimers()
    guardarLoginGooglePendiente({ tipo: 'bienvenida' }, null)
    vi.advanceTimersByTime(16 * 60_000)
    expect(hayLoginGooglePendiente()).toBe(false)
    expect(consumirLoginGooglePendiente()).toBeNull()
  })

  it('un valor corrupto no rompe nada', () => {
    sessionStorage.setItem('login_google_redireccion', '{no es json')
    expect(hayLoginGooglePendiente()).toBe(false)
    expect(consumirLoginGooglePendiente()).toBeNull()
  })
})
