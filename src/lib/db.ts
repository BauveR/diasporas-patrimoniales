// Mock backend standing in for Firestore. Exports the exact same public API
// (function names, parameter shapes, error classes) that a real
// Firestore-backed implementation would — see the reference project's
// original `db.ts` — but backed by in-memory state seeded from `data/`
// instead of live Firestore calls. Nothing that imports from this module
// needs to change when it's swapped for a real Firestore project later; only
// the internals here do.
import type { Actividad } from '../data/actividades'
import { ACTIVIDADES } from '../data/actividades'
import type { Sede } from '../data/sedes'
import { SEDES } from '../data/sedes'

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

// ── In-memory store ─────────────────────────────────────────────────────────
// A tiny pub-sub per collection, mirroring Firestore's onSnapshot semantics:
// subscribers get the current snapshot immediately, then again on every
// mutation — so admin CRUD and inscriptions reflect live in the UI, same as
// the real backend would, without a page reload.

function createStore<T>(seed: T[]) {
  let items = seed
  const listeners = new Set<(items: T[]) => void>()
  function notify() {
    for (const cb of listeners) cb(items)
  }
  return {
    get: () => items,
    mutate(fn: (items: T[]) => T[]) {
      items = fn(items)
      notify()
    },
    subscribe(cb: (items: T[]) => void): Unsubscribe {
      listeners.add(cb)
      cb(items)
      return () => listeners.delete(cb)
    },
  }
}

const actividadesStore = createStore<Actividad>(ACTIVIDADES.map(a => ({ ...a })))
const sedesStore = createStore<Sede>(SEDES.map(s => ({ ...s })))

const _inscritos = new Map<number, Map<string, InscritoData>>()
const _telefonos = new Map<string, string>()
// Resuelve un token de QR escaneado directo a su inscripción, sin que el
// dispositivo que escanea necesite saber de antemano actividadId/uid — mismo
// rol que cumpliría usar el token como ID de documento en una colección
// `acreditaciones/{token}` de Firestore real.
const _tokenIndex = new Map<string, { actividadId: number; uid: string }>()
const inscripcionListeners = new Set<() => void>()
function notifyInscripciones() {
  for (const cb of inscripcionListeners) cb()
}

// ── Subscriptions ────────────────────────────────────────────────────────────

export function subscribeActividades(cb: (data: Actividad[]) => void): Unsubscribe {
  return actividadesStore.subscribe(items => {
    cb([...items].sort((a, b) => a.fecha.localeCompare(b.fecha)))
  })
}

export function subscribeSedes(cb: (data: Sede[]) => void): Unsubscribe {
  return sedesStore.subscribe(items => {
    cb([...items].sort((a, b) => a.id - b.id))
  })
}

/** Mock-only: live list of actividad ids a given user is inscribed to — stands in for the old `users/{uid}/inscripciones` subcollection subscription. */
export function subscribeInscripcionIds(uid: string, cb: (ids: number[]) => void): Unsubscribe {
  const emit = () => cb(getInscripcionIdsForUser(uid))
  inscripcionListeners.add(emit)
  emit()
  return () => inscripcionListeners.delete(emit)
}

function getInscripcionIdsForUser(uid: string): number[] {
  const ids: number[] = []
  for (const [actividadId, inscritos] of _inscritos) {
    if (inscritos.has(uid)) ids.push(actividadId)
  }
  return ids
}

/** Mock-only: stands in for the `users/{uid}.telefono` Firestore read used to prefill the phone field. */
export function getTelefonoForUser(uid: string): string | undefined {
  return _telefonos.get(uid)
}

/**
 * A user's own accreditation token for one actividad — for showing them
 * their QR. Scoped to a single (actividadId, uid) pair rather than exposing
 * `getInscritos`' full attendee list: a real Firestore rule would let a user
 * read only their own inscripción doc, never the whole subcollection.
 */
export function getMiToken(actividadId: number, uid: string): string | undefined {
  return _inscritos.get(actividadId)?.get(uid)?.token
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

export async function inscribirse(
  actividadId: number,
  uid: string,
  email: string,
  displayName: string,
  telefono: string,
): Promise<void> {
  const actividad = actividadesStore.get().find(a => a.id === actividadId)
  if (!actividad) return

  const inscritosDeActividad = _inscritos.get(actividadId) ?? new Map<string, InscritoData>()
  if (inscritosDeActividad.has(uid)) return // ya inscrito — no-op, igual que la transacción original

  if (actividad.cancelada) throw new EventoCanceladoError()
  if ((actividad.plazasDisponibles ?? 0) <= 0) throw new SinPlazasError()
  const apertura = actividad.fechaAperturaInscripciones
  if (apertura && apertura > new Date().toISOString().slice(0, 10)) throw new InscripcionNoAbiertaError()

  const token = randomToken()
  inscritosDeActividad.set(uid, {
    uid, email, displayName, telefono, inscritoEn: new Date(),
    token, acreditado: false, acreditadoEn: null,
  })
  _inscritos.set(actividadId, inscritosDeActividad)
  _telefonos.set(uid, telefono)
  _tokenIndex.set(token, { actividadId, uid })

  actividadesStore.mutate(items =>
    items.map(a => (a.id === actividadId ? { ...a, plazasDisponibles: (a.plazasDisponibles ?? 0) - 1 } : a)),
  )
  notifyInscripciones()
}

export async function liberarPlaza(actividadId: number, uid: string): Promise<void> {
  const inscritosDeActividad = _inscritos.get(actividadId)
  if (!inscritosDeActividad?.has(uid)) throw new YaLiberadaError()

  // El token de acreditación queda inválido junto con la plaza — si no se
  // borra acá, un ticket cancelado seguiría acreditando en la puerta.
  const inscrito = inscritosDeActividad.get(uid)
  if (inscrito) _tokenIndex.delete(inscrito.token)
  inscritosDeActividad.delete(uid)

  actividadesStore.mutate(items =>
    items.map(a =>
      a.id === actividadId
        ? { ...a, plazasDisponibles: Math.min((a.plazasDisponibles ?? 0) + 1, a.plazas) }
        : a,
    ),
  )
  notifyInscripciones()
}

// ── Acreditación (check-in por QR) ──────────────────────────────────────────────
// El QR de cada inscrito codifica únicamente `token` — un valor aleatorio
// opaco, no un cálculo/firma sobre actividadId+uid. Con un secreto de firma
// no habría dónde guardarlo con seguridad en una app 100% cliente (quedaría
// expuesto en el JS del navegador, anulando la protección), y como acreditar
// igual requiere una escritura en la base, la ventaja de "validar sin ir a
// la base" de un token firmado no se aprovecha acá. Random + búsqueda directa
// por token es el patrón estándar en sistemas de ticketing.

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
  const ref = _tokenIndex.get(token)
  if (!ref) throw new TokenInvalidoError()

  const inscrito = _inscritos.get(ref.actividadId)?.get(ref.uid)
  if (!inscrito) throw new TokenInvalidoError()

  const yaAcreditado = inscrito.acreditado
  if (!yaAcreditado) {
    inscrito.acreditado = true
    inscrito.acreditadoEn = new Date()
    notifyInscripciones()
  }

  return { displayName: inscrito.displayName, actividadId: ref.actividadId, yaAcreditado, acreditadoEn: inscrito.acreditadoEn! }
}

// ── Actividades CRUD ──────────────────────────────────────────────────────────

function randomId(): number {
  return crypto.getRandomValues(new Uint32Array(1))[0]
}

function randomToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16)) // 128 bits de entropía
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
}

export async function addActividad(data: Omit<Actividad, 'id'>): Promise<void> {
  const id = randomId()
  actividadesStore.mutate(items => [...items, { ...data, id }])
}

export async function updateActividad(
  id: number,
  data: Partial<Omit<Actividad, 'id'>>,
): Promise<void> {
  actividadesStore.mutate(items => items.map(a => (a.id === id ? { ...a, ...data } : a)))
}

export async function cancelActividad(id: number): Promise<void> {
  await updateActividad(id, { cancelada: true })
}

export async function reactivarActividad(id: number): Promise<void> {
  await updateActividad(id, { cancelada: false })
}

export async function eliminarActividad(id: number): Promise<void> {
  actividadesStore.mutate(items => items.filter(a => a.id !== id))
  _inscritos.delete(id)
  notifyInscripciones()
}

export async function getInscritos(actividadId: number): Promise<InscritoData[]> {
  return Array.from(_inscritos.get(actividadId)?.values() ?? [])
}

// ── Sedes CRUD ────────────────────────────────────────────────────────────────
// Solo `updateSede` — el evento tiene una única sede fija; nada da de alta
// sedes nuevas (por eso no hay `addSede` acá).

export async function updateSede(
  id: number,
  data: Partial<Omit<Sede, 'id'>>,
): Promise<void> {
  sedesStore.mutate(items => items.map(s => (s.id === id ? { ...s, ...data } : s)))
}

// ── Test-only ─────────────────────────────────────────────────────────────────

/** Resets the in-memory store to its seeded state — for test isolation between cases. */
export function __resetMockDb(): void {
  actividadesStore.mutate(() => ACTIVIDADES.map(a => ({ ...a })))
  sedesStore.mutate(() => SEDES.map(s => ({ ...s })))
  _inscritos.clear()
  _telefonos.clear()
  _tokenIndex.clear()
  notifyInscripciones()
}
