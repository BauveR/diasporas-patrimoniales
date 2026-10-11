import { describe, it, expect, vi, beforeEach } from 'vitest'

// Funciones normales y no vi.fn() con promesas rechazadas: ver el comentario
// en AuthPage.test.tsx (Vitest deja esas promesas como "sin manejar").
let updateProfileImpl: () => Promise<void> = async () => {}
let setDocImpl: () => Promise<void> = async () => {}
let docExiste = false
let rolGuardado: string | undefined
const setDocLlamadas: unknown[][] = []

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: async () => ({ user: { uid: 'u1', email: 'ana@ull.edu.es', displayName: null, getIdToken: async () => 't' } }),
  signInWithPopup: vi.fn(),
  getAdditionalUserInfo: vi.fn(),
  GoogleAuthProvider: class {},
  signOut: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  updateProfile: () => updateProfileImpl(),
}))
vi.mock('firebase/firestore', () => ({
  doc: (_db: unknown, ...ruta: string[]) => ruta.join('/'),
  getDoc: async () => ({ exists: () => docExiste, data: () => (docExiste ? { role: rolGuardado } : undefined) }),
  setDoc: (...args: unknown[]) => { setDocLlamadas.push(args); return setDocImpl() },
  serverTimestamp: () => 'ts',
}))
vi.mock('./firebase', () => ({ auth: {}, db: {} }))

const { signUp, getUserRole } = await import('./auth')

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
