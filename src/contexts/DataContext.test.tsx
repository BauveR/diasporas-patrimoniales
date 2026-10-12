import { render, screen, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { AVISO_LENTO_MS, GRACIA_SIN_SERVIDOR_MS, TIMEOUT_CONEXION_MS } from '../lib/conexion'

// Firestore simulado: cada test decide si los listeners responden, fallan
// o se quedan callados (lo que pasa cuando un proxy corta la conexión).
type Cb = (data: unknown[], meta: { fromCache: boolean }) => void
type ErrCb = (err: Error) => void
const listeners: { actividades?: [Cb, ErrCb?]; sedes?: [Cb, ErrCb?] } = {}
const loadDb = vi.fn()
const reload = vi.fn()

vi.mock('../lib/firebaseLoaders', () => ({ loadDb: () => loadDb() }))

const { DataProvider, useDataContext } = await import('./DataContext')

function Estado() {
  const { dataLoading, dataError, conexion } = useDataContext()
  return <p>{dataError ? 'error' : conexion !== 'normal' ? conexion : dataLoading ? 'cargando' : 'listo'}</p>
}

const dbFalsa = {
  subscribeActividades: (cb: Cb, onError?: ErrCb) => { listeners.actividades = [cb, onError]; return () => {} },
  subscribeSedes: (cb: Cb, onError?: ErrCb) => { listeners.sedes = [cb, onError]; return () => {} },
}

const servidor = { fromCache: false }
const cache = { fromCache: true }

async function montar() {
  render(<DataProvider><Estado /></DataProvider>)
  await act(async () => { await Promise.resolve() })
}

// El modo compatible automático ya se probó en esta pestaña → los fallos
// muestran el aviso en vez de recargar.
const yaSeIntentoModoCompatible = () => sessionStorage.setItem('firestore_modo_compatible_intentado', '1')

describe('DataProvider — sin conexión con Firestore', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    delete listeners.actividades
    delete listeners.sedes
    sessionStorage.clear()
    reload.mockReset()
    Object.defineProperty(window, 'location', { value: { ...window.location, reload }, writable: true, configurable: true })
    loadDb.mockReset().mockResolvedValue(dbFalsa)
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks() })

  it('con respuesta normal queda listo, sin aviso', async () => {
    await montar()
    act(() => { listeners.actividades![0]([], servidor); listeners.sedes![0]([], servidor) })
    expect(screen.getByText('listo')).toBeInTheDocument()
  })

  it('si tarda, primero un aviso suave ("lento"), no un error', async () => {
    await montar()
    act(() => { vi.advanceTimersByTime(AVISO_LENTO_MS) })
    expect(screen.getByText('lento')).toBeInTheDocument()
  })

  it('primer fallo de la pestaña: reconecta sola en modo compatible (recarga), sin mostrar error', async () => {
    await montar()
    act(() => { vi.advanceTimersByTime(TIMEOUT_CONEXION_MS) })
    expect(screen.getByText('reconectando')).toBeInTheDocument()
    expect(reload).toHaveBeenCalledOnce()
    expect(sessionStorage.getItem('firestore_modo_compatible')).toBe('1')
  })

  it('si ya se probó el modo compatible, al tiempo límite muestra el error', async () => {
    yaSeIntentoModoCompatible()
    await montar()
    act(() => { vi.advanceTimersByTime(TIMEOUT_CONEXION_MS) })
    expect(screen.getByText('error')).toBeInTheDocument()
    expect(reload).not.toHaveBeenCalled()
  })

  it('si los datos llegan tarde, el aviso desaparece', async () => {
    yaSeIntentoModoCompatible()
    await montar()
    act(() => { vi.advanceTimersByTime(TIMEOUT_CONEXION_MS) })
    act(() => { listeners.actividades![0]([], servidor); listeners.sedes![0]([], servidor) })
    expect(screen.getByText('listo')).toBeInTheDocument()
  })

  it('si el listener falla (ej. permisos o red), avisa enseguida', async () => {
    yaSeIntentoModoCompatible()
    await montar()
    act(() => { listeners.actividades![1]!(new Error('unavailable')) })
    expect(screen.getByText('error')).toBeInTheDocument()
  })

  it('si el propio Firebase no se descarga, avisa', async () => {
    yaSeIntentoModoCompatible()
    loadDb.mockRejectedValue(new TypeError('Failed to fetch dynamically imported module'))
    await montar()
    expect(screen.getByText('error')).toBeInTheDocument()
  })

  // Lo que hace Firestore real cuando falla un intento de conexión: pasa a
  // "offline" y entrega la caché, vacía la primera vez — y sigue
  // reintentando. Un proxy que bloquea de verdad deja la caché vacía para
  // siempre; un corte de un segundo, no. De ahí el periodo de gracia.
  it('caché vacía (Firestore offline): no avisa enseguida, espera la gracia', async () => {
    yaSeIntentoModoCompatible()
    await montar()
    act(() => { listeners.actividades![0]([], cache); listeners.sedes![0]([], cache) })
    expect(screen.queryByText('error')).not.toBeInTheDocument()
    act(() => { vi.advanceTimersByTime(GRACIA_SIN_SERVIDOR_MS) })
    expect(screen.getByText('error')).toBeInTheDocument()
  })

  it('corte pasajero: caché vacía y el servidor responde dentro de la gracia → sin aviso ni recarga', async () => {
    await montar()
    act(() => { listeners.actividades![0]([], cache); listeners.sedes![0]([], cache) })
    act(() => { vi.advanceTimersByTime(2_000) })
    act(() => { listeners.actividades![0]([{ id: 1 }], servidor); listeners.sedes![0]([{ id: 1 }], servidor) })
    act(() => { vi.advanceTimersByTime(TIMEOUT_CONEXION_MS) })
    expect(screen.getByText('listo')).toBeInTheDocument()
    expect(reload).not.toHaveBeenCalled()
    expect(sessionStorage.getItem('firestore_modo_compatible_intentado')).toBeNull()
  })

  it('bloqueo real: la caché sigue vacía al acabar la gracia → recarga en modo compatible', async () => {
    await montar()
    act(() => { listeners.actividades![0]([], cache); listeners.sedes![0]([], cache) })
    act(() => { vi.advanceTimersByTime(GRACIA_SIN_SERVIDOR_MS) })
    expect(screen.getByText('reconectando')).toBeInTheDocument()
    expect(reload).toHaveBeenCalledOnce()
  })

  it('la gracia cuenta desde que empezó la carga, no desde el aviso de offline', async () => {
    yaSeIntentoModoCompatible()
    await montar()
    act(() => { vi.advanceTimersByTime(GRACIA_SIN_SERVIDOR_MS - 1_000) })
    act(() => { listeners.actividades![0]([], cache) })
    act(() => { vi.advanceTimersByTime(1_000) })
    expect(screen.getByText('error')).toBeInTheDocument()
  })

  it('sin internet en el dispositivo: avisa enseguida y no gasta el modo compatible', async () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true })
    try {
      await montar()
      act(() => { listeners.actividades![0]([], cache) })
      expect(screen.getByText('error')).toBeInTheDocument()
      expect(reload).not.toHaveBeenCalled()
      expect(sessionStorage.getItem('firestore_modo_compatible_intentado')).toBeNull()
    } finally {
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true })
    }
  })

  it('tras el aviso por caché vacía, si luego responde el servidor, queda listo', async () => {
    yaSeIntentoModoCompatible()
    await montar()
    act(() => { listeners.actividades![0]([], cache); listeners.sedes![0]([], cache) })
    act(() => { vi.advanceTimersByTime(GRACIA_SIN_SERVIDOR_MS) })
    act(() => { listeners.actividades![0]([{ id: 1 }], servidor); listeners.sedes![0]([{ id: 1 }], servidor) })
    expect(screen.getByText('listo')).toBeInTheDocument()
  })

  it('un fallo después de haber cargado no muestra nada (los datos siguen en pantalla)', async () => {
    yaSeIntentoModoCompatible()
    await montar()
    act(() => { listeners.actividades![0]([{ id: 1 }], servidor); listeners.sedes![0]([{ id: 1 }], servidor) })
    act(() => { listeners.actividades![1]!(new Error('unavailable')) })
    expect(screen.getByText('listo')).toBeInTheDocument()
  })
})
