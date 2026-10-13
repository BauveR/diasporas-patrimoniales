import React from 'react'
import { renderHook, act } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { Actividad } from '../data/actividades'

// "Inscribirme" dentro de Instagram en Android: si se abre Chrome, no se
// sigue hacia el login de dentro de la app.
const abrirChrome = vi.hoisted(() => ({ resultado: true, llamadas: [] as string[] }))
vi.mock('../lib/salirDeApp', () => ({
  intentarAbrirEnChrome: (ruta: string) => { abrirChrome.llamadas.push(ruta); return abrirChrome.resultado },
}))
vi.mock('../contexts/AuthContext', () => ({ useAuth: () => ({ user: null, inscripcionIds: [] }) }))
vi.mock('../lib/firebaseLoaders', () => ({ loadDb: async () => ({}), loadAuth: async () => ({}) }))

const { useActividadBooking } = await import('./useActividadBooking')
const { getInscripcionPendiente, limpiarInscripcionPendiente } = await import('../lib/inscripcionPendiente')
const actividad = { id: 1, fecha: '2030-01-01', plazas: 10, plazasDisponibles: 5 } as Actividad

function montar() {
  return renderHook(() => ({ booking: useActividadBooking(actividad), loc: useLocation() }), {
    wrapper: ({ children }: { children: React.ReactNode }) => <MemoryRouter initialEntries={['/fr/actividades/1']}>{children}</MemoryRouter>,
  })
}

describe('useActividadBooking — "Inscribirme" dentro de una app', () => {
  beforeEach(() => { abrirChrome.llamadas.length = 0; limpiarInscripcionPendiente() })

  it('si se abre Chrome: pide la misma jornada con ?inscribirme=<id> y no va al login', () => {
    abrirChrome.resultado = true
    const { result } = montar()
    act(() => result.current.booking.handleRequestLogin())
    expect(abrirChrome.llamadas).toEqual(['/fr/actividades/1?inscribirme=1'])
    expect(result.current.loc.pathname).toBe('/fr/actividades/1')
    expect(getInscripcionPendiente()).toBeNull()
  })

  it('si no (iPhone, navegador normal o ya se intentó): login de siempre', () => {
    abrirChrome.resultado = false
    const { result } = montar()
    act(() => result.current.booking.handleRequestLogin())
    expect(result.current.loc.pathname).toBe('/fr/login')
    expect(getInscripcionPendiente()).toBe(1)
  })
})
