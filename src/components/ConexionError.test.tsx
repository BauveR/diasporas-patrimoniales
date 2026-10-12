import { render, screen, fireEvent, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import '../i18n/config'
import { ConexionError } from './ConexionError'
import { modoCompatibleActivo } from '../lib/conexion'

const reload = vi.fn()

describe('ConexionError', () => {
  beforeEach(() => {
    localStorage.clear()
    reload.mockReset()
    Object.defineProperty(window, 'location', { value: { ...window.location, reload }, writable: true, configurable: true })
  })

  it('explica el problema y da el correo de contacto', () => {
    render(<ConexionError />)
    expect(screen.getByRole('alert')).toHaveTextContent('No pudimos conectar con el sistema de inscripciones')
    expect(screen.getByRole('link', { name: 'diasporaspatrimoniales@gmail.com' }))
      .toHaveAttribute('href', 'mailto:diasporaspatrimoniales@gmail.com')
  })

  it('"Reintentar" activa el modo compatible y recarga', () => {
    render(<ConexionError />)
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(modoCompatibleActivo()).toBe(true)
    expect(reload).toHaveBeenCalledOnce()
  })

  it('sin internet en el dispositivo: lo dice tal cual (sin hablar de bloqueos) y recarga sola al volver la conexión', () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true })
    try {
      render(<ConexionError />)
      expect(screen.getByRole('alert')).toHaveTextContent('Sin conexión a internet')
      expect(screen.queryByText(/universidades o administraciones/)).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Reintentar' })).not.toBeInTheDocument()
      act(() => { window.dispatchEvent(new Event('online')) })
      expect(reload).toHaveBeenCalledOnce()
    } finally {
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true })
    }
  })

  it('si se pierde la conexión con el aviso ya en pantalla, cambia al mensaje de sin internet', () => {
    render(<ConexionError />)
    act(() => { window.dispatchEvent(new Event('offline')) })
    expect(screen.getByRole('alert')).toHaveTextContent('Sin conexión a internet')
  })
})
