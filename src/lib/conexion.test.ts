import { vi, describe, it, expect, beforeEach } from 'vitest'
import {
  modoCompatibleActivo, reintentarEnModoCompatible, cambiarAModoCompatibleAutomatico,
  recargarPorVersionNueva, esErrorDeCargaDeModulo, reportarConexion, reportarSiRecuperado, ultimosDias,
} from './conexion'

const reload = vi.fn()
const sendBeacon = vi.fn(() => true)
const eventosEnviados = () => sendBeacon.mock.calls.map(c => (c as unknown[])[0])
// jsdom no implementa Blob.text().
const leerBlob = (b: Blob) => new Promise<string>(ok => { const r = new FileReader(); r.onload = () => ok(String(r.result)); r.readAsText(b) })
const cuerpo = (llamada: unknown) => leerBlob((llamada as unknown[])[1] as Blob)

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  reload.mockReset()
  sendBeacon.mockClear()
  Object.defineProperty(navigator, 'sendBeacon', { value: sendBeacon, configurable: true })
  // jsdom no implementa la recarga — se sustituye `location` entero.
  Object.defineProperty(window, 'location', { value: { ...window.location, reload }, writable: true, configurable: true })
})

describe('modo compatible', () => {
  it('está apagado por defecto', () => {
    expect(modoCompatibleActivo()).toBe(false)
  })

  it('primer fallo de la pestaña: cambia solo y recarga, sin que nadie pulse nada', () => {
    expect(cambiarAModoCompatibleAutomatico()).toBe(true)
    expect(modoCompatibleActivo()).toBe(true)
    expect(reload).toHaveBeenCalledOnce()
  })

  it('si en modo compatible también falla, no vuelve a recargar (la UI muestra el aviso)', () => {
    cambiarAModoCompatibleAutomatico()
    expect(cambiarAModoCompatibleAutomatico()).toBe(false)
    expect(reload).toHaveBeenCalledOnce()
  })

  it('dura solo en la pestaña (sessionStorage), no en futuras visitas', () => {
    cambiarAModoCompatibleAutomatico()
    expect(localStorage.length).toBe(0)
    sessionStorage.clear() // = nueva visita
    expect(modoCompatibleActivo()).toBe(false)
  })

  it('"Reintentar" activa el modo compatible y recarga', () => {
    reintentarEnModoCompatible()
    expect(modoCompatibleActivo()).toBe(true)
    expect(reload).toHaveBeenCalledOnce()
  })
})

describe('recargarPorVersionNueva', () => {
  it('recarga la primera vez', () => {
    expect(recargarPorVersionNueva(1_000_000)).toBe(true)
    expect(reload).toHaveBeenCalledOnce()
  })

  it('no vuelve a recargar antes de 30 s (evita un bucle)', () => {
    recargarPorVersionNueva(1_000_000)
    expect(recargarPorVersionNueva(1_020_000)).toBe(false)
    expect(reload).toHaveBeenCalledOnce()
  })

  it('pasados 30 s sí puede recargar otra vez', () => {
    recargarPorVersionNueva(1_000_000)
    expect(recargarPorVersionNueva(1_031_000)).toBe(true)
    expect(reload).toHaveBeenCalledTimes(2)
  })
})

describe('esErrorDeCargaDeModulo', () => {
  it('reconoce los mensajes de Chrome, Firefox y Safari', () => {
    expect(esErrorDeCargaDeModulo(new TypeError('Failed to fetch dynamically imported module: https://x/assets/a.js'))).toBe(true)
    expect(esErrorDeCargaDeModulo(new TypeError('error loading dynamically imported module'))).toBe(true)
    expect(esErrorDeCargaDeModulo(new TypeError('Importing a module script failed.'))).toBe(true)
  })

  it('no confunde otros errores', () => {
    expect(esErrorDeCargaDeModulo(new Error('Cannot read properties of undefined'))).toBe(false)
  })
})

describe('reportarConexion (contador anónimo del panel admin)', () => {
  it('envía cada evento como mucho una vez por pestaña', () => {
    reportarConexion('sin_conexion')
    reportarConexion('sin_conexion')
    expect(sendBeacon).toHaveBeenCalledOnce()
    expect(eventosEnviados()).toEqual(['/api/conexion'])
  })

  it('el cambio automático reporta "modo_compatible"; si vuelve a fallar, "sin_conexion"', async () => {
    cambiarAModoCompatibleAutomatico()
    cambiarAModoCompatibleAutomatico()
    const cuerpos = await Promise.all(sendBeacon.mock.calls.map(cuerpo))
    expect(cuerpos).toEqual(['{"evento":"modo_compatible"}', '{"evento":"sin_conexion"}'])
  })

  it('"recuperado" solo se reporta si los datos llegaron estando en modo compatible', async () => {
    reportarSiRecuperado()
    expect(sendBeacon).not.toHaveBeenCalled()
    cambiarAModoCompatibleAutomatico()
    reportarSiRecuperado()
    const ultimo = await cuerpo(sendBeacon.mock.calls.at(-1))
    expect(ultimo).toBe('{"evento":"recuperado"}')
  })
})

describe('ultimosDias', () => {
  it('devuelve N días hacia atrás en hora de Canarias', () => {
    expect(ultimosDias(3, new Date('2026-10-10T12:00:00Z'))).toEqual(['2026-10-10', '2026-10-09', '2026-10-08'])
  })
})

describe('enPantallaDeLogin', () => {
  it.each([['/login', true], ['/en/login', true], ['/pt/login/', true], ['/', false], ['/perfil', false], ['/actividades/1', false], ['/loginx', false]])('%s → %s', async (ruta, esperado) => {
    const { enPantallaDeLogin } = await import('./conexion')
    expect(enPantallaDeLogin(ruta)).toBe(esperado)
  })
})
