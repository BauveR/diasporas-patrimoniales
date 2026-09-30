import React from 'react'
import { renderHook, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { Actividad } from '../data/actividades'
import { limpiarInscripcionPendiente, getInscripcionPendiente } from '../lib/inscripcionPendiente'

// Estado de sesión controlable desde cada test: simula el "antes / después"
// de iniciar sesión sin Firebase.
const authState: { user: { uid: string; email: string; displayName: string } | null; inscripcionIds: number[] } = {
  user: null,
  inscripcionIds: [],
}

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => authState,
}))

vi.mock('../lib/db', () => ({
  inscribirse: vi.fn(),
  liberarPlaza: vi.fn(),
  getTelefonoForUser: vi.fn(() => Promise.resolve(null)),
  SinPlazasError: class extends Error {},
  YaLiberadaError: class extends Error {},
  EventoCanceladoError: class extends Error {},
  InscripcionNoAbiertaError: class extends Error {},
  ActividadNoEncontradaError: class extends Error {},
}))

const { useActividadBooking } = await import('./useActividadBooking')

const actividad = (id: number) => ({ id, fecha: '2030-01-01', plazas: 10, plazasDisponibles: 5 }) as Actividad
const wrapper = ({ children }: { children: React.ReactNode }) => <MemoryRouter>{children}</MemoryRouter>

describe('useActividadBooking — volver del login lanzado desde "Inscribirme"', () => {
  beforeEach(() => {
    authState.user = null
    authState.inscripcionIds = []
    limpiarInscripcionPendiente()
  })

  it('al volver con sesión, abre el formulario solo y muestra el aviso', () => {
    const { result, rerender } = renderHook(() => useActividadBooking(actividad(1)), { wrapper })
    act(() => result.current.handleRequestLogin())
    expect(result.current.mostrandoTelefono).toBe(false)

    authState.user = { uid: 'u1', email: 'a@b.com', displayName: 'Ana' }
    rerender()
    expect(result.current.mostrandoTelefono).toBe(true)
    expect(result.current.avisoSesionIniciada).toBe(true)
  })

  it('no abre el formulario de OTRA actividad', () => {
    const { result: r1 } = renderHook(() => useActividadBooking(actividad(1)), { wrapper })
    act(() => r1.current.handleRequestLogin())
    authState.user = { uid: 'u1', email: 'a@b.com', displayName: 'Ana' }
    const { result: r2 } = renderHook(() => useActividadBooking(actividad(2)), { wrapper })
    expect(r2.current.mostrandoTelefono).toBe(false)
    expect(r2.current.avisoSesionIniciada).toBe(false)
  })

  it('no lo abre si ya estaba inscrito a esa actividad', () => {
    const { result, rerender } = renderHook(() => useActividadBooking(actividad(1)), { wrapper })
    act(() => result.current.handleRequestLogin())
    authState.user = { uid: 'u1', email: 'a@b.com', displayName: 'Ana' }
    authState.inscripcionIds = [1]
    rerender()
    expect(result.current.mostrandoTelefono).toBe(false)
  })

  it('"Cancelar" lo cierra y limpia la marca', () => {
    const { result, rerender } = renderHook(() => useActividadBooking(actividad(1)), { wrapper })
    act(() => result.current.handleRequestLogin())
    authState.user = { uid: 'u1', email: 'a@b.com', displayName: 'Ana' }
    rerender()
    act(() => result.current.handleCancelarTelefono())
    expect(result.current.mostrandoTelefono).toBe(false)
    expect(result.current.avisoSesionIniciada).toBe(false)
    expect(getInscripcionPendiente()).toBeNull()
  })
})
