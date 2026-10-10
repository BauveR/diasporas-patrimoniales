import { render, screen, fireEvent } from '@testing-library/react'
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
})
