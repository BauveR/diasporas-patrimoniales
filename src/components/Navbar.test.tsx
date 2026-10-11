import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import i18n from '../i18n/config'

const signOut = vi.hoisted(() => vi.fn(async () => {}))
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { uid: 'u1', email: 'ana@ull.edu.es', displayName: 'Ana García' }, userRole: 'user', signOut }),
}))
vi.mock('../hooks/useIsDesktop', () => ({ useIsDesktop: () => true }))

const { Navbar } = await import('./Navbar')

function Ruta() {
  return <p data-testid="ruta">{useLocation().pathname}</p>
}

function montar(ruta: string) {
  render(
    <MemoryRouter initialEntries={[ruta]}>
      <Navbar />
      <Routes><Route path="*" element={<Ruta />} /></Routes>
    </MemoryRouter>,
  )
}

describe('Navbar — Salir', () => {
  beforeEach(async () => { signOut.mockClear(); await i18n.changeLanguage('es') })

  it.each([
    ['/perfil', '/'],
    ['/admin', '/'],
    ['/en/perfil', '/en'],
  ])('desde %s cierra sesión y va al inicio (%s), no al login', async (desde, hacia) => {
    montar(desde)
    fireEvent.click(screen.getByRole('button', { name: i18n.t('nav.salir') }))
    await waitFor(() => expect(signOut).toHaveBeenCalled())
    expect(screen.getByTestId('ruta')).toHaveTextContent(new RegExp(`^${hacia}$`))
  })

  it('desde una página pública se queda donde está', async () => {
    montar('/actividades/1')
    fireEvent.click(screen.getByRole('button', { name: i18n.t('nav.salir') }))
    await waitFor(() => expect(signOut).toHaveBeenCalled())
    expect(screen.getByTestId('ruta')).toHaveTextContent('/actividades/1')
  })
})
