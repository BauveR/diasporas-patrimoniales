import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'

vi.mock('../../lib/db', () => ({
  getTelemetriaConexion: () => Promise.resolve({ modo_compatible: 3, recuperado: 3, sin_conexion: 2 }),
}))

import { EstadoConexion } from './EstadoConexion'

describe('EstadoConexion', () => {
  it('empieza plegada: solo el título y "Ver detalle", sin cifras', async () => {
    render(<EstadoConexion />)
    expect(await screen.findByRole('button', { name: 'Ver detalle ▾' })).toBeInTheDocument()
    expect(screen.queryByText(/modo compatible/)).not.toBeInTheDocument()
    expect(screen.queryByText(/sin conectar|no pudieron conectar/)).not.toBeInTheDocument()
  })

  it('"Ver detalle" muestra el desglose y "Plegar" lo oculta', async () => {
    render(<EstadoConexion />)
    fireEvent.click(screen.getByRole('button', { name: 'Ver detalle ▾' }))
    expect(await screen.findByText('Visitas que necesitaron modo compatible')).toBeInTheDocument()
    expect(screen.getByText('Visitas que no pudieron conectar')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Plegar ▴' }))
    expect(screen.queryByText('Visitas que necesitaron modo compatible')).not.toBeInTheDocument()
  })
})
