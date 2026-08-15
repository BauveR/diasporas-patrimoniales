import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import {
  subscribeMockAuthState,
  mockSignIn,
  mockSignUp,
  mockSignInWithGoogle,
  mockSignOut,
  getMockUserRole,
} from '../lib/mockAuth'
import type { MockUser, UserRole } from '../lib/mockAuth'
import { subscribeInscripcionIds } from '../lib/db'

export type { UserRole }

type AuthContextValue = {
  user: MockUser | null
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(null)
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)
  const [rawInscripcionIds, setRawInscripcionIds] = useState<number[]>([])
  const [rawInscripcionesLoading, setRawInscripcionesLoading] = useState(false)

  useEffect(() => {
    const unsub = subscribeMockAuthState(mockUser => {
      setUser(mockUser)
      setUserRole(mockUser ? getMockUserRole(mockUser.email) : null)
      setLoading(false)
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
    const u = await mockSignIn(email, password)
    const role = getMockUserRole(u.email)
    setUserRole(role)
    return role
  }

  const signUp = async (name: string, email: string, password: string): Promise<UserRole> => {
    const u = await mockSignUp(name, email, password)
    const role = getMockUserRole(u.email)
    setUserRole(role)
    return role
  }

  const signInWithGoogle = async (): Promise<UserRole> => {
    const u = await mockSignInWithGoogle()
    const role = getMockUserRole(u.email)
    setUserRole(role)
    return role
  }

  const signOut = async () => {
    await mockSignOut()
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
