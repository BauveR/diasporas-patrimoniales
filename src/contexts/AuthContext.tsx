import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import {
  subscribeAuthState,
  signIn as authSignIn,
  signUp as authSignUp,
  signInWithGoogle as authSignInWithGoogle,
  signOutUser,
  getUserRole,
} from '../lib/auth'
import type { AppUser, UserRole } from '../lib/auth'
import { subscribeInscripcionIds } from '../lib/db'

export type { UserRole }

type AuthContextValue = {
  user: AppUser | null
  userRole: UserRole | null
  loading: boolean
  inscripcionIds: number[]
  inscripcionesLoading: boolean
  signIn: (email: string, password: string) => Promise<UserRole>
  signUp: (name: string, email: string, password: string) => Promise<UserRole>
  signInWithGoogle: () => Promise<UserRole>
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

  useEffect(() => {
    const unsub = subscribeAuthState(async authUser => {
      setUser(prev => mergeAuthUser(prev, authUser))
      setLoading(false)
      if (!authUser) {
        setUserRole(null)
        return
      }
      // Firestore read, not derived from the auth user itself — role must
      // never be something the client can assign to its own account.
      const role = await getUserRole(authUser.uid).catch(() => 'user' as UserRole)
      setUserRole(role)
    })
    return unsub
  }, [])

  // The moment `user` newly becomes available, mark inscripciones as loading
  // — adjusted during render (prop-transition pattern) instead of as a bare
  // setState in the effect below, which only ever touches state from within
  // its subscription callback (the sanctioned effect pattern).
  const [trackedUserUid, setTrackedUserUid] = useState(user?.uid)
  if (user?.uid !== trackedUserUid) {
    setTrackedUserUid(user?.uid)
    if (user) setRawInscripcionesLoading(true)
  }

  useEffect(() => {
    if (!user) return
    const unsub = subscribeInscripcionIds(user.uid, ids => {
      setRawInscripcionIds(ids)
      setRawInscripcionesLoading(false)
    })
    return unsub
  }, [user])

  // Derived rather than reset via an effect: with no user there's nothing to
  // load and nothing to show, computed directly instead of synced into state.
  const inscripcionIds = user ? rawInscripcionIds : []
  const inscripcionesLoading = user ? rawInscripcionesLoading : false

  const signIn = async (email: string, password: string): Promise<UserRole> => {
    const u = await authSignIn(email, password)
    setUser(u)
    const role = await getUserRole(u.uid).catch(() => 'user' as UserRole)
    setUserRole(role)
    return role
  }

  const signUp = async (name: string, email: string, password: string): Promise<UserRole> => {
    const u = await authSignUp(name, email, password)
    setUser(u)
    const role = await getUserRole(u.uid).catch(() => 'user' as UserRole)
    setUserRole(role)
    return role
  }

  const signInWithGoogle = async (): Promise<UserRole> => {
    const u = await authSignInWithGoogle()
    setUser(u)
    const role = await getUserRole(u.uid).catch(() => 'user' as UserRole)
    setUserRole(role)
    return role
  }

  const signOut = async () => {
    await signOutUser()
    setUser(null)
    setUserRole(null)
  }

  return (
    <AuthContext.Provider value={{ user, userRole, loading, inscripcionIds, inscripcionesLoading, signIn, signUp, signInWithGoogle, signOut }}>
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
