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

  inscritosDeActividad.set(uid, { uid, email, displayName, telefono, inscritoEn: new Date() })
  _inscritos.set(actividadId, inscritosDeActividad)
  _telefonos.set(uid, telefono)

  actividadesStore.mutate(items =>
    items.map(a => (a.id === actividadId ? { ...a, plazasDisponibles: (a.plazasDisponibles ?? 0) - 1 } : a)),
  )
  notifyInscripciones()
}

export async function liberarPlaza(actividadId: number, uid: string): Promise<void> {
  const inscritosDeActividad = _inscritos.get(actividadId)
  if (!inscritosDeActividad?.has(uid)) throw new YaLiberadaError()

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

// ── Actividades CRUD ──────────────────────────────────────────────────────────

function randomId(): number {
  return crypto.getRandomValues(new Uint32Array(1))[0]
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

export async function addSede(data: Omit<Sede, 'id' | 'actividadIds'>): Promise<void> {
  const id = randomId()
  sedesStore.mutate(items => [...items, { ...data, id, actividadIds: [] }])
}

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
  notifyInscripciones()
}
