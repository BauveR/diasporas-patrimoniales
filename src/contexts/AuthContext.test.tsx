import { render, screen, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { TIMEOUT_CONEXION_MS } from '../lib/conexion'

// Sesión ya iniciada + listener de inscripciones controlable desde el test.
type Cb = (ids: number[], meta: { fromCache: boolean }) => void
let inscripciones: Cb | undefined
const loadAuth = vi.fn()

vi.mock('../lib/firebaseLoaders', () => ({
  loadAuth: () => loadAuth(),
  loadDb: () => Promise.resolve({
    subscribeInscripcionIds: (_uid: string, cb: Cb) => { inscripciones = cb; return () => {} },
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

  it('una lista vacía desde caché (offline) NO se muestra como "sin inscripciones": avisa', async () => {
    await montar()
    act(() => { inscripciones!([], { fromCache: true }) })
    expect(screen.getByText('error')).toBeInTheDocument()
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
})
