import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import i18n from '../i18n/config'

// Función normal y no vi.fn(): el mock de Vitest deja la promesa rechazada
// sin manejar por su cuenta (para su registro de resultados) y el test
// fallaba aunque AuthPage sí captura el error.
let signIn: (email: string, password: string) => Promise<unknown> = async () => 'user'
const signUp = vi.hoisted(() => vi.fn(async () => 'user'))
const signOut = vi.hoisted(() => vi.fn(async () => {}))
let signUpImpl: (() => Promise<unknown>) | null = null
let signInWithGoogle: () => Promise<unknown> = async () => ({ role: 'user', isNewUser: false })
let usuarioActual: { uid: string; email: string; displayName: string | null } | null = null
let rolActual: 'user' | 'admin' | null = null
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: usuarioActual,
    userRole: rolActual,
    signIn: (e: string, p: string) => signIn(e, p),
    signUp: (...a: unknown[]) => (signUpImpl ? signUpImpl() : signUp(...(a as []))),
    signInWithGoogle: () => signInWithGoogle(),
    signOut,
  }),
}))
const sendPasswordReset = vi.hoisted(() => vi.fn(async () => {}))
vi.mock('../lib/auth', () => ({ sendPasswordReset }))

const { AuthPage } = await import('./AuthPage')
// jsdom no implementa scrollTo (AuthPage sube al cambiar de pantalla).
window.scrollTo = vi.fn() as typeof window.scrollTo

// Sin sesión por defecto; los tests de "sesión ya iniciada" la ponen ellos.
beforeEach(() => { usuarioActual = null; rolActual = null })

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

describe('AuthPage — contraseña al crear cuenta', () => {
  beforeEach(() => { signUp.mockClear() })

  async function rellenarRegistro(pass: string, repetida: string, email = 'ana@ull.edu.es') {
    await montar('/login', 'es')
    fireEvent.click(screen.getByRole('button', { name: /Correo institucional\? Crea tu cuenta aquí/ }))
    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Ana' } })
    fireEvent.change(screen.getByLabelText('Apellidos'), { target: { value: 'García' } })
    fireEvent.change(screen.getByPlaceholderText('tu@email.com'), { target: { value: email } })
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: pass } })
    fireEvent.change(screen.getByLabelText('Repite la contraseña'), { target: { value: repetida } })
    fireEvent.click(screen.getAllByRole('button', { name: 'Crear cuenta' }).at(-1)!)
  }

  it('el login pide la contraseña una sola vez', async () => {
    await montar('/login', 'es')
    expect(screen.queryByLabelText('Repite la contraseña')).not.toBeInTheDocument()
  })

  it('si no coinciden, avisa y no crea la cuenta', async () => {
    await rellenarRegistro('contraseña-1', 'contraseña-2')
    expect(screen.getAllByText('Las contraseñas no coinciden').length).toBeGreaterThan(0)
    expect(screen.getByLabelText('Repite la contraseña')).toHaveAttribute('aria-invalid', 'true')
    expect(signUp).not.toHaveBeenCalled()
  })

  it('si coinciden, crea la cuenta', async () => {
    await rellenarRegistro('contraseña-1', 'contraseña-1')
    expect(screen.queryByText('Las contraseñas no coinciden')).not.toBeInTheDocument()
    expect(signUp).toHaveBeenCalledWith('Ana García', 'ana@ull.edu.es', 'contraseña-1')
  })

  it('una cuenta antigua con contraseña corta (mínimo de Firebase, 6) sigue pudiendo entrar', async () => {
    const recibido: string[] = []
    signIn = async (_e, p) => { recibido.push(p); return 'user' }
    await montar('/login', 'es')
    expect(screen.queryByText('Tu contraseña debe tener:')).not.toBeInTheDocument()
    fireEvent.change(screen.getByPlaceholderText('tu@email.com'), { target: { value: 'ana@ull.edu.es' } })
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'abcdef' } })
    fireEvent.click(screen.getAllByRole('button', { name: 'Iniciar sesión' }).at(-1)!)
    await vi.waitFor(() => expect(recibido).toEqual(['abcdef']))
  })

  it('sin número: no crea la cuenta y marca el requisito que falta', async () => {
    await rellenarRegistro('solamenteletras', 'solamenteletras')
    expect(screen.getByText('La contraseña no cumple todos los requisitos')).toBeInTheDocument()
    expect(screen.getByText('Un número').closest('li')).toHaveClass('text-red-500')
    expect(screen.getByText('Una letra').closest('li')).toHaveClass('text-emerald-700')
    expect(signUp).not.toHaveBeenCalled()
  })

  it('contraseña muy común: avisa y no crea la cuenta', async () => {
    await rellenarRegistro('password1', 'password1')
    // Una sola vez, junto al campo (no repetido abajo).
    expect(screen.getAllByText(/Es una contraseña muy común/)).toHaveLength(1)
    expect(signUp).not.toHaveBeenCalled()
  })

  it('con el email dentro: avisa y no crea la cuenta', async () => {
    await rellenarRegistro('mgarcia2026', 'mgarcia2026', 'mgarcia@ull.edu.es')
    expect(screen.getAllByText('No uses tu email dentro de la contraseña')).toHaveLength(1)
    expect(signUp).not.toHaveBeenCalled()
  })

  it('la lista de requisitos se ve antes de escribir y la barra al escribir', async () => {
    await montar('/login', 'es')
    fireEvent.click(screen.getByRole('button', { name: /Correo institucional\? Crea tu cuenta aquí/ }))
    expect(screen.getByText('Al menos 8 caracteres')).toBeInTheDocument()
    expect(screen.queryByText(/Seguridad:/)).not.toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'viaje2canarias' } })
    expect(screen.getByText('Seguridad: fuerte')).toBeInTheDocument()
  })

  it('el ojo muestra y oculta cada contraseña por separado', async () => {
    await montar('/login', 'es')
    fireEvent.click(screen.getByRole('button', { name: /Correo institucional\? Crea tu cuenta aquí/ }))
    const pass = screen.getByLabelText('Contraseña')
    const repetida = screen.getByLabelText('Repite la contraseña')
    expect(pass).toHaveAttribute('type', 'password')
    fireEvent.click(screen.getAllByRole('button', { name: 'Mostrar contraseña' })[0])
    expect(pass).toHaveAttribute('type', 'text')
    expect(repetida).toHaveAttribute('type', 'password')
    fireEvent.click(screen.getByRole('button', { name: 'Ocultar contraseña' }))
    expect(pass).toHaveAttribute('type', 'password')
  })
})

describe('AuthPage — cada error tiene salida', () => {
  beforeEach(() => {
    usuarioActual = null
    rolActual = null
    signUpImpl = null
    signIn = async () => 'user'
    signInWithGoogle = async () => ({ role: 'user', isNewUser: false })
  })

  it('email ya registrado al crear cuenta: botón para iniciar sesión con ese email', async () => {
    signUpImpl = async () => { throw Object.assign(new Error('firebase'), { code: 'auth/email-already-in-use' }) }
    await montar('/login', 'es')
    fireEvent.click(screen.getByRole('button', { name: /Correo institucional\? Crea tu cuenta aquí/ }))
    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Ana' } })
    fireEvent.change(screen.getByLabelText('Apellidos'), { target: { value: 'García' } })
    fireEvent.change(screen.getByPlaceholderText('tu@email.com'), { target: { value: 'ana@ull.edu.es' } })
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'viaje2canarias' } })
    fireEvent.change(screen.getByLabelText('Repite la contraseña'), { target: { value: 'viaje2canarias' } })
    fireEvent.click(screen.getAllByRole('button', { name: 'Crear cuenta' }).at(-1)!)
    expect(await screen.findByText(/Ya existe una cuenta con este email/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Recuperar contraseña' })).toBeInTheDocument()
    fireEvent.click(screen.getAllByRole('button', { name: 'Iniciar sesión' })[0])
    expect(screen.getByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument()
    expect(screen.getByPlaceholderText('tu@email.com')).toHaveValue('ana@ull.edu.es')
  })

  it('Google con un email que ya tiene contraseña: al login con su email, no a "crea tu cuenta"', async () => {
    signInWithGoogle = async () => { throw Object.assign(new Error('firebase'), { code: 'auth/account-exists-with-different-credential', customData: { email: 'ana@ull.edu.es' } }) }
    await montar('/login', 'es')
    fireEvent.click(screen.getByRole('button', { name: /Continuar con Google/ }))
    expect(await screen.findByText(/Este email ya tiene una cuenta con contraseña/)).toBeInTheDocument()
    expect(screen.getByPlaceholderText('tu@email.com')).toHaveValue('ana@ull.edu.es')
    expect(screen.queryByText(/No pudiste entrar con Google/)).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'No recuerdo mi contraseña' }))
    expect(screen.getByRole('heading', { name: 'Recuperar contraseña' })).toBeInTheDocument()
  })

  it('credenciales incorrectas: recuerda que quizá se registró con Google', async () => {
    signIn = async () => { throw Object.assign(new Error('firebase'), { code: 'auth/invalid-credential' }) }
    await montar('/login', 'es')
    fireEvent.change(screen.getByPlaceholderText('tu@email.com'), { target: { value: 'ana@ull.edu.es' } })
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'loquesea1' } })
    fireEvent.click(screen.getAllByRole('button', { name: 'Iniciar sesión' }).at(-1)!)
    expect(await screen.findByText(/Si creaste tu cuenta con Google/)).toBeInTheDocument()
  })

  it('error desconocido: ofrece el correo de contacto', async () => {
    signIn = async () => { throw Object.assign(new Error('firebase'), { code: 'auth/internal-error' }) }
    await montar('/login', 'es')
    fireEvent.change(screen.getByPlaceholderText('tu@email.com'), { target: { value: 'ana@ull.edu.es' } })
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'loquesea1' } })
    fireEvent.click(screen.getAllByRole('button', { name: 'Iniciar sesión' }).at(-1)!)
    expect(await screen.findByRole('link', { name: 'diasporaspatrimoniales@gmail.com' })).toHaveAttribute('href', 'mailto:diasporaspatrimoniales@gmail.com')
  })
})

describe('AuthPage — /login con la sesión ya iniciada', () => {
  beforeEach(() => { signOut.mockClear() })

  it('no vuelve a mostrar el formulario: dice con quién estás dentro', async () => {
    usuarioActual = { uid: 'u1', email: 'ana@ull.edu.es', displayName: 'Ana García' }
    await montar('/login', 'es')
    expect(screen.getByRole('heading', { name: 'Ya has iniciado sesión' })).toBeInTheDocument()
    expect(screen.getByText('Estás dentro como Ana García.')).toBeInTheDocument()
    expect(screen.queryByPlaceholderText('tu@email.com')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '¿No eres tú? Cerrar sesión' }))
    expect(signOut).toHaveBeenCalled()
  })

  it('al admin le ofrece su panel', async () => {
    usuarioActual = { uid: 'u1', email: 'admin@x.com', displayName: null }
    rolActual = 'admin'
    await montar('/en/login', 'en')
    expect(screen.getByText("You're signed in as admin@x.com.")).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Go to the admin panel' })).toBeInTheDocument()
  })
})

describe('AuthPage — tras crear cuenta y recuperar contraseña', () => {
  it('al crear cuenta, la bienvenida no pide verificar nada: va directo a inscribirse', async () => {
    signUpImpl = async () => {
      usuarioActual = { uid: 'u1', email: 'ana@ull.edu.es', displayName: 'Ana García' }
      return 'user'
    }
    await montar('/login', 'es')
    fireEvent.click(screen.getByRole('button', { name: /Correo institucional\? Crea tu cuenta aquí/ }))
    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Ana' } })
    fireEvent.change(screen.getByLabelText('Apellidos'), { target: { value: 'García' } })
    fireEvent.change(screen.getByPlaceholderText('tu@email.com'), { target: { value: 'ana@ull.edu.es' } })
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'viaje2canarias' } })
    fireEvent.change(screen.getByLabelText('Repite la contraseña'), { target: { value: 'viaje2canarias' } })
    fireEvent.click(screen.getAllByRole('button', { name: 'Crear cuenta' }).at(-1)!)
    expect(await screen.findByRole('heading', { name: '¡Cuenta creada!' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Inscribirme/ })).toBeInTheDocument()
    expect(screen.queryByText(/verific/i)).not.toBeInTheDocument()
  })

  it('recuperar contraseña pide volver al login en el idioma actual', async () => {
    await montar('/pt/login', 'pt')
    fireEvent.click(screen.getByRole('button', { name: i18n.t('auth.olvidaste') }))
    fireEvent.change(screen.getByPlaceholderText(i18n.t('auth.emailPlaceholder')), { target: { value: 'ana@ull.edu.es' } })
    fireEvent.click(screen.getByRole('button', { name: i18n.t('auth.reset.enviar') }))
    await vi.waitFor(() => expect(sendPasswordReset).toHaveBeenCalledWith('ana@ull.edu.es', '/pt/login'))
  })
})
