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
  sendEmailVerification,
  updateProfile,
  type ActionCodeSettings,
  type User as FirebaseUser,
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from './firebase'

export type AppUser = {
  uid: string
  email: string | null
  displayName: string | null
  // Solo cuenta para cuentas con contraseña: las de Google ya llegan
  // verificadas. No bloquea nada — ver components/profile/AvisoVerificacion.
  emailVerified: boolean
  conContrasena: boolean
  getIdToken: () => Promise<string>
}

export type UserRole = 'user' | 'admin'

function toAppUser(user: FirebaseUser): AppUser {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    emailVerified: user.emailVerified,
    conContrasena: user.providerData.some(p => p.providerId === 'password'),
    getIdToken: () => user.getIdToken(),
  }
}

// Enlace de vuelta al sitio en los correos de Firebase (verificar email,
// restablecer contraseña): sin esto, la página de Firebase terminaba sin
// ningún botón para volver. Si el dominio no está en "Authorized domains"
// (ej. una preview de Vercel), Firebase rechaza el envío con ese enlace — se
// reintenta sin él para que el correo llegue igual.
const ERRORES_DE_ENLACE = new Set(['auth/unauthorized-continue-uri', 'auth/invalid-continue-uri', 'auth/missing-continue-uri'])

async function conEnlaceDeVuelta(ruta: string, enviar: (ajustes?: ActionCodeSettings) => Promise<void>): Promise<void> {
  try {
    await enviar({ url: `${window.location.origin}${ruta}` })
  } catch (err) {
    if (!ERRORES_DE_ENLACE.has((err as { code?: string }).code ?? '')) throw err
    console.warn('[auth] dominio no autorizado para el enlace de vuelta; se envía sin él:', window.location.origin)
    await enviar()
  }
}

// Role lives in Firestore, not on the auth user, so it can't be
// self-assigned from the client — only readable here, writable by an admin
// (or by hand in the console) per the Security Rules. New accounts default
// to 'user'; this only creates the doc if it's missing, so it never clobbers
// a role an admin already set.
//
// merge: dos llamadas pueden cruzarse al crear la cuenta (signUp y el
// onAuthStateChanged que dispara getUserRole); con merge ninguna borra el
// nombre que haya puesto la otra. Sobre un doc inexistente es un create, y
// lleva role 'user' como exigen las reglas.
async function ensureUserDoc(user: { uid: string; email: string | null; displayName: string | null }): Promise<void> {
  const ref = doc(db, 'users', user.uid)
  const snap = await getDoc(ref)
  if (snap.exists()) return
  await setDoc(ref, {
    email: user.email,
    ...(user.displayName ? { displayName: user.displayName } : {}),
    role: 'user',
    createdAt: serverTimestamp(),
  }, { merge: true })
}

// Lee el rol y, de paso, crea la ficha si falta: si al crear la cuenta la
// red bloqueó Firestore justo después, la cuenta existía sin ficha y nada la
// volvía a crear (solo el login con Google lo hacía).
export async function getUserRole(user: AppUser): Promise<UserRole> {
  const snap = await getDoc(doc(db, 'users', user.uid))
  if (!snap.exists()) {
    await ensureUserDoc(user).catch(err => console.error('[auth] no se pudo crear la ficha del usuario:', err))
    return 'user'
  }
  return snap.data()?.role === 'admin' ? 'admin' : 'user'
}

export function subscribeAuthState(cb: (user: AppUser | null) => void): () => void {
  return onAuthStateChanged(auth, fbUser => cb(fbUser ? toAppUser(fbUser) : null))
}

export async function signIn(email: string, password: string): Promise<AppUser> {
  const { user } = await signInWithEmailAndPassword(auth, email, password)
  return toAppUser(user)
}

export async function signUp(name: string, email: string, password: string, rutaPerfil = '/perfil'): Promise<AppUser> {
  const { user } = await createUserWithEmailAndPassword(auth, email, password)
  // A partir de aquí la cuenta ya existe y la sesión está iniciada: si el
  // nombre o la ficha fallan (red que bloquea Firestore), no se lanza el
  // error. Antes se veía "Algo salió mal", y al reintentar, "Este email ya
  // está registrado" — sin salida. La ficha se vuelve a intentar en
  // getUserRole() y, si hace falta, al inscribirse (lib/db.ts).
  try {
    // Mutates `user` in place (and persists server-side).
    await updateProfile(user, { displayName: name })
  } catch (err) {
    console.error('[auth] no se pudo guardar el nombre:', err)
  }
  await ensureUserDoc({ uid: user.uid, email: user.email, displayName: name })
    .catch(err => console.error('[auth] no se pudo crear la ficha del usuario:', err))
  // Verificación suave: se envía, pero inscribirse no depende de ella (los
  // filtros de correo institucionales a veces la retrasan horas). Sirve
  // para detectar emails mal escritos y evita que, en Gmail, entrar luego
  // con Google borre la contraseña (Firebase lo hace si no está verificado).
  await conEnlaceDeVuelta(rutaPerfil, ajustes => sendEmailVerification(user, ajustes))
    .catch(err => console.error('[auth] no se pudo enviar la verificación:', err))
  return { ...toAppUser(user), displayName: user.displayName ?? name }
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

export async function sendPasswordReset(email: string, rutaLogin = '/login'): Promise<void> {
  await conEnlaceDeVuelta(rutaLogin, ajustes => sendPasswordResetEmail(auth, email, ajustes))
}

export async function reenviarVerificacion(rutaPerfil = '/perfil'): Promise<void> {
  const user = auth.currentUser
  if (!user) return
  await conEnlaceDeVuelta(rutaPerfil, ajustes => sendEmailVerification(user, ajustes))
}

// emailVerified no se actualiza solo al pulsar el enlace (en otra pestaña o
// en el móvil): hay que pedirle a Firebase el usuario de nuevo.
export async function recargarUsuario(): Promise<AppUser | null> {
  const user = auth.currentUser
  if (!user) return null
  await user.reload()
  return toAppUser(user)
}
