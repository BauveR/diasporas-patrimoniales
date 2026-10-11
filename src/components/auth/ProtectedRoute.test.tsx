import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { vi, describe, it, expect, afterEach } from 'vitest'

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: null, userRole: null, loading: false, authError: false }),
}))

const { ProtectedRoute } = await import('./ProtectedRoute')

function montar() {
  render(
    <MemoryRouter initialEntries={['/perfil']}>
      <Routes>
        <Route path="/perfil" element={<ProtectedRoute><p>Perfil</p></ProtectedRoute>} />
        <Route path="/login" element={<p>Pantalla de login</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ProtectedRoute sin sesión', () => {
  afterEach(() => window.history.replaceState({}, '', '/'))

  it('si es la página de la URL, manda al login', () => {
    window.history.replaceState({}, '', '/perfil')
    montar()
    expect(screen.getByText('Pantalla de login')).toBeInTheDocument()
  })

  it('si es la copia que está saliendo (Salir → inicio), no redirige al login', () => {
    window.history.replaceState({}, '', '/')
    montar()
    expect(screen.queryByText('Pantalla de login')).not.toBeInTheDocument()
    expect(screen.queryByText('Perfil')).not.toBeInTheDocument()
  })
})
