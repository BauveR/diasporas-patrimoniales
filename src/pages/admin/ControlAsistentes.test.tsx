import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { Actividad } from '../../data/actividades'
import type { Sede } from '../../data/sedes'

// Mock del módulo entero: ni Firestore ni la inicialización de Firebase.
// vi.hoisted: vi.mock sube al principio del archivo, antes que las
// declaraciones normales — la clase tiene que existir ya en ese punto.
const { getInscritos, liberarPlaza, YaLiberadaError } = vi.hoisted(() => ({
  getInscritos: vi.fn(),
  liberarPlaza: vi.fn(),
  YaLiberadaError: class extends Error {},
}))
vi.mock('../../lib/db', () => ({
  getInscritos: (...args: unknown[]) => getInscritos(...args),
  liberarPlaza: (...args: unknown[]) => liberarPlaza(...args),
  YaLiberadaError,
  cancelActividad: vi.fn(),
  reactivarActividad: vi.fn(),
  eliminarActividad: vi.fn(),
}))

// El drawer de edición no es lo que se prueba aquí.
vi.mock('./EditActividadDrawer', () => ({ EditActividadDrawer: () => null }))

import { ControlAsistentes } from './ControlAsistentes'

const sede: Sede = {
  id: 1, nombre: 'TEA Tenerife Espacio de las Artes', municipio: 'Santa Cruz de Tenerife',
  isla: 'Tenerife', imagen: '', descripcion: '', actividadIds: [7], lat: 28.46, lng: -16.25,
}

const actividad: Actividad = {
  id: 7, titulo: 'Jornada 1', tematica: 'Arquitectura', fecha: '2099-11-12', hora: '10:00',
  duracion: '8h', dificultad: 'Fácil', plazas: 10, plazasDisponibles: 8, sedeId: 1,
  imagen: '', organizador: '', contacto: '', puntoEncuentro: '', descripcion: '',
}

const inscrito = (uid: string, displayName: string) => ({
  uid, displayName, email: `${uid}@ull.edu.es`, telefono: '612345678',
  inscritoEn: null, aceptoTerminos: true, terminosVersion: 'v1',
})

async function abrirInscritos() {
  render(<ControlAsistentes actividades={[actividad]} sedes={[sede]} />)
  fireEvent.click(screen.getByText('Jornada 1'))
  await screen.findByText('María García')
}

describe('ControlAsistentes — quitar a un inscrito', () => {
  beforeEach(() => {
    getInscritos.mockReset().mockResolvedValue([inscrito('u1', 'María García'), inscrito('u2', 'Juan Pérez')])
    liberarPlaza.mockReset().mockResolvedValue(undefined)
  })

  it('pide confirmación antes de quitar y "No" no hace nada', async () => {
    await abrirInscritos()
    fireEvent.click(screen.getByRole('button', { name: 'Quitar a María García' }))
    expect(screen.getByText('¿Quitar y liberar su plaza?')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'No' }))
    expect(liberarPlaza).not.toHaveBeenCalled()
    expect(screen.getByText('María García')).toBeInTheDocument()
  })

  it('al confirmar, libera la plaza de ese inscrito y lo quita de la lista', async () => {
    await abrirInscritos()
    fireEvent.click(screen.getByRole('button', { name: 'Quitar a María García' }))
    fireEvent.click(screen.getByRole('button', { name: 'Sí, quitar' }))

    await waitFor(() => expect(screen.queryByText('María García')).not.toBeInTheDocument())
    expect(liberarPlaza).toHaveBeenCalledWith(7, 'u1')
    expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
  })

  it('si ya se había liberado (YaLiberadaError), también lo quita de la lista', async () => {
    liberarPlaza.mockRejectedValue(new YaLiberadaError())
    await abrirInscritos()
    fireEvent.click(screen.getByRole('button', { name: 'Quitar a María García' }))
    fireEvent.click(screen.getByRole('button', { name: 'Sí, quitar' }))

    await waitFor(() => expect(screen.queryByText('María García')).not.toBeInTheDocument())
    expect(screen.queryByText(/No se pudo quitar/)).not.toBeInTheDocument()
  })

  it('si falla, muestra el error y deja al inscrito en la lista', async () => {
    liberarPlaza.mockRejectedValue(new Error('permission-denied'))
    await abrirInscritos()
    fireEvent.click(screen.getByRole('button', { name: 'Quitar a María García' }))
    fireEvent.click(screen.getByRole('button', { name: 'Sí, quitar' }))

    expect(await screen.findByText('No se pudo quitar al inscrito. Inténtalo de nuevo.')).toBeInTheDocument()
    expect(screen.getByText('María García')).toBeInTheDocument()
  })
})
