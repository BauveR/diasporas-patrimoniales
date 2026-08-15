import { describe, it, expect, beforeEach } from 'vitest'
import {
  inscribirse,
  liberarPlaza,
  acreditar,
  getInscritos,
  subscribeActividades,
  SinPlazasError,
  EventoCanceladoError,
  InscripcionNoAbiertaError,
  YaLiberadaError,
  TokenInvalidoError,
  __resetMockDb,
} from './db'
import { ACTIVIDADES } from '../data/actividades'

// The mock store is module-level (not per-test), matching the real Firestore
// backend it stands in for — reset explicitly between tests instead of
// re-importing the module, so subscribers set up elsewhere in the app during
// a test run keep seeing the same store.
beforeEach(() => {
  __resetMockDb()
})

function firstAbierta(): number {
  const today = new Date().toISOString().slice(0, 10)
  const actividad = ACTIVIDADES.find(
    a => !a.cancelada && a.plazasDisponibles > 0 && (!a.fechaAperturaInscripciones || a.fechaAperturaInscripciones <= today),
  )
  if (!actividad) throw new Error('fixture data has no open actividad to test against')
  return actividad.id
}

describe('inscribirse', () => {
  it('decrementa plazasDisponibles al inscribirse', async () => {
    const id = firstAbierta()
    const before = ACTIVIDADES.find(a => a.id === id)!.plazasDisponibles

    await inscribirse(id, 'uid-1', 'a@b.com', 'Ana', '600000000')

    let seen: number | undefined
    subscribeActividades(items => {
      seen = items.find(a => a.id === id)?.plazasDisponibles
    })
    expect(seen).toBe(before - 1)
  })

  it('una segunda inscripción del mismo usuario es un no-op', async () => {
    const id = firstAbierta()
    await inscribirse(id, 'uid-1', 'a@b.com', 'Ana', '600000000')
    await inscribirse(id, 'uid-1', 'a@b.com', 'Ana', '600000000')

    let seen: number | undefined
    subscribeActividades(items => {
      seen = items.find(a => a.id === id)?.plazasDisponibles
    })
    const before = ACTIVIDADES.find(a => a.id === id)!.plazasDisponibles
    expect(seen).toBe(before - 1)
  })

  it('lanza SinPlazasError cuando no quedan plazas', async () => {
    const id = firstAbierta()
    const actividad = ACTIVIDADES.find(a => a.id === id)!
    for (let i = 0; i < actividad.plazasDisponibles; i++) {
      await inscribirse(id, `uid-${i}`, `u${i}@b.com`, `U${i}`, '600000000')
    }
    await expect(inscribirse(id, 'uid-last', 'x@b.com', 'X', '600000000')).rejects.toBeInstanceOf(SinPlazasError)
  })

  it('lanza EventoCanceladoError cuando la actividad está cancelada', async () => {
    const cancelada = ACTIVIDADES.find(a => a.cancelada)
    if (!cancelada) return // no hay fixture cancelada — nada que probar aquí
    await expect(
      inscribirse(cancelada.id, 'uid-1', 'a@b.com', 'Ana', '600000000'),
    ).rejects.toBeInstanceOf(EventoCanceladoError)
  })

  it('lanza InscripcionNoAbiertaError cuando la apertura es futura', async () => {
    const futura = ACTIVIDADES.find(
      a => a.fechaAperturaInscripciones && a.fechaAperturaInscripciones > new Date().toISOString().slice(0, 10),
    )
    if (!futura) return // no hay fixture con apertura futura — nada que probar aquí
    await expect(
      inscribirse(futura.id, 'uid-1', 'a@b.com', 'Ana', '600000000'),
    ).rejects.toBeInstanceOf(InscripcionNoAbiertaError)
  })
})

describe('liberarPlaza', () => {
  it('incrementa plazasDisponibles al liberar', async () => {
    const id = firstAbierta()
    const before = ACTIVIDADES.find(a => a.id === id)!.plazasDisponibles

    await inscribirse(id, 'uid-1', 'a@b.com', 'Ana', '600000000')
    await liberarPlaza(id, 'uid-1')

    let seen: number | undefined
    subscribeActividades(items => {
      seen = items.find(a => a.id === id)?.plazasDisponibles
    })
    expect(seen).toBe(before)
  })

  it('nunca supera el máximo de plazas', async () => {
    const id = firstAbierta()
    const plazas = ACTIVIDADES.find(a => a.id === id)!.plazas

    await inscribirse(id, 'uid-1', 'a@b.com', 'Ana', '600000000')
    await liberarPlaza(id, 'uid-1')
    // liberar de nuevo debería fallar (ya no está inscrito) — el tope importa
    // sobre todo si la actividad ya estaba a plazas completas antes del test.
    await expect(liberarPlaza(id, 'uid-1')).rejects.toBeInstanceOf(YaLiberadaError)

    let seen: number | undefined
    subscribeActividades(items => {
      seen = items.find(a => a.id === id)?.plazasDisponibles
    })
    expect(seen).toBeLessThanOrEqual(plazas)
  })

  it('lanza YaLiberadaError si no había inscripción', async () => {
    const id = firstAbierta()
    await expect(liberarPlaza(id, 'uid-nunca-inscrito')).rejects.toBeInstanceOf(YaLiberadaError)
  })
})

describe('acreditar', () => {
  it('acredita un token válido y devuelve los datos del inscrito', async () => {
    const id = firstAbierta()
    await inscribirse(id, 'uid-1', 'a@b.com', 'Ana', '600000000')
    const [inscrito] = await getInscritos(id)

    const result = await acreditar(inscrito.token)

    expect(result).toEqual({ displayName: 'Ana', actividadId: id, yaAcreditado: false })
    const [actualizado] = await getInscritos(id)
    expect(actualizado.acreditado).toBe(true)
    expect(actualizado.acreditadoEn).toBeInstanceOf(Date)
  })

  it('un segundo escaneo del mismo token no es un error — devuelve yaAcreditado', async () => {
    const id = firstAbierta()
    await inscribirse(id, 'uid-1', 'a@b.com', 'Ana', '600000000')
    const [inscrito] = await getInscritos(id)

    await acreditar(inscrito.token)
    const result = await acreditar(inscrito.token)

    expect(result.yaAcreditado).toBe(true)
  })

  it('lanza TokenInvalidoError con un token desconocido', async () => {
    await expect(acreditar('token-que-no-existe')).rejects.toBeInstanceOf(TokenInvalidoError)
  })

  it('invalida el token al liberar la plaza — un ticket cancelado no debe acreditar', async () => {
    const id = firstAbierta()
    await inscribirse(id, 'uid-1', 'a@b.com', 'Ana', '600000000')
    const [inscrito] = await getInscritos(id)
    await liberarPlaza(id, 'uid-1')

    await expect(acreditar(inscrito.token)).rejects.toBeInstanceOf(TokenInvalidoError)
  })
})
