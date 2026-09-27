import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { BookingWidget } from './BookingWidget'
import type { Actividad } from '../../data/actividades'

vi.mock('framer-motion', () => ({
  motion: {
    span: ({ children, animate: _a, transition: _t, ...props }: React.PropsWithChildren<Record<string, unknown>>) =>
      React.createElement('span', props as React.HTMLAttributes<HTMLSpanElement>, children),
  },
}))

const baseActividad: Actividad = {
  id: 1,
  titulo: 'Ruta por el castillo histórico',
  tematica: 'Arquitectura',
  fecha: '2030-01-01',
  hora: '10:00',
  duracion: '2h',
  dificultad: 'Fácil',
  plazas: 20,
  plazasDisponibles: 10,
  sedeId: 1,
  imagen: 'https://example.com/img.jpg',
  organizador: '',
  contacto: '',
  puntoEncuentro: '',
  descripcion: '',
}

const baseProps = {
  actividad: baseActividad,
  fecha: 'lunes, 1 de enero de 2030',
  pct: 50,
  inscrito: false,
  esPasada: false,
  esCancelada: false,
  noAbierto: false,
  isLoggedIn: true,
  inscribiendo: false,
  inscripcionError: '',
  confirmando: false,
  setConfirmando: vi.fn(),
  liberando: false,
  onLiberar: vi.fn(),
  onRequestLogin: vi.fn(),
  mostrandoTelefono: false,
  setMostrandoTelefono: vi.fn(),
  telefono: '',
  onTelefonoChange: vi.fn(),
  telefonoError: '',
  // Por defecto "listo para enviar" (checkbox ya marcado) para no romper los
  // tests existentes que no son sobre este comportamiento en particular —
  // ver el describe dedicado más abajo para el caso sin marcar.
  aceptoTerminos: true,
  setAceptoTerminos: vi.fn(),
  onConfirmarInscripcion: vi.fn(),
  onCancelarTelefono: vi.fn(),
}

function renderWidget(props: Partial<typeof baseProps> & { compact?: boolean } = {}) {
  return render(
    <MemoryRouter>
      <BookingWidget {...baseProps} {...props} />
    </MemoryRouter>
  )
}

describe('BookingWidget — evento cancelado', () => {
  it('muestra banner de cancelación', () => {
    renderWidget({ esCancelada: true })
    expect(screen.getByText(/evento cancelado/i)).toBeInTheDocument()
  })

  it('no muestra botón de inscripción cuando está cancelado', () => {
    renderWidget({ esCancelada: true })
    expect(screen.queryByRole('button', { name: /inscribirme/i })).not.toBeInTheDocument()
  })
})

describe('BookingWidget — formulario de inscripción', () => {
  beforeEach(() => {
    baseProps.setConfirmando.mockClear()
    baseProps.onRequestLogin.mockClear()
    baseProps.setMostrandoTelefono.mockClear()
  })

  it('muestra el botón Inscribirme por defecto', () => {
    renderWidget()
    expect(screen.getByRole('button', { name: /inscribirme/i })).toBeInTheDocument()
  })

  it('abre el paso de teléfono al hacer click si hay sesión', () => {
    const setMostrandoTelefono = vi.fn()
    renderWidget({ isLoggedIn: true, setMostrandoTelefono })
    fireEvent.click(screen.getByRole('button', { name: /inscribirme/i }))
    expect(setMostrandoTelefono).toHaveBeenCalledWith(true)
  })

  it('pide login al hacer click si no hay sesión', () => {
    const onRequestLogin = vi.fn()
    const setMostrandoTelefono = vi.fn()
    renderWidget({ isLoggedIn: false, onRequestLogin, setMostrandoTelefono })
    fireEvent.click(screen.getByRole('button', { name: /inscribirme/i }))
    expect(onRequestLogin).toHaveBeenCalledTimes(1)
    expect(setMostrandoTelefono).not.toHaveBeenCalled()
  })

  it('deshabilita el botón cuando no hay plazas', () => {
    renderWidget({ actividad: { ...baseActividad, plazasDisponibles: 0 } })
    expect(screen.getByRole('button', { name: /sin plazas/i })).toBeDisabled()
  })

  it('deshabilita el botón cuando esPasada', () => {
    renderWidget({ esPasada: true })
    expect(screen.getByRole('button', { name: /actividad finalizada/i })).toBeDisabled()
  })

  it('deshabilita el botón mientras inscribiendo', () => {
    renderWidget({ inscribiendo: true })
    expect(screen.getByRole('button', { name: /\.\.\./i })).toBeDisabled()
  })

  it('muestra aviso cuando quedan pocas plazas', () => {
    renderWidget({ actividad: { ...baseActividad, plazasDisponibles: 3 } })
    expect(screen.getByText(/pocas plazas disponibles, inscríbete cuanto antes/i)).toBeInTheDocument()
  })

  it('muestra el error de inscripción', () => {
    renderWidget({ inscripcionError: 'Ya no quedan plazas disponibles.' })
    expect(screen.getByText('Ya no quedan plazas disponibles.')).toBeInTheDocument()
  })
})

describe('BookingWidget — paso de teléfono', () => {
  beforeEach(() => {
    baseProps.onConfirmarInscripcion.mockClear()
    baseProps.onCancelarTelefono.mockClear()
    baseProps.onTelefonoChange.mockClear()
  })

  it('muestra el input de teléfono cuando mostrandoTelefono es true', () => {
    renderWidget({ mostrandoTelefono: true })
    expect(screen.getByRole('button', { name: /confirmar y continuar/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^inscribirme$/i })).not.toBeInTheDocument()
  })

  it('llama onConfirmarInscripcion al pulsar Confirmar y continuar', () => {
    const onConfirmarInscripcion = vi.fn()
    renderWidget({ mostrandoTelefono: true, onConfirmarInscripcion })
    fireEvent.click(screen.getByRole('button', { name: /confirmar y continuar/i }))
    expect(onConfirmarInscripcion).toHaveBeenCalledTimes(1)
  })

  it('llama onCancelarTelefono al pulsar Cancelar', () => {
    const onCancelarTelefono = vi.fn()
    renderWidget({ mostrandoTelefono: true, onCancelarTelefono })
    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }))
    expect(onCancelarTelefono).toHaveBeenCalledTimes(1)
  })

  it('muestra el error de teléfono', () => {
    renderWidget({ mostrandoTelefono: true, telefonoError: 'Introduce un teléfono válido' })
    expect(screen.getByText('Introduce un teléfono válido')).toBeInTheDocument()
  })

  it('deshabilita los botones mientras inscribiendo', () => {
    renderWidget({ mostrandoTelefono: true, inscribiendo: true })
    expect(screen.getByRole('button', { name: /\.\.\./i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /cancelar/i })).toBeDisabled()
  })

  it('deshabilita "Confirmar y continuar" si no se aceptó la política de privacidad', () => {
    renderWidget({ mostrandoTelefono: true, aceptoTerminos: false })
    expect(screen.getByRole('button', { name: /confirmar y continuar/i })).toBeDisabled()
  })

  it('habilita "Confirmar y continuar" al marcar el checkbox de política de privacidad', () => {
    const setAceptoTerminos = vi.fn()
    renderWidget({ mostrandoTelefono: true, aceptoTerminos: false, setAceptoTerminos })
    fireEvent.click(screen.getByRole('checkbox'))
    expect(setAceptoTerminos).toHaveBeenCalledWith(true)
  })

  it('incluye un link a la política de privacidad', () => {
    renderWidget({ mostrandoTelefono: true })
    expect(screen.getByRole('link', { name: /política de privacidad/i })).toHaveAttribute('href', '/privacidad')
  })
})

describe('BookingWidget — inscrito', () => {
  beforeEach(() => {
    baseProps.setConfirmando.mockClear()
    baseProps.onLiberar.mockClear()
  })

  it('muestra confirmación de inscripción', () => {
    renderWidget({ inscrito: true })
    expect(screen.getByText(/inscripción confirmada/i)).toBeInTheDocument()
  })

  it('no muestra formulario de inscripción si está inscrito', () => {
    renderWidget({ inscrito: true })
    expect(screen.queryByRole('button', { name: /inscribirme/i })).not.toBeInTheDocument()
  })

  it('llama setConfirmando(true) al pulsar Liberar plaza', () => {
    const setConfirmando = vi.fn()
    renderWidget({ inscrito: true, setConfirmando })
    fireEvent.click(screen.getByRole('button', { name: /liberar plaza/i }))
    expect(setConfirmando).toHaveBeenCalledWith(true)
  })

  it('muestra botones de confirmación cuando confirmando es true', () => {
    renderWidget({ inscrito: true, confirmando: true })
    expect(screen.getByRole('button', { name: /sí, liberar/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /mantener/i })).toBeInTheDocument()
  })

  it('llama onLiberar al confirmar liberación', () => {
    const onLiberar = vi.fn()
    renderWidget({ inscrito: true, confirmando: true, onLiberar })
    fireEvent.click(screen.getByRole('button', { name: /sí, liberar/i }))
    expect(onLiberar).toHaveBeenCalledTimes(1)
  })

  it('llama setConfirmando(false) al pulsar Mantener', () => {
    const setConfirmando = vi.fn()
    renderWidget({ inscrito: true, confirmando: true, setConfirmando })
    fireEvent.click(screen.getByRole('button', { name: /mantener/i }))
    expect(setConfirmando).toHaveBeenCalledWith(false)
  })

  it('deshabilita botones mientras liberando', () => {
    renderWidget({ inscrito: true, confirmando: true, liberando: true })
    expect(screen.getByRole('button', { name: /\.\.\./i })).toBeDisabled()
  })
})

describe('BookingWidget — modo compact', () => {
  it('muestra confirmación de inscripción en modo compacto', () => {
    renderWidget({ inscrito: true, compact: true })
    expect(screen.getByText(/inscripción confirmada/i)).toBeInTheDocument()
  })

  it('muestra banner cancelado en modo compacto', () => {
    renderWidget({ esCancelada: true, compact: true })
    expect(screen.getByText(/evento cancelado/i)).toBeInTheDocument()
  })
})
