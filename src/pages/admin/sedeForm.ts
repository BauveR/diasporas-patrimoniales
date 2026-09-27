import type { Sede } from '../../data/sedes'
import { DEFAULT_IMAGE } from './actividadForm'
import { isValidUrl } from './validators'

export type SedeForm = {
  nombre: string; municipio: string; isla: string; imagen: string
  descripcion: string; lat: string; lng: string; fundacion: string; declaraciones: string
  bibliografia: string
}

export function sedeToForm(c: Sede): SedeForm {
  return {
    nombre: c.nombre, municipio: c.municipio, isla: c.isla,
    imagen: c.imagen, descripcion: c.descripcion,
    lat: String(c.lat), lng: String(c.lng),
    fundacion: c.fundacion ?? '',
    declaraciones: (c.declaraciones ?? []).join(', '),
    bibliografia: (c.bibliografia ?? []).join('\n'),
  }
}

export function formToSedeData(f: SedeForm): Omit<Sede, 'id' | 'actividadIds'> {
  return {
    nombre: f.nombre, municipio: f.municipio, isla: f.isla,
    imagen: f.imagen || DEFAULT_IMAGE, descripcion: f.descripcion,
    lat: Number(f.lat) || 0, lng: Number(f.lng) || 0,
    ...(f.fundacion ? { fundacion: f.fundacion } : {}),
    ...(f.declaraciones.trim()
      ? { declaraciones: f.declaraciones.split(',').map(s => s.trim()).filter(Boolean) }
      : {}),
    ...(f.bibliografia.trim()
      ? { bibliografia: f.bibliografia.split('\n').map(s => s.trim()).filter(Boolean) }
      : {}),
  }
}

export type SedeErrors = Partial<Record<keyof SedeForm, string>>

export function validateSede(form: SedeForm): SedeErrors {
  const e: SedeErrors = {}

  if (!form.nombre.trim()) e.nombre = 'Obligatorio'
  else if (form.nombre.trim().length < 3) e.nombre = 'Mínimo 3 caracteres'

  if (!form.municipio.trim()) e.municipio = 'Obligatorio'

  if (!form.isla) e.isla = 'Selecciona una isla'

  if (!form.descripcion.trim()) e.descripcion = 'Obligatoria'
  else if (form.descripcion.trim().length < 10) e.descripcion = 'Mínimo 10 caracteres'

  if (!form.lat.trim()) e.lat = 'Obligatoria'
  else {
    const n = Number(form.lat)
    if (isNaN(n) || n < -90 || n > 90) e.lat = 'Entre -90 y 90'
  }
  if (!form.lng.trim()) e.lng = 'Obligatoria'
  else {
    const n = Number(form.lng)
    if (isNaN(n) || n < -180 || n > 180) e.lng = 'Entre -180 y 180'
  }

  if (form.imagen.trim() && !isValidUrl(form.imagen.trim()))
    e.imagen = 'URL no válida (debe empezar por http:// o https://)'

  return e
}
