import { render, screen, fireEvent, act } from '@testing-library/react'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import i18n from '../i18n/config'

// Función normal y no vi.fn(): el mock de Vitest deja la promesa rechazada
// sin manejar por su cuenta (para su registro de resultados) y el test
// fallaba aunque AuthPage sí captura el error.
let signIn: (email: string, password: string) => Promise<unknown> = async () => 'user'
const signUp = vi.hoisted(() => vi.fn(async () => 'user'))
const signOut = vi.hoisted(() => vi.fn(async () => {}))
let signUpImpl: (() => Promise<unknown>) | null = null
let signInWithGoogle: () => Promise<unknown> = async () => ({ role: 'user', isNewUser: false })
const iniciarGoogleRedireccion = vi.hoisted(() => vi.fn(async () => {}))
let completarGoogleRedireccion: () => Promise<unknown> = async () => null
let usuarioActual: { uid: string; email: string; displayName: string | null } | null = null
let rolActual: 'user' | 'admin' | null = null
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: usuarioActual,
    userRole: rolActual,
    signIn: (e: string, p: string) => signIn(e, p),
    signUp: (...a: unknown[]) => (signUpImpl ? signUpImpl() : signUp(...(a as []))),
    signInWithGoogle: () => signInWithGoogle(),
    iniciarGoogleRedireccion,
    completarGoogleRedireccion: () => completarGoogleRedireccion(),
    signOut,
  }),
}))
const sendPasswordReset = vi.hoisted(() => vi.fn(async () => {}))
vi.mock('../lib/auth', () => ({ sendPasswordReset }))

const { AuthPage } = await import('./AuthPage')
const { marcarInscripcionPendiente, getInscripcionPendiente, limpiarInscripcionPendiente } = await import('../lib/inscripcionPendiente')
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

  it('fallo de red con internet (red institucional): lo explica, sugiere datos móviles y da el contacto', async () => {
    signIn = async () => { throw Object.assign(new Error('firebase'), { code: 'auth/network-request-failed' }) }
    await montar('/login', 'es')
    fireEvent.change(screen.getByPlaceholderText('tu@email.com'), { target: { value: 'ana@ull.edu.es' } })
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'loquesea1' } })
    fireEvent.click(screen.getAllByRole('button', { name: 'Iniciar sesión' }).at(-1)!)
    expect(await screen.findByText(/red de una universidad o institución/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'diasporaspatrimoniales@gmail.com' })).toBeInTheDocument()
  })

  it('fallo de red sin internet en el dispositivo: dice que no hay internet', async () => {
    signIn = async () => { throw Object.assign(new Error('firebase'), { code: 'auth/network-request-failed' }) }
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true })
    try {
      await montar('/login', 'es')
      fireEvent.change(screen.getByPlaceholderText('tu@email.com'), { target: { value: 'ana@ull.edu.es' } })
      fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'loquesea1' } })
      fireEvent.click(screen.getAllByRole('button', { name: 'Iniciar sesión' }).at(-1)!)
      expect(await screen.findByText(/No hay conexión a internet/)).toBeInTheDocument()
    } finally {
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true })
    }
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

describe('AuthPage — dentro del navegador de una app', () => {
  const uaOriginal = navigator.userAgent
  const ponerUA = (ua: string) => Object.defineProperty(navigator, 'userAgent', { value: ua, configurable: true })
  afterEach(() => ponerUA(uaOriginal))

  const INSTAGRAM_IOS = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 334.0.4.32.98 (iPhone14,5; iOS 17_5; es_ES)'
  const INSTAGRAM_ANDROID = 'Mozilla/5.0 (Linux; Android 14; Pixel 7; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/122.0 Mobile Safari/537.36 Instagram 321.0.0.39.106 Android'
  const WEBVIEW_ANDROID = 'Mozilla/5.0 (Linux; Android 13; SM-G991B; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/120.0 Mobile Safari/537.36'

  it('Instagram en iPhone: explica cómo abrir en Safari, desactiva Google y deja el email', async () => {
    ponerUA(INSTAGRAM_IOS)
    await montar('/login', 'es')
    expect(screen.getByText('Estás dentro de Instagram y Google no permite iniciar sesión desde aquí.')).toBeInTheDocument()
    expect(screen.getByText(/Abrir en Safari/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Continuar con Google/ })).toBeDisabled()
    expect(screen.queryByRole('link', { name: 'Abrir en Chrome' })).not.toBeInTheDocument()
    expect(screen.getByText(/sigue aquí con tu email y contraseña/)).toBeInTheDocument()
    expect(screen.getByPlaceholderText('tu@email.com')).toBeEnabled()
  })

  it('Copiar enlace: lo copia y lo confirma', async () => {
    ponerUA(INSTAGRAM_IOS)
    const copiado: string[] = []
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: async (t: string) => { copiado.push(t) } }, configurable: true })
    await montar('/login', 'es')
    fireEvent.click(screen.getByRole('button', { name: 'Copiar enlace' }))
    expect(await screen.findByText('Enlace copiado. Pégalo en Safari o Chrome.')).toBeInTheDocument()
    expect(copiado).toEqual([window.location.href])
  })

  it('si la app no deja usar el portapapeles, muestra el enlace para copiarlo a mano', async () => {
    ponerUA(INSTAGRAM_IOS)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: async () => { throw new Error('bloqueado') } }, configurable: true })
    await montar('/login', 'es')
    fireEvent.click(screen.getByRole('button', { name: 'Copiar enlace' }))
    expect(await screen.findByLabelText('Enlace de esta página')).toHaveValue(window.location.href)
  })

  it('Instagram en Android: botón directo "Abrir en Chrome"', async () => {
    ponerUA(INSTAGRAM_ANDROID)
    await montar('/en/login', 'en')
    expect(screen.getByText("You're inside Instagram, and Google doesn't allow signing in from here.")).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open in Chrome' }).getAttribute('href')).toMatch(/^intent:\/\/.*package=com\.android\.chrome/)
  })

  it('WebView sin app identificada: avisa, pero no desactiva Google (por si fuera un falso positivo)', async () => {
    ponerUA(WEBVIEW_ANDROID)
    await montar('/login', 'es')
    expect(screen.getByText(/Parece que estás en el navegador de una app/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Continuar con Google/ })).toBeEnabled()
  })

  it('en un navegador normal no sale nada', async () => {
    await montar('/login', 'es')
    expect(screen.queryByText(/Abre esta página en tu navegador/)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Continuar con Google/ })).toBeEnabled()
  })
})

describe('AuthPage — Google por redirección (Chrome/Firefox/Edge de iPhone)', () => {
  const uaOriginal = navigator.userAgent
  const CHROME_IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/126.0.6478.54 Mobile/15E148 Safari/604.1'
  const SAFARI_IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'
  const ponerUA = (ua: string) => Object.defineProperty(navigator, 'userAgent', { value: ua, configurable: true })
  const pendiente = () => JSON.parse(sessionStorage.getItem('login_google_redireccion') ?? 'null')

  beforeEach(async () => {
    sessionStorage.clear()
    iniciarGoogleRedireccion.mockClear()
    completarGoogleRedireccion = async () => null
    signInWithGoogle = async () => ({ role: 'user', isNewUser: false })
    limpiarInscripcionPendiente()
    await i18n.changeLanguage('es')
  })
  afterEach(() => ponerUA(uaOriginal))

  function Ruta() { return <p data-testid="ruta">{useLocation().pathname}</p> }
  function montarEn(entradas: Parameters<typeof MemoryRouter>[0]['initialEntries'], indice?: number) {
    render(
      <MemoryRouter initialEntries={entradas} initialIndex={indice}>
        <Routes>
          <Route path="/login" element={<AuthPage />} />
          <Route path="/en/login" element={<AuthPage />} />
          <Route path="*" element={<Ruta />} />
        </Routes>
      </MemoryRouter>,
    )
  }

  it('Chrome de iPhone: va a Google en la misma pestaña (no ventana emergente) guardando el destino', async () => {
    ponerUA(CHROME_IPHONE)
    let popup = false
    signInWithGoogle = async () => { popup = true; return { role: 'user', isNewUser: false } }
    montarEn(['/login'])
    fireEvent.click(screen.getByRole('button', { name: /Continuar con Google/ }))
    await vi.waitFor(() => expect(iniciarGoogleRedireccion).toHaveBeenCalledOnce())
    expect(popup).toBe(false)
    expect(pendiente()).toMatchObject({ destino: { tipo: 'bienvenida' }, inscripcion: null })
  })

  it('desde "Inscribirme" de una jornada: guarda la jornada y la inscripción pendiente', async () => {
    ponerUA(CHROME_IPHONE)
    marcarInscripcionPendiente(1)
    montarEn(['/actividades/1', { pathname: '/login', state: { background: { pathname: '/actividades/1', search: '', hash: '' } } }], 1)
    fireEvent.click(screen.getByRole('button', { name: /Continuar con Google/ }))
    await vi.waitFor(() => expect(iniciarGoogleRedireccion).toHaveBeenCalledOnce())
    expect(pendiente()).toMatchObject({ destino: { tipo: 'volver', ruta: '/actividades/1' }, inscripcion: 1 })
  })

  it('Safari de iPhone sigue con la ventana emergente', async () => {
    ponerUA(SAFARI_IPHONE)
    let popup = false
    signInWithGoogle = async () => { popup = true; return { role: 'user', isNewUser: false } }
    montarEn(['/login'])
    fireEvent.click(screen.getByRole('button', { name: /Continuar con Google/ }))
    await vi.waitFor(() => expect(popup).toBe(true))
    expect(iniciarGoogleRedireccion).not.toHaveBeenCalled()
  })

  it('al volver de Google: "Entrando…" y luego a la jornada, con el formulario de inscripción pendiente', async () => {
    sessionStorage.setItem('login_google_redireccion', JSON.stringify({ destino: { tipo: 'volver', ruta: '/en/actividades/1' }, inscripcion: 1, en: Date.now() }))
    let resolver: (v: unknown) => void = () => {}
    completarGoogleRedireccion = () => new Promise(r => { resolver = r })
    montarEn(['/en/login'])
    expect(screen.getByRole('status')).toHaveTextContent(i18n.t('auth.entrando'))
    await act(async () => { resolver({ role: 'user', isNewUser: false }) })
    expect(screen.getByTestId('ruta')).toHaveTextContent('/en/actividades/1')
    expect(getInscripcionPendiente()).toBe(1)
    expect(pendiente()).toBeNull()
  })

  it('al volver de Google desde el menú: bienvenida', async () => {
    sessionStorage.setItem('login_google_redireccion', JSON.stringify({ destino: { tipo: 'bienvenida' }, inscripcion: null, en: Date.now() }))
    completarGoogleRedireccion = async () => ({ role: 'user', isNewUser: true })
    montarEn(['/login'])
    expect(await screen.findByRole('heading', { name: '¡Cuenta creada!' })).toBeInTheDocument()
  })

  it('volvió de Google sin elegir cuenta: de vuelta al formulario, sin errores', async () => {
    sessionStorage.setItem('login_google_redireccion', JSON.stringify({ destino: { tipo: 'bienvenida' }, inscripcion: null, en: Date.now() }))
    completarGoogleRedireccion = async () => null
    montarEn(['/login'])
    expect(await screen.findByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('error al volver (email con contraseña): mensaje con salida, email escrito', async () => {
    sessionStorage.setItem('login_google_redireccion', JSON.stringify({ destino: { tipo: 'bienvenida' }, inscripcion: null, en: Date.now() }))
    completarGoogleRedireccion = async () => { throw Object.assign(new Error('x'), { code: 'auth/account-exists-with-different-credential', customData: { email: 'ana@ull.edu.es' } }) }
    montarEn(['/login'])
    expect(await screen.findByText(/Este email ya tiene una cuenta con contraseña/)).toBeInTheDocument()
    expect(screen.getByPlaceholderText('tu@email.com')).toHaveValue('ana@ull.edu.es')
  })
})
