import { renderHook, act } from '@testing-library/react'
import { MemoryRouter, useLocation, useNavigate, useNavigationType, type Location } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { ReactNode } from 'react'
import { useScrollAlNavegar } from './useScrollAlNavegar'

// jsdom no hace scroll de verdad: scrollTo solo actualiza window.scrollY.
let scrollY = 0
const scrollTo = vi.fn((x: number | ScrollToOptions, y?: number) => {
  scrollY = typeof x === 'number' ? (y ?? 0) : (x.top ?? 0)
})

function useEscenario() {
  const location = useLocation()
  const navType = useNavigationType()
  const navigate = useNavigate()
  useScrollAlNavegar(location, navType, location.state?.background as Location | undefined)
  return { navigate, location }
}
const wrapper = ({ children }: { children: ReactNode }) => <MemoryRouter initialEntries={['/']}>{children}</MemoryRouter>

function scrollear(y: number) {
  scrollY = y
  window.dispatchEvent(new Event('scroll'))
}

describe('useScrollAlNavegar', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    scrollY = 0
    scrollTo.mockClear()
    Object.defineProperty(window, 'scrollY', { get: () => scrollY, configurable: true })
    window.scrollTo = scrollTo as unknown as typeof window.scrollTo
  })
  afterEach(() => vi.useRealTimers())

  it('al ir a otra página, arriba del todo (y lo reafirma aunque algo la vuelva a mover)', () => {
    const { result } = renderHook(useEscenario, { wrapper })
    scrollear(2400)
    act(() => result.current.navigate('/perfil'))
    expect(scrollY).toBe(0)
    scrollY = 2400 // ej. iOS re-aplicando su scroll al cerrarse el teclado
    act(() => { vi.advanceTimersByTime(300) })
    expect(scrollY).toBe(0)
  })

  it('al volver atrás, cada página recupera su posición (no la de la anterior)', () => {
    const { result } = renderHook(useEscenario, { wrapper })
    scrollear(1800)                                   // Home, abajo
    act(() => result.current.navigate('/perfil'))
    scrollear(300)                                    // Perfil, un poco abajo
    act(() => result.current.navigate('/privacidad'))
    scrollear(2000)                                   // Privacidad, al final
    act(() => result.current.navigate(-1))
    act(() => { vi.advanceTimersByTime(700) })
    expect(scrollY).toBe(300)                         // Perfil donde estaba, no al final
    act(() => result.current.navigate(-1))
    act(() => { vi.advanceTimersByTime(700) })
    expect(scrollY).toBe(1800)                        // Home donde estaba
  })

  it('al volver a una página sin posición guardada, arriba', () => {
    const { result } = renderHook(useEscenario, { wrapper })
    act(() => result.current.navigate('/perfil'))
    scrollear(900)
    act(() => result.current.navigate(-1))
    act(() => result.current.navigate(1))             // adelante → /perfil (900 guardado)
    act(() => { vi.advanceTimersByTime(700) })
    expect(scrollY).toBe(900)
  })

  it('abrir o cerrar un modal no mueve la página de fondo', () => {
    const { result } = renderHook(useEscenario, { wrapper })
    scrollear(1500)
    act(() => result.current.navigate('/login', { state: { background: result.current.location } }))
    expect(scrollY).toBe(1500)
    act(() => result.current.navigate(-1))
    act(() => { vi.advanceTimersByTime(700) })
    expect(scrollY).toBe(1500)
  })

  it('desde un modal (tarjeta de inscripción) a otra página, arriba', () => {
    const { result } = renderHook(useEscenario, { wrapper })
    scrollear(1500)
    act(() => result.current.navigate('/actividades/7', { state: { background: result.current.location } }))
    act(() => result.current.navigate('/perfil'))
    expect(scrollY).toBe(0)
  })

  it('cierra el teclado (quita el foco del campo) antes de saltar', () => {
    const input = document.createElement('input')
    document.body.appendChild(input)
    input.focus()
    const { result } = renderHook(useEscenario, { wrapper })
    act(() => result.current.navigate('/perfil'))
    expect(document.activeElement).not.toBe(input)
    input.remove()
  })

  it('si la persona toca la pantalla, deja de insistir', () => {
    const { result } = renderHook(useEscenario, { wrapper })
    scrollear(2400)
    act(() => result.current.navigate('/perfil'))
    window.dispatchEvent(new Event('touchstart'))
    scrollY = 500 // la persona scrollea
    act(() => { vi.advanceTimersByTime(700) })
    expect(scrollY).toBe(500)
  })
})
