import { describe, it, expect, beforeEach } from 'vitest'
import {
  inscribirse,
  liberarPlaza,
  acreditar,
  getInscritos,
  subscribeActividades,
  addActividad,
  SinPlazasError,
  EventoCanceladoError,
  InscripcionNoAbiertaError,
  YaLiberadaError,
  TokenInvalidoError,
  __resetMockDb,
} from './db'
import { ACTIVIDADES } from '../data/actividades'
import { SEDES } from '../data/sedes'

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

    expect(result.displayName).toBe('Ana')
    expect(result.actividadId).toBe(id)
    expect(result.yaAcreditado).toBe(false)
    expect(result.acreditadoEn).toBeInstanceOf(Date)
    const [actualizado] = await getInscritos(id)
    expect(actualizado.acreditado).toBe(true)
    expect(actualizado.acreditadoEn).toBeInstanceOf(Date)
  })

  it('un segundo escaneo del mismo token no es un error — devuelve yaAcreditado con la hora del primer escaneo', async () => {
    const id = firstAbierta()
    await inscribirse(id, 'uid-1', 'a@b.com', 'Ana', '600000000')
    const [inscrito] = await getInscritos(id)

    const primero = await acreditar(inscrito.token)
    const segundo = await acreditar(inscrito.token)

    expect(segundo.yaAcreditado).toBe(true)
    expect(segundo.acreditadoEn).toEqual(primero.acreditadoEn)
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

// Ninguna actividad de la data de ejemplo tiene 200 plazas — se crea un
// evento dedicado para simular el aforo real del caso que se quiere probar.
async function crearEventoGrande(plazas: number): Promise<number> {
  const titulo = `Evento de prueba — carga (${crypto.randomUUID()})`
  await addActividad({
    titulo,
    sedeId: SEDES[0].id,
    descripcion: '',
    fecha: new Date().toISOString().slice(0, 10),
    hora: '10:00',
    duracion: '2h',
    dificultad: 'Fácil',
    plazas,
    plazasDisponibles: plazas,
    tematica: 'Historia local',
    organizador: '',
    contacto: '',
    puntoEncuentro: '',
    imagen: '',
  })
  let id: number | undefined
  subscribeActividades(items => {
    id = items.find(a => a.titulo === titulo)?.id
  })
  if (!id) throw new Error('no se pudo crear el evento de prueba')
  return id
}

// Simula la puerta de un evento de ~200 personas: todas las inscripciones ya
// existen de antemano (se hicieron en los días previos) y lo que se ráfaga
// es la acreditación — 200 QRs leídos en una ventana corta al llegar el
// público. El store es en memoria y de un solo hilo, así que esto no
// reproduce condiciones de red/Firestore real (ver SECURITY.md); lo que sí
// verifica es que el propio manejo de estado no se corrompe ni se cae bajo
// ese volumen de llamadas.
describe('acreditación bajo ráfaga (evento de ~200 asistentes)', () => {
  it('acredita 200 tokens distintos disparados en paralelo, sin pérdidas ni duplicados', async () => {
    const id = await crearEventoGrande(200)
    for (let i = 0; i < 200; i++) {
      await inscribirse(id, `uid-${i}`, `u${i}@b.com`, `U${i}`, '600000000')
    }
    const inscritos = await getInscritos(id)
    expect(inscritos).toHaveLength(200)
    expect(new Set(inscritos.map(i => i.token)).size).toBe(200) // tokens únicos, sin colisiones

    const t0 = performance.now()
    const resultados = await Promise.all(inscritos.map(i => acreditar(i.token)))
    const elapsedMs = performance.now() - t0

    expect(resultados.every(r => r.yaAcreditado === false)).toBe(true)
    expect(new Set(resultados.map(r => r.displayName)).size).toBe(200)
    const actualizados = await getInscritos(id)
    expect(actualizados.every(i => i.acreditado === true)).toBe(true)
    // No es una medición de latencia real (ver comentario arriba) — solo una
    // guarda de regresión ante un bug que vuelva esta operación O(n²).
    expect(elapsedMs).toBeLessThan(1000)
  })

  it('reescaneos simultáneos del mismo QR (ej. 2-3 dispositivos en la misma puerta) acreditan una sola vez cada uno', async () => {
    const id = await crearEventoGrande(200)
    for (let i = 0; i < 200; i++) {
      await inscribirse(id, `uid-${i}`, `u${i}@b.com`, `U${i}`, '600000000')
    }
    const inscritos = await getInscritos(id)

    // Cada QR se lee 3 veces casi a la vez (varios frames de cámara, o dos
    // escáneres apuntando al mismo código) — solo la primera debe "entrar".
    const escaneos = inscritos.flatMap(i => [acreditar(i.token), acreditar(i.token), acreditar(i.token)])
    const resultados = await Promise.all(escaneos)

    expect(resultados.filter(r => !r.yaAcreditado)).toHaveLength(200)
    expect(resultados.filter(r => r.yaAcreditado)).toHaveLength(400)

    const actualizados = await getInscritos(id)
    expect(actualizados.every(i => i.acreditado === true)).toBe(true)
    expect(actualizados).toHaveLength(200)
  })
})
