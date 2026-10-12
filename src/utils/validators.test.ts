import { describe, it, expect } from 'vitest'
import { isValidTelefono, isValidEmail, normalizarTelefono } from './validators'

describe('isValidTelefono', () => {
  it('acepta un móvil español de 9 dígitos', () => {
    expect(isValidTelefono('612345678')).toBe(true)
  })

  it('acepta formato internacional', () => {
    expect(isValidTelefono('+34612345678')).toBe(true)
  })

  it('rechaza un número demasiado corto', () => {
    expect(isValidTelefono('612345')).toBe(false)
  })
})

describe('isValidEmail', () => {
  it('acepta un email con formato válido', () => {
    expect(isValidEmail('persona@gmail.com')).toBe(true)
  })

  it('acepta mayúsculas y espacios alrededor', () => {
    expect(isValidEmail('  Persona@Example.ES  ')).toBe(true)
  })

  it('rechaza sin arroba', () => {
    expect(isValidEmail('personagmail.com')).toBe(false)
  })

  it('rechaza sin dominio', () => {
    expect(isValidEmail('persona@')).toBe(false)
  })

  it('rechaza una terminación de dominio no alfabética', () => {
    expect(isValidEmail('persona@dominio.123')).toBe(false)
  })

  it('rechaza dominios de email desechable comunes', () => {
    expect(isValidEmail('persona@mailinator.com')).toBe(false)
    expect(isValidEmail('persona@yopmail.com')).toBe(false)
    expect(isValidEmail('persona@10minutemail.com')).toBe(false)
  })
})

describe('normalizarTelefono', () => {
  it('espacios duros, guiones tipográficos, 00 inicial y espacios de más', () => {
    expect(normalizarTelefono('+34\u00a0600\u00a0123\u00a0456')).toBe('+34 600 123 456')
    expect(normalizarTelefono('+34–600—123−456')).toBe('+34-600-123-456')
    expect(normalizarTelefono('0034 600 123 456')).toBe('+34 600 123 456')
    expect(normalizarTelefono('  600   123 456 ')).toBe('600 123 456')
  })
})

// La web nunca debe aceptar un teléfono que las reglas de Firestore rechacen
// (telefonoValido en firestore.rules): si pasara, la inscripción fallaría con
// un error genérico. Misma expresión que las reglas, sobre lo que se guarda.
describe('teléfono: la web y las reglas aceptan lo mismo', () => {
  const regla = (v: string) => v.length <= 25 && /^[+]?[0-9 ().-]{8,24}$/.test(v)
  it.each([
    '600123456', '600 12 34 56', '+34 600 123 456', '+351 912 345 678', '+33 6 12 34 56 78',
    '+44 7700 900123', '+1 (212) 555-0123', '+54 9 11 1234-5678', '+598 99 123 456',
    '+212 6 12 34 56 78', '+86 138 0013 8000', '+33.6.12.34.56.78', '0034 600 123 456',
    '+34\u00a0600\u00a0123\u00a0456', '+34–600–123–456', '+1 (212) 555 - 0123 - 4567',
    '+34 600 123 456 ext 2', '612345', '+123',
  ])('%s', v => {
    if (isValidTelefono(v)) expect(regla(normalizarTelefono(v))).toBe(true)
  })

  it('números válidos de otros países se aceptan', () => {
    for (const v of ['+351 912 345 678', '+1 (212) 555-0123', '+598 99 123 456', '+86 138 0013 8000']) expect(isValidTelefono(v)).toBe(true)
  })
})
