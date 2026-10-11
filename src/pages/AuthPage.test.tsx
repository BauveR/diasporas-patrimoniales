import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import i18n from '../i18n/config'

// Función normal y no vi.fn(): el mock de Vitest deja la promesa rechazada
// sin manejar por su cuenta (para su registro de resultados) y el test
// fallaba aunque AuthPage sí captura el error.
let signIn: (email: string, password: string) => Promise<unknown> = async () => 'user'
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ user: null, signIn: (e: string, p: string) => signIn(e, p), signUp: vi.fn(), signInWithGoogle: vi.fn() }),
}))
vi.mock('../lib/auth', () => ({ sendPasswordReset: vi.fn() }))

const { AuthPage } = await import('./AuthPage')

async function montar(ruta: string, idioma: string) {
  await i18n.changeLanguage(idioma)
  render(<MemoryRouter initialEntries={[ruta]}><AuthPage /></MemoryRouter>)
}

describe('AuthPage — idiomas', () => {
  beforeEach(() => { signIn = async () => 'user' })

  it('en español por defecto', async () => {
    await montar('/login', 'es')
    expect(screen.getByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Correo institucional\? Crea tu cuenta aquí/ })).toBeInTheDocument()
  })

  it.each([
    ['en', 'Sign in', /Institutional email\? Create your account here/, 'Create account', 'First name'],
    ['fr', 'Se connecter', /Adresse institutionnelle \? Créez votre compte ici/, 'Créer un compte', 'Prénom'],
    ['pt', 'Iniciar sessão', /Email institucional\? Crie a sua conta aqui/, 'Criar conta', 'Nome'],
  ])('/%s/login sale traducido', async (idioma, titulo, institucional, crear, nombre) => {
    await montar(`/${idioma}/login`, idioma)
    expect(screen.getByRole('heading', { name: titulo })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: institucional }))
    expect(screen.getByRole('heading', { name: crear })).toBeInTheDocument()
    expect(screen.getByLabelText(nombre)).toBeInTheDocument()
  })

  it('los errores también salen traducidos (credenciales incorrectas, en inglés)', async () => {
    signIn = async () => { throw Object.assign(new Error('firebase'), { code: 'auth/invalid-credential' }) }
    await montar('/en/login', 'en')
    fireEvent.change(screen.getByPlaceholderText('you@email.com'), { target: { value: 'ana@ull.edu.es' } })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'una-contraseña' } })
    fireEvent.click(screen.getAllByRole('button', { name: 'Sign in' }).at(-1)!)
    expect(await screen.findByText('Incorrect email or password')).toBeInTheDocument()
  })

  it('las cuatro traducciones tienen las mismas claves', async () => {
    const claves = (o: object, p = ''): string[] => Object.entries(o).flatMap(([k, v]) => typeof v === 'object' ? claves(v, `${p}${k}.`) : [`${p}${k}`])
    const base = claves(i18n.getResourceBundle('es', 'translation').auth).sort()
    for (const l of ['en', 'fr', 'pt']) {
      expect(claves(i18n.getResourceBundle(l, 'translation').auth).sort()).toEqual(base)
    }
  })
})
