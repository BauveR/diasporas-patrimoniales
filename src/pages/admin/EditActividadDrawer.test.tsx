import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { Actividad } from '../../data/actividades'
import type { Sede } from '../../data/sedes'

// Evita que el drawer toque Firestore/Firebase de verdad al guardar — el
// resto de db.ts (que inicializa la app de Firebase con las env vars) ni se
// ejecuta gracias a este mock del módulo entero.
const updateActividad = vi.fn().mockResolvedValue(undefined)
vi.mock('../../lib/db', () => ({ updateActividad: (...args: unknown[]) => updateActividad(...args) }))

// useIsDesktop usa window.matchMedia, que jsdom no implementa — se fija en
// "desktop" en vez de polyfillear matchMedia, ya que el layout mobile/
// desktop del drawer no es lo que este test ejercita.
vi.mock('../../hooks/useIsDesktop', () => ({ useIsDesktop: () => true }))

import { EditActividadDrawer } from './EditActividadDrawer'

const sede: Sede = {
  id: 1, nombre: 'TEA Tenerife Espacio de las Artes', municipio: 'Santa Cruz de Tenerife',
  isla: 'Tenerife', imagen: '', descripcion: '', actividadIds: [1], lat: 28.46, lng: -16.25,
}

const actividad: Actividad = {
  id: 1,
  titulo: 'Panel I. Coleccionismo desigual y museos',
  tematica: 'Arquitectura',
  fecha: '2030-01-01',
  hora: '10:00',
  duracion: '2h',
  dificultad: 'Fácil',
  plazas: 20,
  plazasDisponibles: 12,
  sedeId: 1,
  imagen: 'https://example.com/img.jpg',
  organizador: '',
  contacto: '',
  puntoEncuentro: '',
  descripcion: 'Recorrido completo por el recinto histórico con guía especializado.',
}

// El drawer solo copia `actividad` a su estado interno cuando `actividad.id`
// CAMBIA respecto al montaje anterior (ver el comentario de
// trackedActividadId en EditActividadDrawer.tsx) — así es como
// ControlAsistentes lo usa de verdad: montado siempre con `actividad=null`,
// y recién con una actividad real al hacer click en "Editar". Montarlo
// directo con una actividad ya puesta (sin ese paso por null) nunca dispara
// la copia, así que el test reproduce la transición real en vez de un
// montaje que no ocurre en la app.
function renderDrawer(overrides: Partial<Actividad> = {}) {
  const onClose = vi.fn()
  const { rerender } = render(
    <EditActividadDrawer actividad={null} sedes={[sede]} onClose={onClose} />
  )
  rerender(
    <EditActividadDrawer actividad={{ ...actividad, ...overrides }} sedes={[sede]} onClose={onClose} />
  )
  return { onClose }
}

describe('EditActividadDrawer — campos escribibles', () => {
  beforeEach(() => {
    updateActividad.mockClear()
  })

  it('precarga el título actual de la actividad', () => {
    renderDrawer()
    expect(screen.getByDisplayValue(actividad.titulo)).toBeInTheDocument()
  })

  it('permite escribir un nuevo título', () => {
    renderDrawer()
    const input = screen.getByDisplayValue(actividad.titulo)
    fireEvent.change(input, { target: { value: 'Panel I. Título editado' } })
    expect(screen.getByDisplayValue('Panel I. Título editado')).toBeInTheDocument()
  })

  it('permite escribir en el campo de descripción', () => {
    renderDrawer()
    const textarea = screen.getByDisplayValue(actividad.descripcion)
    fireEvent.change(textarea, { target: { value: 'Nueva descripción, lo bastante larga.' } })
    expect(screen.getByDisplayValue('Nueva descripción, lo bastante larga.')).toBeInTheDocument()
  })

  it('permite escribir en el campo de plazas', () => {
    renderDrawer()
    const input = screen.getByDisplayValue('20')
    fireEvent.change(input, { target: { value: '30' } })
    expect(screen.getByDisplayValue('30')).toBeInTheDocument()
  })
})

describe('EditActividadDrawer — validación al guardar', () => {
  beforeEach(() => {
    updateActividad.mockClear()
  })

  it('muestra el error de título corto y no guarda', async () => {
    renderDrawer()
    fireEvent.change(screen.getByDisplayValue(actividad.titulo), { target: { value: 'ab' } })
    fireEvent.click(screen.getByRole('button', { name: /guardar cambios/i }))

    expect(await screen.findByText('Mínimo 5 caracteres')).toBeInTheDocument()
    expect(updateActividad).not.toHaveBeenCalled()
  })

  it('el error de un campo desaparece en cuanto se vuelve a escribir en él', async () => {
    renderDrawer()
    const titulo = screen.getByDisplayValue(actividad.titulo)
    fireEvent.change(titulo, { target: { value: 'ab' } })
    fireEvent.click(screen.getByRole('button', { name: /guardar cambios/i }))
    expect(await screen.findByText('Mínimo 5 caracteres')).toBeInTheDocument()

    fireEvent.change(titulo, { target: { value: 'Título ya válido de nuevo' } })
    expect(screen.queryByText('Mínimo 5 caracteres')).not.toBeInTheDocument()
  })

  it('rechaza reducir las plazas por debajo de la cantidad ya inscrita', async () => {
    // 12 inscritos (plazas 20 - plazasDisponibles 8)
    renderDrawer({ plazas: 20, plazasDisponibles: 8 })
    fireEvent.change(screen.getByDisplayValue('20'), { target: { value: '5' } })
    fireEvent.click(screen.getByRole('button', { name: /guardar cambios/i }))

    expect(await screen.findByText(/mínimo 12 \(hay 12 inscritos\)/i)).toBeInTheDocument()
    expect(updateActividad).not.toHaveBeenCalled()
  })

  it('rechaza un contacto con formato inválido', async () => {
    renderDrawer()
    const contacto = screen.getByPlaceholderText('email o 6XXXXXXXX')
    fireEvent.change(contacto, { target: { value: 'no-es-ni-mail-ni-telefono' } })
    fireEvent.click(screen.getByRole('button', { name: /guardar cambios/i }))

    expect(await screen.findByText(/email o teléfono español/i)).toBeInTheDocument()
    expect(updateActividad).not.toHaveBeenCalled()
  })

  it('guarda cuando el formulario es válido, con los datos editados', async () => {
    renderDrawer()
    fireEvent.change(screen.getByDisplayValue(actividad.titulo), { target: { value: 'Título nuevo y válido' } })

    fireEvent.click(screen.getByRole('button', { name: /guardar cambios/i }))

    expect(await screen.findByText('✓ Guardado')).toBeInTheDocument()
    expect(updateActividad).toHaveBeenCalledTimes(1)
    expect(updateActividad).toHaveBeenCalledWith(
      actividad.id,
      expect.objectContaining({ titulo: 'Título nuevo y válido', plazas: 20, plazasDisponibles: 12 }),
    )
  })
})
