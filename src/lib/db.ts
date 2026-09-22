// Real Firestore backend — the swap-in for the old in-memory mock, replacing
// every export it had one-for-one so DataContext/AuthContext/AdminPage/
// ActividadPage didn't need structural changes, just an async getMiToken /
// getTelefonoForUser (a real read can't be synchronous like the mock's map
// lookup was — see ActividadPage.tsx for the small effect that adapts to it).
import {
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  runTransaction,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'
import type { Actividad } from '../data/actividades'
import type { Sede } from '../data/sedes'

export type InscritoData = {
  uid: string
  email: string
  displayName: string
  telefono: string
  inscritoEn: Date | null
  // Acreditación en el evento (check-in por QR) — ver la sección "Acreditación"
  // más abajo.
  token: string
  acreditado: boolean
  acreditadoEn: Date | null
}

type Unsubscribe = () => void

// ── Subscriptions ────────────────────────────────────────────────────────────

export function subscribeActividades(cb: (data: Actividad[]) => void): Unsubscribe {
  return onSnapshot(collection(db, 'actividades'), snap => {
    const items = snap.docs.map(d => d.data() as Actividad)
    cb([...items].sort((a, b) => a.fecha.localeCompare(b.fecha)))
  })
}

export function subscribeSedes(cb: (data: Sede[]) => void): Unsubscribe {
  return onSnapshot(collection(db, 'sedes'), snap => {
    const items = snap.docs.map(d => d.data() as Sede)
    cb([...items].sort((a, b) => a.id - b.id))
  })
}

// No `users/{uid}/inscripciones` mirror collection — a collection-group query
// over every actividad's `inscritos` subcollection, filtered by the `uid`
// field each doc already carries, gives the same list without a second write
// per inscripción to keep in sync.
export function subscribeInscripcionIds(uid: string, cb: (ids: number[]) => void): Unsubscribe {
  const q = query(collectionGroup(db, 'inscritos'), where('uid', '==', uid))
  return onSnapshot(q, snap => {
    const ids = snap.docs
      .map(d => Number(d.ref.parent.parent?.id))
      .filter(id => !Number.isNaN(id))
    cb(ids)
  })
}

/** The user's own saved phone number (users/{uid}.telefono) — prefills the phone field so it isn't asked from scratch every time. */
export async function getTelefonoForUser(uid: string): Promise<string | undefined> {
  const snap = await getDoc(doc(db, 'users', uid))
  return (snap.data()?.telefono as string | undefined) || undefined
}

/**
 * A user's own accreditation token for one actividad — for showing them
 * their QR. Scoped to a single (actividadId, uid) pair rather than exposing
 * `getInscritos`' full attendee list: the Security Rules let a user read
 * only their own inscripción doc, never the whole subcollection.
 */
export async function getMiToken(actividadId: number, uid: string): Promise<string | undefined> {
  const snap = await getDoc(doc(db, 'actividades', String(actividadId), 'inscritos', uid))
  return snap.data()?.token as string | undefined
}

// ── Inscription ───────────────────────────────────────────────────────────────

export class SinPlazasError extends Error {
  constructor() { super('SIN_PLAZAS') }
}

export class EventoCanceladoError extends Error {
  constructor() { super('EVENTO_CANCELADO') }
}

export class InscripcionNoAbiertaError extends Error {
  constructor() { super('INSCRIPCION_NO_ABIERTA') }
}

export class YaLiberadaError extends Error {
  constructor() { super('YA_LIBERADA') }
}

// Pure — no Firestore involved — so it's unit-testable without an emulator.
// Both inscribirse() and the tests call this same check.
export function assertInscribible(actividad: Pick<Actividad, 'cancelada' | 'plazasDisponibles' | 'fechaAperturaInscripciones'>, today: string): void {
  if (actividad.cancelada) throw new EventoCanceladoError()
  if ((actividad.plazasDisponibles ?? 0) <= 0) throw new SinPlazasError()
  const apertura = actividad.fechaAperturaInscripciones
  if (apertura && apertura > today) throw new InscripcionNoAbiertaError()
}

function randomToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16)) // 128 bits de entropía
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
}

export async function inscribirse(
  actividadId: number,
  uid: string,
  email: string,
  displayName: string,
  telefono: string,
): Promise<void> {
  const actividadRef = doc(db, 'actividades', String(actividadId))
  const inscritoRef = doc(db, 'actividades', String(actividadId), 'inscritos', uid)
  const userRef = doc(db, 'users', uid)

  await runTransaction(db, async tx => {
    const [actividadSnap, inscritoSnap] = await Promise.all([tx.get(actividadRef), tx.get(inscritoRef)])
    if (!actividadSnap.exists()) return
    if (inscritoSnap.exists()) return // ya inscrito — no-op, igual que la transacción original

    const actividad = actividadSnap.data() as Actividad
    const today = new Date().toISOString().slice(0, 10)
    assertInscribible(actividad, today)

    const token = randomToken()
    tx.set(inscritoRef, {
      uid, email, displayName, telefono,
      inscritoEn: serverTimestamp(),
      token, acreditado: false, acreditadoEn: null,
    })
    tx.update(actividadRef, { plazasDisponibles: (actividad.plazasDisponibles ?? 0) - 1 })
    tx.set(userRef, { telefono }, { merge: true })
  })
}

export async function liberarPlaza(actividadId: number, uid: string): Promise<void> {
  const actividadRef = doc(db, 'actividades', String(actividadId))
  const inscritoRef = doc(db, 'actividades', String(actividadId), 'inscritos', uid)

  await runTransaction(db, async tx => {
    const [actividadSnap, inscritoSnap] = await Promise.all([tx.get(actividadRef), tx.get(inscritoRef)])
    if (!inscritoSnap.exists()) throw new YaLiberadaError()

    tx.delete(inscritoRef)
    if (actividadSnap.exists()) {
      const actividad = actividadSnap.data() as Actividad
      tx.update(actividadRef, {
        plazasDisponibles: Math.min((actividad.plazasDisponibles ?? 0) + 1, actividad.plazas),
      })
    }
  })
}

// ── Acreditación (check-in por QR) ──────────────────────────────────────────────
// El QR de cada inscrito codifica únicamente `token` — un valor aleatorio
// opaco, no un cálculo/firma sobre actividadId+uid. Con un secreto de firma
// no habría dónde guardarlo con seguridad en una app 100% cliente (quedaría
// expuesto en el JS del navegador, anulando la protección), y como acreditar
// igual requiere una escritura en la base, la ventaja de "validar sin ir a
// la base" de un token firmado no se aprovecha acá. Random + búsqueda directa
// por token (collection group query) es el patrón estándar en ticketing.

export class TokenInvalidoError extends Error {
  constructor() { super('TOKEN_INVALIDO') }
}

export type AcreditarResult = {
  displayName: string
  actividadId: number
  // true si el token ya estaba acreditado antes de este escaneo — permite
  // que la UI del escáner muestre "ya acreditado" en vez de tratarlo como
  // error cuando dos dispositivos (o el mismo, dos veces) escanean el mismo
  // QR casi al mismo tiempo.
  yaAcreditado: boolean
  // Momento del primer escaneo válido. Con `yaAcreditado`, le permite al
  // escáner mostrar "denegado, ya usado a las HH:MM" en un reescaneo —
  // la señal que necesita quien acredita en persona para no dejar pasar a
  // una segunda persona con el mismo QR compartido.
  acreditadoEn: Date
}

export async function acreditar(token: string): Promise<AcreditarResult> {
  const q = query(collectionGroup(db, 'inscritos'), where('token', '==', token))
  const matches = await getDocs(q)
  const match = matches.docs[0]
  if (!match) throw new TokenInvalidoError()

  const actividadId = Number(match.ref.parent.parent?.id)
  const inscritoRef = match.ref
  const scanTime = new Date() // reloj del cliente — un solo dispositivo escanea en la puerta, no hace falta serverTimestamp()

  return runTransaction(db, async tx => {
    const snap = await tx.get(inscritoRef)
    if (!snap.exists()) throw new TokenInvalidoError()

    const data = snap.data()
    const yaAcreditado = !!data.acreditado
    if (!yaAcreditado) {
      tx.update(inscritoRef, { acreditado: true, acreditadoEn: scanTime })
    }

    return {
      displayName: data.displayName as string,
      actividadId,
      yaAcreditado,
      acreditadoEn: yaAcreditado ? (data.acreditadoEn as Timestamp).toDate() : scanTime,
    }
  })
}

// ── Actividades CRUD ──────────────────────────────────────────────────────────

function randomId(): number {
  return crypto.getRandomValues(new Uint32Array(1))[0]
}

export async function addActividad(data: Omit<Actividad, 'id'>): Promise<void> {
  const id = randomId()
  await setDoc(doc(db, 'actividades', String(id)), { ...data, id })
}

export async function updateActividad(
  id: number,
  data: Partial<Omit<Actividad, 'id'>>,
): Promise<void> {
  await updateDoc(doc(db, 'actividades', String(id)), data)
}

export async function cancelActividad(id: number): Promise<void> {
  await updateActividad(id, { cancelada: true })
}

export async function reactivarActividad(id: number): Promise<void> {
  await updateActividad(id, { cancelada: false })
}

// Nota: Firestore no borra subcolecciones en cascada — esto deja huérfana la
// subcolección inscritos/ de la actividad borrada. No se implementa un
// borrado recursivo (necesitaría una Cloud Function, no disponible en el
// plan Spark) porque esta acción no se usa hoy desde la UI de administración.
export async function eliminarActividad(id: number): Promise<void> {
  await deleteDoc(doc(db, 'actividades', String(id)))
}

export async function getInscritos(actividadId: number): Promise<InscritoData[]> {
  const snap = await getDocs(collection(db, 'actividades', String(actividadId), 'inscritos'))
  return snap.docs.map(d => {
    const data = d.data()
    return {
      uid: data.uid as string,
      email: data.email as string,
      displayName: data.displayName as string,
      telefono: data.telefono as string,
      inscritoEn: data.inscritoEn ? (data.inscritoEn as Timestamp).toDate() : null,
      token: data.token as string,
      acreditado: !!data.acreditado,
      acreditadoEn: data.acreditadoEn ? (data.acreditadoEn as Timestamp).toDate() : null,
    }
  })
}

// ── Sedes CRUD ────────────────────────────────────────────────────────────────
// Solo `updateSede` — el evento tiene una única sede fija; nada da de alta
// sedes nuevas (por eso no hay `addSede` acá).

export async function updateSede(
  id: number,
  data: Partial<Omit<Sede, 'id'>>,
): Promise<void> {
  await updateDoc(doc(db, 'sedes', String(id)), data)
}
