// Real Firebase Auth + a `users/{uid}.role` Firestore doc for role
// assignment — the swap-in for the old lib/mockAuth.ts, replacing every
// export it had one-for-one so AuthContext/AuthPage/ProfilePage didn't need
// structural changes, just updated import names.
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  getAdditionalUserInfo,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from './firebase'

export type AppUser = {
  uid: string
  email: string | null
  displayName: string | null
  getIdToken: () => Promise<string>
}

export type UserRole = 'user' | 'admin'

function toAppUser(user: FirebaseUser): AppUser {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    getIdToken: () => user.getIdToken(),
  }
}

// Role lives in Firestore, not on the auth user, so it can't be
// self-assigned from the client — only readable here, writable by an admin
// (or by hand in the console) per the Security Rules. New accounts default
// to 'user'; this only creates the doc if it's missing, so it never clobbers
// a role an admin already set.
async function ensureUserDoc(user: FirebaseUser): Promise<void> {
  const ref = doc(db, 'users', user.uid)
  const snap = await getDoc(ref)
  if (snap.exists()) return
  await setDoc(ref, {
    email: user.email,
    displayName: user.displayName,
    role: 'user',
    createdAt: serverTimestamp(),
  })
}

export async function getUserRole(uid: string): Promise<UserRole> {
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.data()?.role === 'admin' ? 'admin' : 'user'
}

export function subscribeAuthState(cb: (user: AppUser | null) => void): () => void {
  return onAuthStateChanged(auth, fbUser => cb(fbUser ? toAppUser(fbUser) : null))
}

export async function signIn(email: string, password: string): Promise<AppUser> {
  const { user } = await signInWithEmailAndPassword(auth, email, password)
  return toAppUser(user)
}

export async function signUp(name: string, email: string, password: string): Promise<AppUser> {
  const { user } = await createUserWithEmailAndPassword(auth, email, password)
  // Mutates `user` in place (and persists server-side) — toAppUser() below
  // picks up the new displayName since it reads straight off this object.
  await updateProfile(user, { displayName: name })
  await ensureUserDoc(user)
  return toAppUser(user)
}

// isNewUser: el mismo popup sirve para entrar y para crear cuenta — la
// pantalla de bienvenida de AuthPage lo usa para decir "¡Cuenta creada!" o
// "Hola de nuevo" según el caso.
export async function signInWithGoogle(): Promise<{ user: AppUser; isNewUser: boolean }> {
  const cred = await signInWithPopup(auth, new GoogleAuthProvider())
  await ensureUserDoc(cred.user)
  return { user: toAppUser(cred.user), isNewUser: getAdditionalUserInfo(cred)?.isNewUser ?? false }
}

export async function signOutUser(): Promise<void> {
  await firebaseSignOut(auth)
}

export async function sendPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email)
}
