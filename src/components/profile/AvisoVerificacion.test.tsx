import { render, screen, fireEvent, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import i18n from '../../i18n/config'

let usuario: { email: string; emailVerified: boolean; conContrasena: boolean } | null = null
let reenviarImpl: (ruta?: string) => Promise<void> = async () => {}
let verificadoTrasComprobar = false
const rutas: (string | undefined)[] = []
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: usuario,
    reenviarVerificacion: (ruta?: string) => { rutas.push(ruta); return reenviarImpl(ruta) },
    comprobarVerificacion: async () => verificadoTrasComprobar,
  }),
}))

const { AvisoVerificacion } = await import('./AvisoVerificacion')

function montar(ruta = '/perfil') {
  render(<MemoryRouter initialEntries={[ruta]}><AvisoVerificacion /></MemoryRouter>)
}

describe('AvisoVerificacion', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('es')
    usuario = { email: 'ana@ull.edu.es', emailVerified: false, conContrasena: true }
    reenviarImpl = async () => {}
    verificadoTrasComprobar = false
    rutas.length = 0
  })

  it('no se muestra con el email verificado ni con cuentas de Google', () => {
    usuario = { email: 'a@b.com', emailVerified: true, conContrasena: true }
    montar()
    expect(screen.queryByText('Verifica tu email')).not.toBeInTheDocument()
    usuario = { email: 'a@gmail.com', emailVerified: false, conContrasena: false }
    montar()
    expect(screen.queryByText('Verifica tu email')).not.toBeInTheDocument()
  })

  it('aclara que no bloquea la inscripción', () => {
    montar()
    expect(screen.getByText('Verifica tu email')).toBeInTheDocument()
    expect(screen.getByText(/Tu inscripción no depende de esto/)).toBeInTheDocument()
  })

  it('reenviar: confirma el envío, vuelve al perfil en su idioma y espera 60 s antes de otro', async () => {
    vi.useFakeTimers()
    montar('/en/perfil')
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Reenviar correo' })) })
    expect(rutas).toEqual(['/en/perfil'])
    expect(screen.getByText(/Correo enviado a ana@ull.edu.es/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reenviar en 60 s' })).toBeDisabled()
    // Segundo a segundo: cada tic re-renderiza y programa el siguiente.
    for (let i = 0; i < 60; i++) await act(async () => { vi.advanceTimersByTime(1000) })
    expect(screen.getByRole('button', { name: 'Reenviar correo' })).toBeEnabled()
    vi.useRealTimers()
  })

  it('demasiados intentos: lo explica', async () => {
    reenviarImpl = async () => { throw Object.assign(new Error('x'), { code: 'auth/too-many-requests' }) }
    montar()
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Reenviar correo' })) })
    expect(screen.getByText(/Has pedido varios correos seguidos/)).toBeInTheDocument()
  })

  it('"Ya lo verifiqué" sin haberlo hecho: dice qué hacer', async () => {
    montar()
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Ya lo verifiqué' })) })
    expect(screen.getByText(/Todavía aparece sin verificar/)).toBeInTheDocument()
  })
})
