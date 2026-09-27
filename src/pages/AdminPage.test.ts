import { describe, it, expect } from 'vitest'
import { validateActividad } from './admin/actividadForm'

// ActividadForm base válido
const base = {
  titulo: 'Visita guiada al castillo histórico',
  sedeId: '1',
  tematica: 'Arquitectura',
  fecha: '2030-01-01',
  hora: '10:00',
  duracion: '2h',
  dificultad: 'Fácil',
  plazas: '20',
  organizador: '',
  contacto: '',
  puntoEncuentro: '',
  descripcion: 'Recorrido completo por el recinto histórico con guía especializado.',
  imagen: '',
  fechaAperturaInscripciones: '',
}

describe('validateActividad', () => {
  it('acepta un formulario válido', () => {
    expect(validateActividad(base)).toEqual({})
  })

  it('requiere título', () => {
    expect(validateActividad({ ...base, titulo: '' })).toHaveProperty('titulo')
  })

  it('rechaza título menor de 5 caracteres', () => {
    expect(validateActividad({ ...base, titulo: 'abc' })).toHaveProperty('titulo')
  })

  it('acepta título de exactamente 5 caracteres', () => {
    expect(validateActividad({ ...base, titulo: 'abcde' })).not.toHaveProperty('titulo')
  })

  it('requiere sedeId', () => {
    expect(validateActividad({ ...base, sedeId: '' })).toHaveProperty('sedeId')
  })

  it('requiere temática', () => {
    expect(validateActividad({ ...base, tematica: '' })).toHaveProperty('tematica')
  })

  it('requiere fecha', () => {
    expect(validateActividad({ ...base, fecha: '' })).toHaveProperty('fecha')
  })

  it('rechaza fecha pasada', () => {
    expect(validateActividad({ ...base, fecha: '2020-01-01' })).toHaveProperty('fecha')
  })

  it('acepta fecha futura', () => {
    expect(validateActividad({ ...base, fecha: '2030-06-15' })).not.toHaveProperty('fecha')
  })

  it('requiere plazas', () => {
    expect(validateActividad({ ...base, plazas: '' })).toHaveProperty('plazas')
  })

  it('rechaza 0 plazas', () => {
    expect(validateActividad({ ...base, plazas: '0' })).toHaveProperty('plazas')
  })

  it('rechaza plazas negativas', () => {
    expect(validateActividad({ ...base, plazas: '-5' })).toHaveProperty('plazas')
  })

  it('acepta 1 plaza', () => {
    expect(validateActividad({ ...base, plazas: '1' })).not.toHaveProperty('plazas')
  })

  it('rechaza más de 500 plazas', () => {
    expect(validateActividad({ ...base, plazas: '501' })).toHaveProperty('plazas')
  })

  it('acepta exactamente 500 plazas', () => {
    expect(validateActividad({ ...base, plazas: '500' })).not.toHaveProperty('plazas')
  })

  it('acepta plazas decimales redondeadas (no entero)', () => {
    expect(validateActividad({ ...base, plazas: '5.5' })).toHaveProperty('plazas')
  })

  it('requiere descripción', () => {
    expect(validateActividad({ ...base, descripcion: '' })).toHaveProperty('descripcion')
  })

  it('rechaza descripción menor de 20 caracteres', () => {
    expect(validateActividad({ ...base, descripcion: 'Muy corta.' })).toHaveProperty('descripcion')
  })

  it('acepta descripción de exactamente 20 caracteres', () => {
    expect(validateActividad({ ...base, descripcion: '12345678901234567890' })).not.toHaveProperty('descripcion')
  })

  it('acepta contacto vacío', () => {
    expect(validateActividad({ ...base, contacto: '' })).not.toHaveProperty('contacto')
  })

  it('acepta email válido en contacto', () => {
    expect(validateActividad({ ...base, contacto: 'org@ejemplo.es' })).not.toHaveProperty('contacto')
  })

  it('rechaza email inválido en contacto', () => {
    expect(validateActividad({ ...base, contacto: 'no-es-email' })).toHaveProperty('contacto')
  })

  it('acepta teléfono español válido en contacto', () => {
    expect(validateActividad({ ...base, contacto: '612345678' })).not.toHaveProperty('contacto')
  })

  it('rechaza teléfono que empieza por 5', () => {
    expect(validateActividad({ ...base, contacto: '512345678' })).toHaveProperty('contacto')
  })

  it('acepta imagen vacía', () => {
    expect(validateActividad({ ...base, imagen: '' })).not.toHaveProperty('imagen')
  })

  it('acepta URL de imagen válida', () => {
    expect(validateActividad({ ...base, imagen: 'https://ejemplo.com/foto.jpg' })).not.toHaveProperty('imagen')
  })

  it('rechaza URL de imagen inválida', () => {
    expect(validateActividad({ ...base, imagen: 'not-a-url' })).toHaveProperty('imagen')
  })

  it('rechaza URL con protocolo ftp', () => {
    expect(validateActividad({ ...base, imagen: 'ftp://ejemplo.com/foto.jpg' })).toHaveProperty('imagen')
  })

  it('devuelve múltiples errores a la vez', () => {
    const errs = validateActividad({ ...base, titulo: '', sedeId: '', plazas: '0' })
    expect(Object.keys(errs).length).toBeGreaterThanOrEqual(3)
  })
})
