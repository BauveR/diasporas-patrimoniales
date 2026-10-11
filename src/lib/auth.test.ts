import { describe, it, expect, vi, beforeEach } from 'vitest'

// Funciones normales y no vi.fn() con promesas rechazadas: ver el comentario
// en AuthPage.test.tsx (Vitest deja esas promesas como "sin manejar").
let updateProfileImpl: () => Promise<void> = async () => {}
let setDocImpl: () => Promise<void> = async () => {}
let docExiste = false
let rolGuardado: string | undefined
const setDocLlamadas: unknown[][] = []
const envios: { tipo: string; ajustes: unknown }[] = []
let envioImpl: (ajustes: unknown) => Promise<void> = async () => {}
const usuarioFirebase = { uid: 'u1', email: 'ana@ull.edu.es', displayName: null, getIdToken: async () => 't' }

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: async () => ({ user: usuarioFirebase }),
  signInWithPopup: vi.fn(),
  getAdditionalUserInfo: vi.fn(),
  GoogleAuthProvider: class {},
  signOut: vi.fn(),
  sendPasswordResetEmail: (_a: unknown, _e: string, ajustes: unknown) => { envios.push({ tipo: 'reset', ajustes }); return envioImpl(ajustes) },
  updateProfile: () => updateProfileImpl(),
}))
vi.mock('firebase/firestore', () => ({
  doc: (_db: unknown, ...ruta: string[]) => ruta.join('/'),
  getDoc: async () => ({ exists: () => docExiste, data: () => (docExiste ? { role: rolGuardado } : undefined) }),
  setDoc: (...args: unknown[]) => { setDocLlamadas.push(args); return setDocImpl() },
  serverTimestamp: () => 'ts',
}))
vi.mock('./firebase', () => ({ auth: { currentUser: usuarioFirebase }, db: {} }))

const { signUp, getUserRole, sendPasswordReset } = await import('./auth')

const origen = window.location.origin

describe('recuperar contraseña con enlace de vuelta al sitio', () => {
  beforeEach(() => {
    envios.length = 0
    envioImpl = async () => {}
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  it('crear cuenta no envía ningún correo de verificación (sin pasos extra)', async () => {
    await signUp('Ana García', 'ana@ull.edu.es', 'viaje2canarias')
    expect(envios).toEqual([])
  })

  it('vuelve al login en el idioma actual', async () => {
    await sendPasswordReset('ana@ull.edu.es', '/fr/login')
    expect(envios).toEqual([{ tipo: 'reset', ajustes: { url: `${origen}/fr/login` } }])
  })

  it('dominio no autorizado (ej. preview de Vercel): reintenta sin el enlace y el correo sale igual', async () => {
    envioImpl = async ajustes => { if (ajustes) throw Object.assign(new Error('x'), { code: 'auth/unauthorized-continue-uri' }) }
    await sendPasswordReset('ana@ull.edu.es')
    expect(envios.map(e => e.ajustes)).toEqual([{ url: `${origen}/login` }, undefined])
  })

  it('otros errores sí se propagan (los muestra la pantalla)', async () => {
    envioImpl = async () => { throw Object.assign(new Error('x'), { code: 'auth/too-many-requests' }) }
    await expect(sendPasswordReset('ana@ull.edu.es')).rejects.toMatchObject({ code: 'auth/too-many-requests' })
  })
})

const usuario = { uid: 'u1', email: 'ana@ull.edu.es', displayName: 'Ana García', getIdToken: async () => 't' }

describe('signUp', () => {
  beforeEach(() => {
    updateProfileImpl = async () => {}
    setDocImpl = async () => {}
    docExiste = false
    setDocLlamadas.length = 0
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('crea la cuenta y la ficha con el nombre', async () => {
    const u = await signUp('Ana García', 'ana@ull.edu.es', 'viaje2canarias')
    expect(u.displayName).toBe('Ana García')
    expect(setDocLlamadas[0][1]).toMatchObject({ displayName: 'Ana García', role: 'user' })
  })

  it('si Firestore y el nombre fallan tras crear la cuenta, no lanza (la cuenta ya existe)', async () => {
    updateProfileImpl = async () => { throw new Error('red') }
    setDocImpl = async () => { throw new Error('bloqueado') }
    const u = await signUp('Ana García', 'ana@ull.edu.es', 'viaje2canarias')
    expect(u.uid).toBe('u1')
    expect(u.displayName).toBe('Ana García')
  })
})

describe('getUserRole', () => {
  beforeEach(() => {
    setDocImpl = async () => {}
    setDocLlamadas.length = 0
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('sin ficha: la crea (merge, role user, sin pisar el nombre) y devuelve user', async () => {
    docExiste = false
    expect(await getUserRole(usuario)).toBe('user')
    expect(setDocLlamadas).toHaveLength(1)
    expect(setDocLlamadas[0][1]).toMatchObject({ email: 'ana@ull.edu.es', displayName: 'Ana García', role: 'user' })
    expect(setDocLlamadas[0][2]).toEqual({ merge: true })
  })

  it('sin ficha y sin poder crearla: devuelve user igualmente', async () => {
    docExiste = false
    setDocImpl = async () => { throw new Error('bloqueado') }
    expect(await getUserRole(usuario)).toBe('user')
  })

  it('con ficha de admin: admin, sin escribir nada', async () => {
    docExiste = true
    rolGuardado = 'admin'
    expect(await getUserRole(usuario)).toBe('admin')
    expect(setDocLlamadas).toHaveLength(0)
  })
})
