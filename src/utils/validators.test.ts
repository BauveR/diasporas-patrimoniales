import { describe, it, expect } from 'vitest'
import { isValidTelefono, isValidEmail } from './validators'

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
