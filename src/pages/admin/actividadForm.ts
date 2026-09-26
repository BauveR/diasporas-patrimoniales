import type { Actividad } from '../../data/actividades'
import { isValidContacto, isValidUrl } from './validators'

export type ActividadForm = {
  titulo: string; sedeId: string; tematica: string; fecha: string
  hora: string; duracion: string; dificultad: string; plazas: string
  organizador: string; contacto: string; puntoEncuentro: string
  descripcion: string; imagen: string; fechaAperturaInscripciones: string
}

export const defaultActividadForm: ActividadForm = {
  titulo: '', sedeId: '', tematica: '', fecha: '', hora: '',
  duracion: '', dificultad: 'Fácil', plazas: '', organizador: '',
  contacto: '', puntoEncuentro: '', descripcion: '', imagen: '',
  fechaAperturaInscripciones: '',
}

// Compartido con sedeForm.ts (mismo placeholder cuando no se da una URL de
// imagen propia).
export const DEFAULT_IMAGE = 'https://upload.wikimedia.org/wikipedia/commons/4/40/Convento_de_San_Buenaventura_-_Betancuria_-_Fuerteventura.jpg'

export function actividadToForm(a: Actividad): ActividadForm {
  return {
    titulo: a.titulo,
    sedeId: String(a.sedeId),
    tematica: a.tematica,
    fecha: a.fecha,
    hora: a.hora ?? '',
    duracion: a.duracion ?? '',
    dificultad: a.dificultad,
    plazas: String(a.plazas),
    organizador: a.organizador ?? '',
    contacto: a.contacto ?? '',
    puntoEncuentro: a.puntoEncuentro ?? '',
    descripcion: a.descripcion,
    imagen: a.imagen === DEFAULT_IMAGE ? '' : a.imagen,
    fechaAperturaInscripciones: a.fechaAperturaInscripciones ?? '',
  }
}

export type ActividadErrors = Partial<Record<keyof ActividadForm, string>>

// Exportada para poder testearla directo (ver AdminPage.test.ts) — al vivir
// ahora en un módulo sin JSX, ya no hace falta el
// eslint-disable react-refresh/only-export-components que tenía cuando
// compartía archivo con el componente AdminPage.
export function validateActividad(form: ActividadForm): ActividadErrors {
  const e: ActividadErrors = {}
  const today = new Date().toISOString().split('T')[0]

  if (!form.titulo.trim()) e.titulo = 'Obligatorio'
  else if (form.titulo.trim().length < 5) e.titulo = 'Mínimo 5 caracteres'

  if (!form.sedeId) e.sedeId = 'Selecciona un sede'
  if (!form.tematica)   e.tematica   = 'Selecciona una temática'

  if (!form.fecha) e.fecha = 'Obligatoria'
  else if (form.fecha < today) e.fecha = 'La fecha no puede ser anterior a hoy'

  if (form.fechaAperturaInscripciones && form.fecha && form.fechaAperturaInscripciones > form.fecha)
    e.fechaAperturaInscripciones = 'No puede ser posterior a la fecha del evento'

  if (!form.plazas) e.plazas = 'Obligatorio'
  else {
    const n = Number(form.plazas)
    if (!Number.isInteger(n) || n < 1) e.plazas = 'Número entero, mínimo 1'
    else if (n > 500) e.plazas = 'Máximo 500 plazas'
  }

  if (!form.descripcion.trim()) e.descripcion = 'Obligatoria'
  else if (form.descripcion.trim().length < 20) e.descripcion = 'Mínimo 20 caracteres'

  if (form.contacto.trim() && !isValidContacto(form.contacto.trim()))
    e.contacto = 'Email o teléfono español (6/7/8/9 + 8 dígitos)'

  if (form.imagen.trim() && !isValidUrl(form.imagen.trim()))
    e.imagen = 'URL no válida (debe empezar por http:// o https://)'

  return e
}
