// Real Firestore backend — the swap-in for the old in-memory mock, replacing
// every export it had one-for-one so DataContext/AuthContext/AdminPage/
// ActividadPage didn't need structural changes, just an async
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

    tx.set(inscritoRef, {
      uid, email, displayName, telefono,
      inscritoEn: serverTimestamp(),
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
