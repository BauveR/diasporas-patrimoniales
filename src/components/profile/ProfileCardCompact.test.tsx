import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi, describe, it, expect, afterEach } from 'vitest'
import i18n from '../../i18n/config'
import type { Actividad } from '../../data/actividades'

vi.mock('../../contexts/DataContext', () => ({ useDataContext: () => ({ sedes: [{ id: 1, isla: 'Tenerife' }] }) }))
const { ProfileCardCompact } = await import('./ProfileCardCompact')

const actividad = { id: 1, titulo: 'Día 1', fecha: '2026-11-12', hora: '09:00', sedeId: 1, imagen: 'x.png', plazas: 10, plazasDisponibles: 5 } as Actividad

describe('Mi perfil en otros idiomas', () => {
  afterEach(async () => { await i18n.changeLanguage('es') })

  it('tarjeta compacta en portugués: fecha, liberar plaza y enlace con el idioma', async () => {
    await i18n.changeLanguage('pt')
    render(<MemoryRouter initialEntries={['/pt/perfil']}><ProfileCardCompact actividad={actividad} onLiberar={async () => {}} /></MemoryRouter>)
    expect(screen.getByText(/12\/11/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Libertar vaga' })).toBeInTheDocument()
    expect(screen.getAllByRole('link')[0]).toHaveAttribute('href', '/pt/actividades/1')
  })

  it('cancelada en inglés', async () => {
    await i18n.changeLanguage('en')
    render(<MemoryRouter><ProfileCardCompact actividad={{ ...actividad, cancelada: true }} /></MemoryRouter>)
    expect(screen.getByText('Cancelled')).toBeInTheDocument()
    expect(screen.getByText('Event cancelled')).toBeInTheDocument()
  })

  it('contadores con plural correcto', async () => {
    expect(i18n.t('perfil.proximas', { count: 1 })).toBe('1 próxima')
    expect(i18n.t('perfil.proximas', { count: 2 })).toBe('2 próximas')
    await i18n.changeLanguage('fr')
    expect(i18n.t('perfil.pasadas', { count: 3 })).toBe('3 passées')
  })
})
