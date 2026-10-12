import React from 'react'
import { renderHook, act } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { Actividad } from '../data/actividades'
import { limpiarInscripcionPendiente, getInscripcionPendiente, marcarInscripcionPendiente } from '../lib/inscripcionPendiente'

// Mismo patrón que useActividadBooking.test.tsx: sesión controlable desde
// cada test, sin Firebase.
const authState: { user: { uid: string; email: string; displayName: string } | null; inscripcionIds: number[] } = {
  user: null,
  inscripcionIds: [],
}

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => authState,
}))

// El hook carga la base de datos con import() dinámico (lib/firebaseLoaders):
// se simula ese cargador, o el test acabaría hablando con el Firestore real.
const dbFalsa = vi.hoisted(() => ({
  inscribirseAmbosDias: vi.fn(),
  liberarAmbosDias: vi.fn(),
  getTelefonoForUser: vi.fn(() => Promise.resolve(null)),
  SinPlazasError: class extends Error {},
  YaLiberadaError: class extends Error {},
  EventoCanceladoError: class extends Error {},
  InscripcionNoAbiertaError: class extends Error {},
  ActividadNoEncontradaError: class extends Error {},
}))
vi.mock('../lib/db', () => dbFalsa)
vi.mock('../lib/firebaseLoaders', () => ({ loadDb: async () => dbFalsa, loadAuth: async () => ({}) }))

const { useAmbosDiasBooking } = await import('./useAmbosDiasBooking')
const { loginPath } = await import('../i18n/routing')

const actividad = (id: number) => ({ id, fecha: '2030-01-01', plazas: 10, plazasDisponibles: 5 }) as Actividad
const dias = [actividad(1), actividad(2)]
const wrapper = ({ children }: { children: React.ReactNode }) => <MemoryRouter>{children}</MemoryRouter>
const ana = { uid: 'u1', email: 'a@b.com', displayName: 'Ana' }

describe('useAmbosDiasBooking — volver del login lanzado desde "Inscribirme a ambos días"', () => {
  beforeEach(() => {
    authState.user = null
    authState.inscripcionIds = []
    limpiarInscripcionPendiente()
  })

  it('al volver con sesión, abre el formulario solo y muestra el aviso', () => {
    const { result, rerender } = renderHook(() => useAmbosDiasBooking(dias), { wrapper })
    act(() => result.current.handleRequestLogin())
    expect(getInscripcionPendiente()).toBe('ambos')
    expect(result.current.mostrandoTelefono).toBe(false)

    authState.user = ana
    rerender()
    expect(result.current.mostrandoTelefono).toBe(true)
    expect(result.current.avisoSesionIniciada).toBe(true)
  })

  it('no se abre si la marca es de una jornada suelta', () => {
    marcarInscripcionPendiente(1)
    authState.user = ana
    const { result } = renderHook(() => useAmbosDiasBooking(dias), { wrapper })
    expect(result.current.mostrandoTelefono).toBe(false)
  })

  it('no se abre si ya estaba inscrito en alguna de las dos jornadas', () => {
    const { result, rerender } = renderHook(() => useAmbosDiasBooking(dias), { wrapper })
    act(() => result.current.handleRequestLogin())
    authState.user = ana
    authState.inscripcionIds = [1]
    rerender()
    expect(result.current.mostrandoTelefono).toBe(false)
  })

  it('"Cancelar" lo cierra y limpia la marca', () => {
    const { result, rerender } = renderHook(() => useAmbosDiasBooking(dias), { wrapper })
    act(() => result.current.handleRequestLogin())
    authState.user = ana
    rerender()
    act(() => result.current.handleCancelarTelefono())
    expect(result.current.mostrandoTelefono).toBe(false)
    expect(result.current.avisoSesionIniciada).toBe(false)
    expect(getInscripcionPendiente()).toBeNull()
  })

  it('el login se abre con el prefijo del idioma actual', () => {
    const { result } = renderHook(() => {
      const booking = useAmbosDiasBooking(dias)
      return { booking, location: useLocation() }
    }, {
      wrapper: ({ children }) => <MemoryRouter initialEntries={['/en']}>{children}</MemoryRouter>,
    })
    act(() => result.current.booking.handleRequestLogin())
    expect(result.current.location.pathname).toBe('/en/login')
  })
})

describe('loginPath', () => {
  it('sin prefijo en español, con prefijo en el resto', () => {
    expect(loginPath('/')).toBe('/login')
    expect(loginPath('/en')).toBe('/en/login')
    expect(loginPath('/fr/programa')).toBe('/fr/login')
    expect(loginPath('/pt')).toBe('/pt/login')
  })
})
