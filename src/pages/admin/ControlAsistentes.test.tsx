import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
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
  // jsdom no aplica CSS: están a la vez las tarjetas (móvil) y la tabla (sm+).
  await screen.findAllByText('María García')
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

    // [0]: la confirmación de la fila (sm+); [1]: la barra fija de móvil.
    // jsdom no aplica CSS, así que ambas están en el DOM.
    fireEvent.click(screen.getAllByRole('button', { name: 'No' })[0])
    expect(liberarPlaza).not.toHaveBeenCalled()
    expect(screen.getAllByText('María García').length).toBeGreaterThan(0)
  })

  it('al confirmar, libera la plaza de ese inscrito y lo quita de la lista', async () => {
    await abrirInscritos()
    fireEvent.click(screen.getByRole('button', { name: 'Quitar a María García' }))
    fireEvent.click(screen.getAllByRole('button', { name: 'Sí, quitar' })[0])

    await waitFor(() => expect(screen.queryAllByText('María García')).toHaveLength(0))
    expect(liberarPlaza).toHaveBeenCalledWith(7, 'u1')
    expect(screen.getAllByText('Juan Pérez').length).toBeGreaterThan(0)
  })

  it('si ya se había liberado (YaLiberadaError), también lo quita de la lista', async () => {
    liberarPlaza.mockRejectedValue(new YaLiberadaError())
    await abrirInscritos()
    fireEvent.click(screen.getByRole('button', { name: 'Quitar a María García' }))
    fireEvent.click(screen.getAllByRole('button', { name: 'Sí, quitar' })[0])

    await waitFor(() => expect(screen.queryAllByText('María García')).toHaveLength(0))
    expect(screen.queryByText(/No se pudo quitar/)).not.toBeInTheDocument()
  })

  it('si falla, muestra el error y deja al inscrito en la lista', async () => {
    liberarPlaza.mockRejectedValue(new Error('permission-denied'))
    await abrirInscritos()
    fireEvent.click(screen.getByRole('button', { name: 'Quitar a María García' }))
    fireEvent.click(screen.getAllByRole('button', { name: 'Sí, quitar' })[0])

    expect(await screen.findByText('No se pudo quitar al inscrito. Inténtalo de nuevo.')).toBeInTheDocument()
    expect(screen.getAllByText('María García').length).toBeGreaterThan(0)
  })

  it('en móvil, la barra fija de abajo nombra a quién se quita y también confirma', async () => {
    await abrirInscritos()
    fireEvent.click(screen.getByRole('button', { name: 'Quitar a María García' }))
    expect(screen.getByText(/^¿Quitar a/)).toHaveTextContent('¿Quitar a María García y liberar su plaza?')

    fireEvent.click(screen.getAllByRole('button', { name: 'Sí, quitar' })[1])
    await waitFor(() => expect(screen.queryAllByText('María García')).toHaveLength(0))
    expect(liberarPlaza).toHaveBeenCalledWith(7, 'u1')
  })

  it('móvil: las tarjetas no tienen "Quitar" hasta pulsar Gestionar, y Listo lo vuelve a ocultar', async () => {
    await abrirInscritos()
    const lista = screen.getByRole('list', { name: 'Lista de inscritos' })
    expect(within(lista).queryAllByRole('button')).toHaveLength(0)

    fireEvent.click(screen.getByRole('button', { name: 'Gestionar' }))
    expect(within(lista).getAllByRole('button', { name: /^Quitar a / })).toHaveLength(2)

    fireEvent.click(screen.getByRole('button', { name: 'Listo' }))
    expect(within(lista).queryAllByRole('button')).toHaveLength(0)
  })

  it('móvil: Gestionar → Quitar → confirmar en la barra de abajo quita a esa persona', async () => {
    await abrirInscritos()
    fireEvent.click(screen.getByRole('button', { name: 'Gestionar' }))
    const lista = screen.getByRole('list', { name: 'Lista de inscritos' })
    fireEvent.click(within(lista).getByRole('button', { name: 'Quitar a Juan Pérez' }))
    expect(screen.getByText(/^¿Quitar a/)).toHaveTextContent('¿Quitar a Juan Pérez y liberar su plaza?')

    fireEvent.click(screen.getAllByRole('button', { name: 'Sí, quitar' }).at(-1)!)
    await waitFor(() => expect(screen.queryAllByText('Juan Pérez')).toHaveLength(0))
    expect(liberarPlaza).toHaveBeenCalledWith(7, 'u2')
  })

  it('al abrir una jornada, el panel de eventos queda arriba plegado y se puede volver a desplegar', async () => {
    await abrirInscritos()
    // Plegado: ya no están las pestañas de Próximas/Pasadas, solo la jornada que se ve
    expect(screen.queryByRole('button', { name: /^Próximas/ })).not.toBeInTheDocument()
    expect(screen.getByText(/^Viendo:/)).toHaveTextContent('Viendo: Jornada 1')

    fireEvent.click(screen.getByRole('button', { name: 'Cambiar jornada ▾' }))
    expect(screen.getByRole('button', { name: /^Próximas/ })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Plegar ▴' }))
    expect(screen.queryByRole('button', { name: /^Próximas/ })).not.toBeInTheDocument()
  })

  it('el panel de eventos va antes que la lista de inscritos', async () => {
    await abrirInscritos()
    const eventos = screen.getByText('Eventos')
    const inscritos = screen.getByText('Inscritos')
    expect(eventos.compareDocumentPosition(inscritos) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })
})
