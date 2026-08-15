// Stand-in for Firebase Auth while there's no real Firebase project wired up
// yet. Exposes the same shape of user object / operations the UI already
// expects (uid, email, displayName, getIdToken), backed by localStorage so a
// mock session survives a reload. Only AuthContext and AuthPage import from
// here — swapping this out for real `firebase/auth` calls later doesn't
// require touching any other component.

export type MockUser = {
  uid: string
  email: string | null
  displayName: string | null
  getIdToken: () => Promise<string>
}

export type UserRole = 'user' | 'admin'

const STORAGE_KEY = 'mockAuthUser'

type StoredUser = { uid: string; email: string | null; displayName: string | null }

function toMockUser(stored: StoredUser): MockUser {
  return { ...stored, getIdToken: async () => `mock-token-${stored.uid}` }
}

function readStoredUser(): StoredUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as StoredUser) : null
  } catch {
    return null
  }
}

function writeStoredUser(user: StoredUser | null): void {
  try {
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    // localStorage unavailable (e.g. private mode) — session just won't persist across reloads.
  }
}

const initial = readStoredUser()
let currentUser: MockUser | null = initial ? toMockUser(initial) : null
const listeners = new Set<(user: MockUser | null) => void>()

function setCurrentUser(user: MockUser | null): void {
  currentUser = user
  writeStoredUser(user)
  for (const cb of listeners) cb(user)
}

// Deterministic mock uid so signing in again with the same email keeps the same identity.
function uidFromEmail(email: string): string {
  return `mock-${email.toLowerCase()}`
}

// No real role storage yet — any email starting with "admin" gets the admin
// role in this mock, so the /admin route is reachable for testing. Real role
// assignment (Firestore `users/{uid}.role`) returns once Firebase is wired up.
export function getMockUserRole(email: string | null): UserRole {
  return email?.toLowerCase().startsWith('admin') ? 'admin' : 'user'
}

export function subscribeMockAuthState(cb: (user: MockUser | null) => void): () => void {
  listeners.add(cb)
  cb(currentUser)
  return () => listeners.delete(cb)
}

export async function mockSignIn(email: string, _password: string): Promise<MockUser> {
  const user = toMockUser({ uid: uidFromEmail(email), email, displayName: email.split('@')[0] })
  setCurrentUser(user)
  return user
}

export async function mockSignUp(name: string, email: string, _password: string): Promise<MockUser> {
  const user = toMockUser({ uid: uidFromEmail(email), email, displayName: name })
  setCurrentUser(user)
  return user
}

export async function mockSignInWithGoogle(): Promise<MockUser> {
  const user = toMockUser({ uid: 'mock-google-demo', email: 'demo@google.mock', displayName: 'Demo Google' })
  setCurrentUser(user)
  return user
}

export async function mockSignOut(): Promise<void> {
  setCurrentUser(null)
}

export async function mockSendPasswordReset(_email: string): Promise<void> {
  // No-op — nothing to send an email through yet in the mock.
}
