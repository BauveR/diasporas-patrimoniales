import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { AppUser, UserRole } from '../lib/auth'
import { loadAuth, loadDb } from '../lib/firebaseLoaders'
import { TIMEOUT_CONEXION_MS } from '../lib/conexion'

export type { UserRole }

type AuthContextValue = {
  user: AppUser | null
  userRole: UserRole | null
  loading: boolean
  inscripcionIds: number[]
  inscripcionesLoading: boolean
  // No cargó el módulo de Firebase Auth — sin esto `loading` no terminaba
  // nunca y ProtectedRoute quedaba en "Cargando..." para siempre.
  authError: boolean
  // El listener de inscripciones falló o no respondió a tiempo (ver
  // lib/conexion.ts) — Perfil muestra ConexionError en vez de cargar sin fin.
  inscripcionesError: boolean
  signIn: (email: string, password: string) => Promise<UserRole>
  signUp: (name: string, email: string, password: string) => Promise<UserRole>
  signInWithGoogle: () => Promise<{ role: UserRole; isNewUser: boolean }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

// signUp() calls firebase/auth's updateProfile() right after creating the
// account, which mutates the user object in place — but the very first
// onAuthStateChanged firing for that account (already queued by then) still
// carries the pre-update snapshot with displayName: null. If that stale
// event lands in React state after signUp()'s own setUser() already put the
// real name there, the name regresses back to null. Keep the richer name for
// the same uid instead of overwriting it with a same-uid-but-blanker one.
function mergeAuthUser(prev: AppUser | null, next: AppUser | null): AppUser | null {
  if (prev && next && prev.uid === next.uid && prev.displayName && !next.displayName) {
    return { ...next, displayName: prev.displayName }
  }
  return next
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null)
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)
  const [rawInscripcionIds, setRawInscripcionIds] = useState<number[]>([])
  const [rawInscripcionesLoading, setRawInscripcionesLoading] = useState(false)
  const [authError, setAuthError] = useState(false)
  const [rawInscripcionesError, setRawInscripcionesError] = useState(false)

  useEffect(() => {
    let cancelled = false
    let unsub = () => {}
    // import() dinámico: ver lib/firebaseLoaders.ts.
    loadAuth().then(({ subscribeAuthState, getUserRole }) => {
      if (cancelled) return
      unsub = subscribeAuthState(async authUser => {
        setUser(prev => mergeAuthUser(prev, authUser))
        if (!authUser) {
          setUserRole(null)
          setLoading(false)
          return
        }
        // Firestore read, not derived from the auth user itself — role must
        // never be something the client can assign to its own account. Loading
        // only clears once this resolves — ProtectedRoute's admin check reads
        // userRole the instant loading flips false, so setting that too early
        // (while userRole is still last-run's or null) bounces an admin back
        // to /perfil for a frame before the real role lands.
        const role = await getUserRole(authUser).catch(() => 'user' as UserRole)
        setUserRole(role)
        setLoading(false)
      })
    }, err => {
      if (cancelled) return
      console.error('[AuthContext] no cargó Firebase Auth:', err)
      setAuthError(true)
      setLoading(false)
    })
    return () => { cancelled = true; unsub() }
  }, [])

  // The moment `user` newly becomes available, mark inscripciones as loading
  // — adjusted during render (prop-transition pattern) instead of as a bare
  // setState in the effect below, which only ever touches state from within
  // its subscription callback (the sanctioned effect pattern).
  const [trackedUserUid, setTrackedUserUid] = useState(user?.uid)
  if (user?.uid !== trackedUserUid) {
    setTrackedUserUid(user?.uid)
    if (user) setRawInscripcionesLoading(true)
    setRawInscripcionesError(false)
  }

  useEffect(() => {
    if (!user) return
    let cancelled = false
    let unsub = () => {}
    let recibido = false
    const fallar = (err: unknown) => {
      if (cancelled || recibido) return
      console.error('[AuthContext] sin conexión con Firestore (inscripciones):', err)
      // Sin recarga automática a modo compatible acá (eso queda solo para la
      // carga inicial de la página, en DataContext): este listener arranca
      // justo al iniciar sesión, y recargar ahí tiraba a la persona de vuelta
      // a la pantalla de login con la sesión ya iniciada.
      setRawInscripcionesError(true)
    }
    const timeout = setTimeout(() => { if (!recibido) fallar(new Error('timeout')) }, TIMEOUT_CONEXION_MS)
    loadDb().then(({ subscribeInscripcionIds }) => {
      if (cancelled) return
      unsub = subscribeInscripcionIds(user.uid, (ids, { fromCache }) => {
        // Vacía y desde caché antes de saber nada del servidor: puede ser
        // Firestore offline… o simplemente el resultado que la caché ya tenía
        // de esta misma consulta (ej. 0 inscripciones, al volver a suscribirse
        // tras iniciar sesión). No se distinguen, así que no se decide nada:
        // se espera al servidor, y si no llega, el timeout avisa. Antes contaba
        // como fallo y, al iniciar sesión sin inscripciones, recargaba la
        // página de vuelta al login. Con datos en caché sí se aceptan.
        if (fromCache && !recibido && ids.length === 0) return
        recibido = true
        clearTimeout(timeout)
        setRawInscripcionIds(ids)
        setRawInscripcionesLoading(false)
        setRawInscripcionesError(false)
      }, fallar)
    }, fallar)
    return () => { cancelled = true; clearTimeout(timeout); unsub() }
  // uid y no `user`: al iniciar sesión, signIn() y onAuthStateChanged crean
  // dos objetos distintos para la misma persona, y depender del objeto
  // volvía a suscribir la consulta sin motivo.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid])

  // Derived rather than reset via an effect: with no user there's nothing to
  // load and nothing to show, computed directly instead of synced into state.
  const inscripcionIds = user ? rawInscripcionIds : []
  const inscripcionesLoading = user ? rawInscripcionesLoading : false
  const inscripcionesError = user ? rawInscripcionesError : false

  const signIn = async (email: string, password: string): Promise<UserRole> => {
    const { signIn: authSignIn, getUserRole } = await loadAuth()
    const u = await authSignIn(email, password)
    setUser(u)
    const role = await getUserRole(u).catch(() => 'user' as UserRole)
    setUserRole(role)
    return role
  }

  const signUp = async (name: string, email: string, password: string): Promise<UserRole> => {
    const { signUp: authSignUp, getUserRole } = await loadAuth()
    const u = await authSignUp(name, email, password)
    setUser(u)
    const role = await getUserRole(u).catch(() => 'user' as UserRole)
    setUserRole(role)
    return role
  }

  const signInWithGoogle = async (): Promise<{ role: UserRole; isNewUser: boolean }> => {
    const { signInWithGoogle: authSignInWithGoogle, getUserRole } = await loadAuth()
    const { user: u, isNewUser } = await authSignInWithGoogle()
    setUser(u)
    const role = await getUserRole(u).catch(() => 'user' as UserRole)
    setUserRole(role)
    return { role, isNewUser }
  }

  const signOut = async () => {
    const { signOutUser } = await loadAuth()
    await signOutUser()
    setUser(null)
    setUserRole(null)
  }

  return (
    <AuthContext.Provider value={{ user, userRole, loading, inscripcionIds, inscripcionesLoading, authError, inscripcionesError, signIn, signUp, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

// Context + colocated hook is the standard pattern here — it only costs Fast
// Refresh granularity (this file remounts on edit instead of hot-patching),
// not correctness.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
