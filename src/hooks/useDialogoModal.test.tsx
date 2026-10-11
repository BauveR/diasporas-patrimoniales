import { render, screen, fireEvent } from '@testing-library/react'
import { useRef, useState } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { vi, describe, it, expect } from 'vitest'
import { useDialogoModal } from './useDialogoModal'

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ user: null, userRole: null, signIn: vi.fn(), signUp: vi.fn(), signInWithGoogle: vi.fn(), signOut: vi.fn() }),
}))
vi.mock('../lib/auth', () => ({ sendPasswordReset: vi.fn() }))

function Ventana({ alCerrar }: { alCerrar: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  useDialogoModal(ref, alCerrar)
  return (
    <div ref={ref} role="dialog" aria-modal="true" aria-label="Prueba" tabIndex={-1}>
      <button type="button">Primero</button>
      <input aria-label="Campo" />
      <button type="button">Último</button>
    </div>
  )
}

function Pagina({ alCerrar = () => {} }: { alCerrar?: () => void }) {
  const [abierta, setAbierta] = useState(false)
  return (
    <>
      <button type="button" onClick={() => setAbierta(true)}>Abrir</button>
      <button type="button">Detrás</button>
      {abierta && <Ventana alCerrar={() => { alCerrar(); setAbierta(false) }} />}
    </>
  )
}

describe('useDialogoModal', () => {
  it('al abrir, el foco entra en la ventana', () => {
    render(<Pagina />)
    fireEvent.click(screen.getByRole('button', { name: 'Abrir' }))
    expect(screen.getByRole('dialog')).toHaveFocus()
  })

  it('Escape la cierra y el foco vuelve al botón que la abrió', () => {
    const alCerrar = vi.fn()
    render(<Pagina alCerrar={alCerrar} />)
    const abrir = screen.getByRole('button', { name: 'Abrir' })
    abrir.focus()
    fireEvent.click(abrir)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(alCerrar).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(abrir).toHaveFocus()
  })

  it('Tab desde el último vuelve al primero y Mayús+Tab desde el primero va al último', () => {
    render(<Pagina />)
    fireEvent.click(screen.getByRole('button', { name: 'Abrir' }))
    screen.getByRole('button', { name: 'Último' }).focus()
    fireEvent.keyDown(document, { key: 'Tab' })
    expect(screen.getByRole('button', { name: 'Primero' })).toHaveFocus()
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true })
    expect(screen.getByRole('button', { name: 'Último' })).toHaveFocus()
  })

  it('si el foco estaba fuera (en la página de detrás), Tab lo devuelve a la ventana', () => {
    render(<Pagina />)
    fireEvent.click(screen.getByRole('button', { name: 'Abrir' }))
    screen.getByRole('button', { name: 'Detrás' }).focus()
    fireEvent.keyDown(document, { key: 'Tab' })
    expect(screen.getByRole('button', { name: 'Primero' })).toHaveFocus()
  })
})

describe('AuthModal', () => {
  it('es un diálogo con nombre (el título de la pantalla) y recibe el foco al abrir', async () => {
    const { AuthModal } = await import('../components/auth/AuthModal')
    render(<MemoryRouter initialEntries={['/', '/login']} initialIndex={1}><AuthModal /></MemoryRouter>)
    const dialogo = await screen.findByRole('dialog', { name: 'Iniciar sesión' })
    expect(dialogo).toHaveAttribute('aria-modal', 'true')
    expect(dialogo).toHaveFocus()
  })
})
