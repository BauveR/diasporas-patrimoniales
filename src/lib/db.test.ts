import { describe, it, expect } from 'vitest'
import {
  assertInscribible,
  SinPlazasError,
  EventoCanceladoError,
  InscripcionNoAbiertaError,
} from './db'

// db.ts now talks to real Firestore — the transaction/CRUD/QR-flow coverage
// that used to live here ran against the old in-memory mock and can't run
// against the real project (would need the Firestore Emulator, which needs
// Java installed — not set up yet). assertInscribible() is the one piece of
// that logic that's still pure, so it's still unit-testable directly.
describe('assertInscribible', () => {
  const today = '2026-09-22'
  const base = { cancelada: false, plazasDisponibles: 10, fechaAperturaInscripciones: undefined }

  it('no lanza cuando hay plazas, no está cancelada y las inscripciones están abiertas', () => {
    expect(() => assertInscribible(base, today)).not.toThrow()
  })

  it('lanza EventoCanceladoError si la actividad está cancelada', () => {
    expect(() => assertInscribible({ ...base, cancelada: true }, today)).toThrow(EventoCanceladoError)
  })

  it('lanza SinPlazasError si no quedan plazas', () => {
    expect(() => assertInscribible({ ...base, plazasDisponibles: 0 }, today)).toThrow(SinPlazasError)
  })

  it('lanza InscripcionNoAbiertaError si la apertura es futura', () => {
    expect(() => assertInscribible({ ...base, fechaAperturaInscripciones: '2026-12-01' }, today)).toThrow(InscripcionNoAbiertaError)
  })

  it('no lanza si la apertura ya pasó', () => {
    expect(() => assertInscribible({ ...base, fechaAperturaInscripciones: '2026-01-01' }, today)).not.toThrow()
  })

  it('cancelada tiene prioridad sobre sin plazas', () => {
    expect(() => assertInscribible({ ...base, cancelada: true, plazasDisponibles: 0 }, today)).toThrow(EventoCanceladoError)
  })
})
