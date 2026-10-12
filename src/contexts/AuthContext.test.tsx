import { render, screen, act, fireEvent } from '@testing-library/react'
import { useState } from 'react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { TIMEOUT_CONEXION_MS } from '../lib/conexion'

// Sesión ya iniciada + listener de inscripciones controlable desde el test.
type Cb = (ids: number[], meta: { fromCache: boolean }) => void
let inscripciones: Cb | undefined
let suscripciones = 0
const loadAuth = vi.fn()

vi.mock('../lib/firebaseLoaders', () => ({
  loadAuth: () => loadAuth(),
  loadDb: () => Promise.resolve({
    subscribeInscripcionIds: (_uid: string, cb: Cb) => { suscripciones++; inscripciones = cb; return () => {} },
  }),
}))

const { AuthProvider, useAuth } = await import('./AuthContext')

function Estado() {
  const { inscripcionesLoading, inscripcionesError, inscripcionIds } = useAuth()
  if (inscripcionesError) return <p>error</p>
  if (inscripcionesLoading) return <p>cargando</p>
  return <p>{`inscripciones: ${inscripcionIds.length}`}</p>
}

async function montar() {
  render(<AuthProvider><Estado /></AuthProvider>)
  await act(async () => { for (let i = 0; i < 5; i++) await Promise.resolve() })
}

describe('AuthProvider — inscripciones sin conexión', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    inscripciones = undefined
    suscripciones = 0
    // El modo compatible automático ya se probó → los fallos muestran el aviso.
    sessionStorage.setItem('firestore_modo_compatible_intentado', '1')
    vi.spyOn(console, 'error').mockImplementation(() => {})
    loadAuth.mockReset().mockResolvedValue({
      subscribeAuthState: (cb: (u: unknown) => void) => { cb({ uid: 'u1', email: 'a@ull.edu.es', displayName: 'Ana' }); return () => {} },
      getUserRole: () => Promise.resolve('user'),
    })
  })
  afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks() })

  it('con respuesta del servidor muestra las inscripciones', async () => {
    await montar()
    act(() => { inscripciones!([7, 8], { fromCache: false }) })
    expect(screen.getByText('inscripciones: 2')).toBeInTheDocument()
  })

  // Bug de producción (2026-10-10): al iniciar sesión sin inscripciones,
  // Firestore respondía primero con la caché vacía, eso contaba como "sin
  // conexión" y la página se recargaba de vuelta al login.
  it('una lista vacía desde caché no se da por buena NI por fallo: espera al servidor, sin recargar', async () => {
    const reload = vi.fn()
    Object.defineProperty(window, 'location', { value: { ...window.location, reload }, writable: true, configurable: true })
    sessionStorage.clear() // ni siquiera la primera vez de la pestaña
    await montar()
    act(() => { inscripciones!([], { fromCache: true }) })
    expect(screen.getByText('cargando')).toBeInTheDocument()
    act(() => { inscripciones!([], { fromCache: false }) })
    expect(screen.getByText('inscripciones: 0')).toBeInTheDocument()
    expect(reload).not.toHaveBeenCalled()
  })

  it('si tras la caché vacía el servidor nunca responde, el tiempo límite avisa (sin recargar)', async () => {
    const reload = vi.fn()
    Object.defineProperty(window, 'location', { value: { ...window.location, reload }, writable: true, configurable: true })
    sessionStorage.clear()
    await montar()
    act(() => { inscripciones!([], { fromCache: true }) })
    act(() => { vi.advanceTimersByTime(TIMEOUT_CONEXION_MS) })
    expect(screen.getByText('error')).toBeInTheDocument()
    expect(reload).not.toHaveBeenCalled()
  })

  it('el servidor confirmando 0 inscripciones sí es "sin inscripciones"', async () => {
    await montar()
    act(() => { inscripciones!([], { fromCache: false }) })
    expect(screen.getByText('inscripciones: 0')).toBeInTheDocument()
  })

  it('si no llega nada, avisa al pasar el tiempo límite', async () => {
    await montar()
    act(() => { vi.advanceTimersByTime(TIMEOUT_CONEXION_MS) })
    expect(screen.getByText('error')).toBeInTheDocument()
  })

  it('si no se descarga Firebase Auth, termina la carga con error en vez de quedarse cargando', async () => {
    loadAuth.mockReset().mockRejectedValue(new TypeError('Failed to fetch dynamically imported module'))
    function EstadoAuth() {
      const { loading, authError } = useAuth()
      return <p>{authError ? 'auth-error' : loading ? 'auth-cargando' : 'auth-ok'}</p>
    }
    render(<AuthProvider><EstadoAuth /></AuthProvider>)
    await act(async () => { for (let i = 0; i < 5; i++) await Promise.resolve() })
    expect(screen.getByText('auth-error')).toBeInTheDocument()
  })

  // Volver a entrar sin recargar: Firestore puede responder primero con lo
  // que ya tenía en caché. Antes eso contaba como error y el aviso parpadeaba.
  it('una lista NO vacía desde caché se acepta (sin parpadeo de error)', async () => {
    await montar()
    act(() => { inscripciones!([7], { fromCache: true }) })
    expect(screen.getByText('inscripciones: 1')).toBeInTheDocument()
  })

  it('la misma persona notificada dos veces (signIn + onAuthStateChanged) no vuelve a suscribir', async () => {
    let avisar: (u: unknown) => void = () => {}
    loadAuth.mockReset().mockResolvedValue({
      subscribeAuthState: (cb: (u: unknown) => void) => { avisar = cb; cb({ uid: 'u1', email: 'a@ull.edu.es', displayName: 'Ana' }); return () => {} },
      getUserRole: () => Promise.resolve('user'),
    })
    await montar()
    await act(async () => { avisar({ uid: 'u1', email: 'a@ull.edu.es', displayName: 'Ana' }); await Promise.resolve() })
    await act(async () => { for (let i = 0; i < 5; i++) await Promise.resolve() })
    expect(suscripciones).toBe(1)
  })
})

describe('AuthProvider — el login no espera al rol más de ESPERA_ROL_MS', () => {
  let resolverRol: (r: string) => void = () => {}

  // Botón que inicia sesión y muestra lo que devolvió signIn y el rol actual.
  function Probe() {
    const { signIn, userRole } = useAuth()
    const [resultado, setResultado] = useState('pendiente')
    return (
      <>
        <button onClick={() => { signIn('ana@ull.edu.es', 'clave1234').then(setResultado) }}>entrar</button>
        <p data-testid="resultado">{resultado}</p>
        <p data-testid="rol">{userRole ?? 'sin rol'}</p>
      </>
    )
  }

  const tic = async () => { for (let i = 0; i < 5; i++) await Promise.resolve() }

  beforeEach(() => {
    vi.useFakeTimers()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    loadAuth.mockReset().mockResolvedValue({
      subscribeAuthState: () => () => {},
      signIn: async () => ({ uid: 'u1', email: 'ana@ull.edu.es', displayName: 'Ana' }),
      // Firestore bloqueado: el rol tarda (o no llega).
      getUserRole: () => new Promise<string>(r => { resolverRol = r }),
    })
  })
  afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks() })

  it('si el rol no llega en 3 s, entra como usuario normal; cuando llega, se actualiza', async () => {
    const { ESPERA_ROL_MS } = await import('./AuthContext')
    render(<AuthProvider><Probe /></AuthProvider>)
    await act(tic)
    await act(async () => { fireEvent.click(screen.getByText('entrar')); await tic() })
    expect(screen.getByTestId('resultado')).toHaveTextContent('pendiente')
    await act(async () => { vi.advanceTimersByTime(ESPERA_ROL_MS); await tic() })
    expect(screen.getByTestId('resultado')).toHaveTextContent('user')
    await act(async () => { resolverRol('admin'); await tic() })
    expect(screen.getByTestId('rol')).toHaveTextContent('admin')
  })

  it('si el rol llega a tiempo, se usa directamente', async () => {
    render(<AuthProvider><Probe /></AuthProvider>)
    await act(tic)
    await act(async () => { fireEvent.click(screen.getByText('entrar')); await tic() })
    await act(async () => { resolverRol('admin'); await tic() })
    expect(screen.getByTestId('resultado')).toHaveTextContent('admin')
    expect(screen.getByTestId('rol')).toHaveTextContent('admin')
  })
})
