import { useState, useEffect, useMemo } from 'react'

declare global {
  interface Window {
    cloudinary?: {
      openMediaLibrary: (
        options: { cloud_name: string; api_key: string; multiple?: boolean },
        callbacks: { insertHandler: (data: { assets: Array<{ secure_url: string }> }) => void }
      ) => void
    }
  }
}

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string
const CLOUD_KEY  = import.meta.env.VITE_CLOUDINARY_API_KEY  as string

function openCloudinaryPicker(onSelect: (url: string) => void) {
  window.cloudinary?.openMediaLibrary(
    { cloud_name: CLOUD_NAME, api_key: CLOUD_KEY, multiple: false },
    { insertHandler: (data) => { if (data.assets[0]) onSelect(data.assets[0].secure_url) } }
  )
}
import { createPortal } from 'react-dom'
import type React from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useIsDesktop } from '../hooks/useIsDesktop'
import type { Actividad, Dificultad } from '../data/actividades'
import type { Sede } from '../data/sedes'
import { TEMATICAS, TEMATICA_COLORS, type Tematica } from '../data/tematicas'
import { ISLAS, DIFICULTADES } from '../data/islas'
import { useDataContext } from '../contexts/DataContext'
import { isValidTelefono } from '../utils/validators'
import { downloadCsv, toTsv } from '../utils/csv'
import { formatMes } from '../utils/formatMes'
import {
  updateActividad, cancelActividad, reactivarActividad, eliminarActividad,
  updateSede,
  getInscritos,
  type InscritoData,
} from '../lib/db'

const labelStyle = { fontFamily: "'Open Sans', sans-serif" }
const titleStyle = { fontFamily: "'Google Sans Flex', sans-serif", fontVariationSettings: "'wght' 100" }
const ACCENT = '#cd6a26'

type AdminSection = 'sedes' | 'asistentes'

// ── Nav config ────────────────────────────────────────────────────────────────

type NavItem = { key: AdminSection; label: string; sublabel: string; Icon: () => React.JSX.Element }

function IconBuilding() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h18M6 21V7l6-4 6 4v14M9 21V12h6v9" />
    </svg>
  )
}

function IconUsers() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

const NAV_ITEMS: NavItem[] = [
  { key: 'sedes',  label: 'Sede',        sublabel: 'Ver y editar',   Icon: IconBuilding     },
  { key: 'asistentes', label: 'Eventos',             sublabel: 'Asistentes',     Icon: IconUsers        },
]

// ── Shared UI ─────────────────────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-[10px] tracking-widest uppercase text-stone-500">{children}</label>
  )
}

function Input({ value, onChange, type = 'text', placeholder, className = '', error = false, selectOnFocus = false }: {
  value: string | number
  onChange: (v: string) => void
  type?: string
  placeholder?: string
  className?: string
  error?: boolean
  selectOnFocus?: boolean
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      onFocus={selectOnFocus ? e => e.target.select() : undefined}
      placeholder={placeholder}
      className={`w-full border rounded-xl px-3 py-2 text-base text-stone-800 bg-white focus:outline-none transition-colors placeholder:text-stone-500 ${
        error ? 'border-red-300 focus:border-red-400' : 'border-stone-200 focus:border-[#595d8d]'
      } ${className}`}
    />
  )
}

function Select({ value, onChange, children, error = false }: {
  value: string | number
  onChange: (v: string) => void
  children: React.ReactNode
  error?: boolean
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className={`w-full border rounded-xl px-3 py-2 text-base text-stone-800 bg-white focus:outline-none transition-colors ${
        error ? 'border-red-300 focus:border-red-400' : 'border-stone-200 focus:border-[#595d8d]'
      }`}
    >
      {children}
    </select>
  )
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null
  return <p className="text-[10px] text-red-500 mt-0.5 wrap-break-word">{msg}</p>
}

function Textarea({ value, onChange, rows = 3, placeholder }: {
  value: string
  onChange: (v: string) => void
  rows?: number
  placeholder?: string
}) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      rows={rows}
      placeholder={placeholder}
      className="w-full border border-stone-200 rounded-xl px-3 py-2 text-base text-stone-800 bg-white focus:outline-none focus:border-[#595d8d] transition-colors resize-none"
    />
  )
}

function formatDuracion(mins: number): string {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h === 0) return `${m}min`
  if (m === 0) return `${h}h`
  return `${h}h ${m}min`
}

const DURACION_PRESETS = [
  ...Array.from({ length: 16 }, (_, i) => formatDuracion((i + 1) * 15)), // 15min .. 4h, pasos de 15min
  'Medio día', 'Día completo',
]
const DURACION_CUSTOM = '__custom__'

function DuracionField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [custom, setCustom] = useState(() => value !== '' && !DURACION_PRESETS.includes(value))

  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabel>Duración</FieldLabel>
      {custom ? (
        <div className="flex gap-2">
          <Input value={value} onChange={onChange} placeholder="2h 30min" selectOnFocus className="flex-1" />
          <button
            type="button"
            onClick={() => { setCustom(false); onChange('') }}
            className="shrink-0 text-[10px] tracking-widest uppercase text-stone-400 hover:text-[#595d8d] transition-colors cursor-pointer"
          >
            Lista
          </button>
        </div>
      ) : (
        <Select value={value} onChange={v => (v === DURACION_CUSTOM ? setCustom(true) : onChange(v))}>
          <option value="">Seleccionar</option>
          {DURACION_PRESETS.map(p => <option key={p} value={p}>{p}</option>)}
          <option value={DURACION_CUSTOM}>Personalizado…</option>
        </Select>
      )}
    </div>
  )
}

function SaveButton({ loading, success, onClick, label = 'Guardar' }: {
  loading: boolean
  success: boolean
  onClick: () => void
  label?: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="w-full py-2.5 rounded-xl text-[11px] tracking-widest uppercase transition-all disabled:opacity-40 cursor-pointer text-white hover:opacity-90"
      style={{ backgroundColor: success ? '#50664d' : '#595d8d' }}
    >
      {loading ? '...' : success ? '✓ Guardado' : label}
    </button>
  )
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-stone-100 p-6" style={labelStyle}>
      <p className="text-[10px] tracking-widest uppercase mb-5" style={{ color: ACCENT }}>{title}</p>
      {children}
    </div>
  )
}

// ── Validation helpers ────────────────────────────────────────────────────────

function isValidUrl(v: string): boolean {
  try {
    const url = new URL(v)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch { return false }
}

function isValidContacto(v: string): boolean {
  if (v.includes('@')) return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())
  return isValidTelefono(v)
}

// ── Alta de Actividad ─────────────────────────────────────────────────────────

type ActividadForm = {
  titulo: string; sedeId: string; tematica: string; fecha: string
  hora: string; duracion: string; dificultad: string; plazas: string
  organizador: string; contacto: string; puntoEncuentro: string
  descripcion: string; imagen: string; fechaAperturaInscripciones: string
}

const defaultActividadForm: ActividadForm = {
  titulo: '', sedeId: '', tematica: '', fecha: '', hora: '',
  duracion: '', dificultad: 'Fácil', plazas: '', organizador: '',
  contacto: '', puntoEncuentro: '', descripcion: '', imagen: '',
  fechaAperturaInscripciones: '',
}

const DEFAULT_IMAGE = 'https://upload.wikimedia.org/wikipedia/commons/4/40/Convento_de_San_Buenaventura_-_Betancuria_-_Fuerteventura.jpg'

function actividadToForm(a: Actividad): ActividadForm {
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

type ActividadErrors = Partial<Record<keyof ActividadForm, string>>

// Exported for direct unit testing (see AdminPage.test.ts) alongside the page
// component — costs Fast Refresh granularity, not correctness. Candidate to
// extract into its own validators module in a later pass.
// eslint-disable-next-line react-refresh/only-export-components
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

// ── Edit Actividad Drawer ─────────────────────────────────────────────────────

function EditActividadDrawer({
  actividad,
  sedes,
  onClose,
}: {
  actividad: Actividad | null
  sedes: Sede[]
  onClose: () => void
}) {
  const isDesktop = useIsDesktop()
  const inscritos = actividad ? actividad.plazas - actividad.plazasDisponibles : 0

  const [form, setForm] = useState<ActividadForm>(defaultActividadForm)
  const [errors, setErrors] = useState<ActividadErrors>({})
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [saveError, setSaveError] = useState('')

  // Reset the draft form whenever a different actividad is selected for
  // editing — adjusted during render (React's documented pattern) instead of
  // in an effect.
  const [trackedActividadId, setTrackedActividadId] = useState(actividad?.id)
  if (actividad?.id !== trackedActividadId) {
    setTrackedActividadId(actividad?.id)
    if (actividad) {
      setForm(actividadToForm(actividad))
      setErrors({})
      setSaveError('')
      setSuccess(false)
    }
  }

  const set = (key: keyof ActividadForm) => (v: string) => {
    setForm(f => ({ ...f, [key]: v }))
    setErrors(e => ({ ...e, [key]: undefined }))
  }

  const handleSave = async () => {
    if (!actividad) return
    const errs = validateActividad(form)
    const newPlazas = Number(form.plazas)
    if (!errs.plazas && newPlazas < inscritos) {
      errs.plazas = `Mínimo ${inscritos} (hay ${inscritos} inscrito${inscritos !== 1 ? 's' : ''})`
    }
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setSaving(true)
    setSaveError('')
    try {
      await updateActividad(actividad.id, {
        titulo: form.titulo,
        sedeId: Number(form.sedeId),
        tematica: form.tematica as Tematica,
        fecha: form.fecha,
        hora: form.hora,
        duracion: form.duracion,
        dificultad: form.dificultad as Dificultad,
        plazas: newPlazas,
        plazasDisponibles: newPlazas - inscritos,
        organizador: form.organizador,
        contacto: form.contacto,
        puntoEncuentro: form.puntoEncuentro,
        descripcion: form.descripcion,
        imagen: form.imagen || DEFAULT_IMAGE,
        fechaAperturaInscripciones: form.fechaAperturaInscripciones,
      })
      setSuccess(true)
      setTimeout(() => { setSuccess(false); onClose() }, 1500)
    } catch {
      setSaveError('Error al guardar. Inténtalo de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  const cardVariants = isDesktop
    ? { initial: { x: '100%' }, animate: { x: 0 }, exit: { x: '100%' } }
    : { initial: { y: '100%' }, animate: { y: 0 }, exit: { y: '100%' } }

  return createPortal(
    <AnimatePresence>
      {actividad && (
        <motion.div
          className="fixed inset-0 z-[9998] bg-black/30"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="
              bg-stone-50 flex flex-col overflow-hidden
              fixed bottom-0 left-0 right-0 rounded-t-3xl max-h-[92svh]
              sm:top-0 sm:bottom-auto sm:left-auto sm:right-0
              sm:w-[440px] sm:rounded-none sm:rounded-l-2xl sm:h-full sm:max-h-full
            "
            variants={cardVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={isDesktop
              ? { duration: 0.2, ease: 'easeOut' }
              : { type: 'spring', damping: 30, stiffness: 300 }
            }
            drag={isDesktop ? false : 'y'}
            dragConstraints={isDesktop ? undefined : { top: 0 }}
            dragElastic={isDesktop ? undefined : { top: 0 }}
            onDragEnd={isDesktop ? undefined : (_, info) => { if (info.offset.y > 80) onClose() }}
            onClick={e => e.stopPropagation()}
          >
            {/* Handle mobile */}
            {!isDesktop && (
              <div className="flex justify-center pt-3 pb-1 shrink-0 cursor-grab active:cursor-grabbing">
                <div className="w-10 h-1 rounded-full bg-stone-200" />
              </div>
            )}

            {/* Scrollable content */}
            <div className="overflow-y-auto flex-1 px-8 py-7 flex flex-col gap-5" style={labelStyle}>

              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] tracking-[0.25em] uppercase text-stone-400 mb-1">Editando evento</p>
                  <p className="text-sm text-stone-800 leading-snug">{actividad.titulo}</p>
                  {inscritos > 0 && (
                    <p className="text-[11px] text-amber-500 mt-1">
                      {inscritos} inscrito{inscritos !== 1 ? 's' : ''} · plazas no reducibles por debajo de este número
                    </p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="shrink-0 w-7 h-7 rounded-full bg-stone-200 hover:bg-stone-300 flex items-center justify-center text-stone-400 transition-colors cursor-pointer"
                  aria-label="Cerrar"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="w-full h-px bg-stone-200" />

              {/* Form fields */}
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <FieldLabel>Título *</FieldLabel>
                  <Input value={form.titulo} onChange={set('titulo')} error={!!errors.titulo} />
                  <FieldError msg={errors.titulo} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <FieldLabel>Sede *</FieldLabel>
                    <Select value={form.sedeId} onChange={set('sedeId')} error={!!errors.sedeId}>
                      <option value="">Seleccionar</option>
                      {sedes.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.nombre.replace('Sede Histórica de ', '')}
                        </option>
                      ))}
                    </Select>
                    <FieldError msg={errors.sedeId} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <FieldLabel>Temática *</FieldLabel>
                    <Select value={form.tematica} onChange={set('tematica')} error={!!errors.tematica}>
                      <option value="">Seleccionar</option>
                      {TEMATICAS.map(t => <option key={t} value={t}>{t}</option>)}
                    </Select>
                    <FieldError msg={errors.tematica} />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="flex flex-col gap-1.5">
                    <FieldLabel>Fecha *</FieldLabel>
                    <Input value={form.fecha} onChange={set('fecha')} type="date" error={!!errors.fecha} />
                    <FieldError msg={errors.fecha} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <FieldLabel>Hora</FieldLabel>
                    <Input value={form.hora} onChange={set('hora')} type="time" />
                  </div>
                  <DuracionField key={actividad?.id ?? 'none'} value={form.duracion} onChange={set('duracion')} />
                </div>

                <div className="flex flex-col gap-1.5">
                  <FieldLabel>Apertura de inscripciones</FieldLabel>
                  <Input
                    value={form.fechaAperturaInscripciones}
                    onChange={set('fechaAperturaInscripciones')}
                    type="date"
                    error={!!errors.fechaAperturaInscripciones}
                  />
                  <FieldError msg={errors.fechaAperturaInscripciones} />
                  <p className="text-[10px] text-stone-400">Vacío = inscripciones abiertas desde ya.</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <FieldLabel>Plazas *</FieldLabel>
                    <Input value={form.plazas} onChange={set('plazas')} type="number" error={!!errors.plazas} />
                    <FieldError msg={errors.plazas} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <FieldLabel>Dificultad</FieldLabel>
                    <Select value={form.dificultad} onChange={set('dificultad')}>
                      {DIFICULTADES.map(d => <option key={d} value={d}>{d}</option>)}
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <FieldLabel>Organizador</FieldLabel>
                    <Input value={form.organizador} onChange={set('organizador')} placeholder="Entidad" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <FieldLabel>Contacto</FieldLabel>
                    <Input value={form.contacto} onChange={set('contacto')} placeholder="email o 6XXXXXXXX" error={!!errors.contacto} />
                    <FieldError msg={errors.contacto} />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <FieldLabel>Punto de encuentro</FieldLabel>
                  <Input value={form.puntoEncuentro} onChange={set('puntoEncuentro')} placeholder="Lugar exacto de inicio" />
                </div>

                <div className="flex flex-col gap-1.5">
                  <FieldLabel>Descripción *</FieldLabel>
                  <Textarea value={form.descripcion} onChange={set('descripcion')} rows={4} />
                  <FieldError msg={errors.descripcion} />
                </div>

                <div className="flex flex-col gap-1.5">
                  <FieldLabel>Imagen URL</FieldLabel>
                  <div className="flex gap-2">
                    <Input value={form.imagen} onChange={set('imagen')} placeholder="https://..." error={!!errors.imagen} />
                    <button
                      type="button"
                      onClick={() => openCloudinaryPicker(url => set('imagen')(url))}
                      className="shrink-0 px-3 rounded-xl border border-stone-200 text-[10px] tracking-widest text-stone-400 hover:border-[#595d8d] hover:text-[#595d8d] transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Biblioteca
                    </button>
                  </div>
                  {form.imagen && !errors.imagen && (
                    <img src={form.imagen} alt="" className="h-24 w-full object-cover rounded-xl mt-1"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                      onLoad={e => { (e.target as HTMLImageElement).style.display = '' }}
                    />
                  )}
                  <FieldError msg={errors.imagen} />
                </div>

                <SaveButton loading={saving} success={success} onClick={handleSave} label="Guardar cambios" />
                {saveError && <p className="text-[10px] text-red-500 text-center">{saveError}</p>}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}

// ── Eventos y Asistentes ──────────────────────────────────────────────────────

type ActivityCardProps = {
  actividad: Actividad
  selected: boolean
  onClick: () => void
  onEdit: () => void
}

function ActivityCard({ actividad, selected, onClick, onEdit }: ActivityCardProps) {
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [acting, setActing] = useState(false)
  const [actingError, setActingError] = useState('')

  const count = actividad.plazas - actividad.plazasDisponibles
  const pct   = actividad.plazas > 0 ? Math.round((count / actividad.plazas) * 100) : 0
  const fecha = new Date(actividad.fecha + 'T00:00:00').toLocaleDateString('es-ES', {
    day: 'numeric', month: 'short',
  })
  const isCancelada = !!actividad.cancelada

  const handleCancel = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setActing(true)
    setActingError('')
    try { await cancelActividad(actividad.id) }
    catch { setActingError('Error al cancelar. Inténtalo de nuevo.') }
    finally { setActing(false); setConfirmCancel(false) }
  }

  const handleReactivar = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setActing(true)
    setActingError('')
    try { await reactivarActividad(actividad.id) }
    catch { setActingError('Error al reactivar. Inténtalo de nuevo.') }
    finally { setActing(false) }
  }

  const handleEliminar = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setActing(true)
    setActingError('')
    try { await eliminarActividad(actividad.id) }
    catch { setActingError('Error al eliminar. Inténtalo de nuevo.') }
    finally { setActing(false); setConfirmDelete(false) }
  }

  const plazasLibres = actividad.plazasDisponibles

  return (
    <div
      className={`rounded-xl border transition-colors ${
        selected
          ? 'bg-stone-50'
          : isCancelada
            ? 'border-red-100 bg-red-50/40'
            : 'border-stone-100 hover:border-stone-200 bg-white'
      }`}
      style={{ ...labelStyle, ...(selected ? { borderColor: '#595d8d' } : {}) }}
    >
      {/* Info + barra — clickable */}
      <button onClick={onClick} className="w-full text-left px-4 pt-4 pb-3 cursor-pointer">
        {/* Tematica badge */}
        <span
          className="inline-block mb-2 px-2 py-0.5 rounded-full text-[9px] tracking-widest uppercase text-white font-medium"
          style={{ backgroundColor: isCancelada ? '#d6d3d1' : TEMATICA_COLORS[actividad.tematica] }}
        >
          {actividad.tematica}
        </span>

        <div className="flex items-start gap-2 mb-0.5">
          <p className={`text-sm truncate flex-1 leading-snug ${isCancelada ? 'text-stone-400 line-through' : 'text-stone-800'}`}>
            {actividad.titulo}
          </p>
          {isCancelada && (
            <span className="shrink-0 px-1.5 py-0.5 rounded-full bg-red-100 text-red-500 text-[9px] tracking-widest uppercase">
              Cancelado
            </span>
          )}
        </div>
        <p className="text-[11px] text-stone-400 mb-3">{fecha}</p>

        <div className="h-1.5 rounded-full bg-stone-100 overflow-hidden mb-2">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${pct}%`,
              backgroundColor: isCancelada ? '#d6d3d1' : pct >= 90 ? '#ef4444' : pct >= 60 ? '#f59e0b' : '#595d8d',
            }}
          />
        </div>
        <div className="flex justify-between text-[10px] tabular-nums">
          <span className="text-stone-500">{count} / {actividad.plazas} inscritos</span>
          {!isCancelada && plazasLibres <= 5 && plazasLibres > 0 && (
            <span className="text-red-400">¡{plazasLibres} libre{plazasLibres !== 1 ? 's' : ''}!</span>
          )}
          {!isCancelada && plazasLibres === 0 && (
            <span className="text-stone-400">Completo</span>
          )}
          {!isCancelada && plazasLibres > 5 && (
            <span className="text-stone-400">{pct}%</span>
          )}
        </div>
      </button>

      {actingError && (
        <p className="px-4 pb-2 text-[10px] text-red-400">{actingError}</p>
      )}

      {/* Acción inferior */}
      <div className="px-4 pt-2 pb-3 border-t border-stone-100 flex items-center justify-between gap-3">
        {confirmCancel ? (
          <div className="flex gap-2 items-center">
            <button
              onClick={e => { e.stopPropagation(); setConfirmCancel(false) }}
              className="text-[10px] text-stone-400 hover:text-stone-600 cursor-pointer"
            >
              No
            </button>
            <button
              onClick={handleCancel}
              disabled={acting}
              className="px-3 py-1 rounded-lg bg-red-500 text-white text-[10px] tracking-widest uppercase hover:bg-red-600 disabled:opacity-40 cursor-pointer"
            >
              {acting ? '...' : 'Sí, cancelar'}
            </button>
          </div>
        ) : confirmDelete ? (
          <div className="flex gap-2 items-center">
            <button
              onClick={e => { e.stopPropagation(); setConfirmDelete(false) }}
              className="text-[10px] text-stone-400 hover:text-stone-600 cursor-pointer"
            >
              No
            </button>
            <button
              onClick={handleEliminar}
              disabled={acting}
              className="px-3 py-1 rounded-lg bg-red-700 text-white text-[10px] tracking-widest uppercase hover:bg-red-800 disabled:opacity-40 cursor-pointer"
            >
              {acting ? '...' : 'Sí, eliminar'}
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={e => { e.stopPropagation(); onEdit() }}
              className="text-[10px] tracking-widest uppercase text-stone-500 hover:text-[#595d8d] transition-colors cursor-pointer"
            >
              Editar
            </button>
            {isCancelada ? (
              <div className="flex gap-3 items-center">
                <button
                  onClick={handleReactivar}
                  disabled={acting}
                  className="text-[10px] tracking-widest uppercase text-stone-500 transition-colors cursor-pointer disabled:opacity-40 hover:text-[#50664d]"
                >
                  {acting ? '...' : 'Reactivar'}
                </button>
                <button
                  onClick={e => { e.stopPropagation(); setConfirmDelete(true) }}
                  className="text-[10px] tracking-widest uppercase text-stone-500 hover:text-red-600 transition-colors cursor-pointer"
                >
                  Eliminar
                </button>
              </div>
            ) : (
              <button
                onClick={e => { e.stopPropagation(); setConfirmCancel(true) }}
                className="text-[10px] tracking-widest uppercase text-stone-500 hover:text-red-400 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function ControlAsistentes({ actividades, sedes }: { actividades: Actividad[]; sedes: Sede[] }) {
  const today    = new Date().toISOString().slice(0, 10)
  const proximas = actividades.filter(a => a.fecha >= today && !a.cancelada).sort((a, b) => a.fecha.localeCompare(b.fecha))
  const pasadas  = actividades.filter(a => a.fecha <  today || !!a.cancelada).sort((a, b) => b.fecha.localeCompare(a.fecha))

  const [showPasadas,      setShowPasadas]      = useState(false)
  const [selectedId,       setSelectedId]       = useState<number | null>(null)
  const [editingId,        setEditingId]        = useState<number | null>(null)
  const [inscritos,        setInscritos]        = useState<InscritoData[]>([])
  const [loadingInscritos, setLoadingInscritos] = useState(false)
  const [fetchError,       setFetchError]       = useState<string | null>(null)
  const [fetchedAt,        setFetchedAt]        = useState<{ id: number; count: number } | null>(null)
  const [query,            setQuery]            = useState('')
  const [mesFiltro,        setMesFiltro]        = useState('')
  const [copiado,          setCopiado]          = useState(false)

  const mesesDisponibles = useMemo(() => {
    const set = new Set(actividades.map(a => a.fecha.slice(0, 7)))
    return Array.from(set).sort()
  }, [actividades])

  const matchesFiltro = (a: Actividad) => {
    if (mesFiltro && !a.fecha.startsWith(mesFiltro)) return false
    if (!query.trim()) return true
    const q = query.trim().toLowerCase()
    const sede = sedes.find(c => c.id === a.sedeId)
    return a.titulo.toLowerCase().includes(q)
      || (sede?.nombre.toLowerCase().includes(q) ?? false)
      || (sede?.isla.toLowerCase().includes(q) ?? false)
  }

  const visible            = (showPasadas ? pasadas : proximas).filter(matchesFiltro)
  const selectedActividad  = actividades.find(a => a.id === selectedId)
  const editingActividad   = actividades.find(a => a.id === editingId)
  const selectedCount      = selectedActividad
    ? selectedActividad.plazas - selectedActividad.plazasDisponibles
    : 0
  const selectedFecha      = selectedActividad
    ? new Date(selectedActividad.fecha + 'T00:00:00').toLocaleDateString('es-ES', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : ''

  const fetchInscritos = async (id: number, count: number) => {
    setLoadingInscritos(true)
    setFetchError(null)
    try {
      const data = await getInscritos(id)
      setInscritos(data)
      setFetchedAt({ id, count })
    } catch {
      setFetchError('Error al cargar inscritos. Inténtalo de nuevo.')
    } finally {
      setLoadingInscritos(false)
    }
  }

  useEffect(() => {
    if (!selectedId) return
    if (fetchedAt?.id === selectedId && fetchedAt?.count === selectedCount) return
    const id = selectedId
    const count = selectedCount
    // Deferred a tick so the fetch (and its immediate setLoadingInscritos)
    // runs outside the effect's own synchronous call stack.
    queueMicrotask(() => { fetchInscritos(id, count) })
  }, [selectedId, selectedCount])

  const handleSelect = (id: number) => {
    setEditingId(null)
    setSelectedId(prev => prev === id ? null : id)
  }

  const handleEdit = (id: number) => {
    setSelectedId(null)
    setEditingId(prev => prev === id ? null : id)
  }

  const inscritosRows = (): string[][] => [
    ['Nombre', 'Email', 'Teléfono', 'Inscrito el'],
    ...inscritos.map(i => [
      i.displayName || '',
      i.email,
      i.telefono || '',
      i.inscritoEn ? i.inscritoEn.toLocaleDateString('es-ES') : '',
    ]),
  ]

  const handleDescargarCsv = () => {
    if (!selectedActividad) return
    const slug = selectedActividad.titulo.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    downloadCsv(`inscritos-${slug}.csv`, inscritosRows())
  }

  const handleCopiar = async () => {
    try {
      await navigator.clipboard.writeText(toTsv(inscritosRows()))
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch { /* clipboard no disponible */ }
  }

  const tabs = [
    { label: `Próximas (${proximas.length})`, active: !showPasadas, onClick: () => setShowPasadas(false) },
    { label: `Pasadas (${pasadas.length})`,   active: showPasadas,  onClick: () => setShowPasadas(true)  },
  ]

  return (
    <div className="flex flex-col gap-6">

      <EditActividadDrawer
        actividad={editingActividad ?? null}
        sedes={sedes}
        onClose={() => setEditingId(null)}
      />

      {/* Panel de inscritos */}
      {selectedActividad && (
        <div className="bg-white rounded-2xl border border-stone-100 p-6" style={labelStyle}>
          <div className="flex items-start justify-between mb-5 gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] tracking-widest uppercase text-stone-400 mb-1">Inscritos</p>
              <p className="text-sm text-stone-800 truncate">{selectedActividad.titulo}</p>
              <p className="text-[11px] text-stone-400 mt-0.5 capitalize">
                {selectedFecha} · {selectedCount} {selectedCount === 1 ? 'inscrito' : 'inscritos'}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {inscritos.length > 0 && (
                <>
                  <button
                    onClick={handleCopiar}
                    className="px-3 py-1.5 rounded-full border border-stone-200 text-[10px] tracking-widest uppercase text-stone-500 hover:border-stone-400 hover:text-stone-800 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    {copiado ? 'Copiado ✓' : 'Copiar'}
                  </button>
                  <button
                    onClick={handleDescargarCsv}
                    className="px-3 py-1.5 rounded-full border border-stone-200 text-[10px] tracking-widest uppercase text-stone-500 hover:border-stone-400 hover:text-stone-800 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Descargar CSV
                  </button>
                </>
              )}
              <button
                onClick={() => setSelectedId(null)}
                className="shrink-0 w-7 h-7 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-400 transition-colors cursor-pointer"
                aria-label="Cerrar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {loadingInscritos ? (
            <p className="text-[11px] text-stone-400 py-2">Cargando...</p>
          ) : fetchError ? (
            <p className="text-[11px] text-red-400 py-2">{fetchError}</p>
          ) : inscritos.length === 0 ? (
            <p className="text-[11px] text-stone-500 py-2">Sin inscritos aún</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[10px] tracking-widest uppercase text-stone-400 border-b border-stone-100">
                    <th className="font-normal py-2 pr-4">Nombre</th>
                    <th className="font-normal py-2 pr-4">Email</th>
                    <th className="font-normal py-2">Teléfono</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {inscritos.map(i => (
                    <tr key={i.uid}>
                      <td className="py-2.5 pr-4 text-sm text-stone-700 whitespace-nowrap">{i.displayName || '—'}</td>
                      <td className="py-2.5 pr-4 text-[11px] text-stone-400 whitespace-nowrap">{i.email}</td>
                      <td className="py-2.5 text-[11px] text-stone-400 whitespace-nowrap">{i.telefono || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Grid de eventos */}
      <SectionCard title="Eventos">
        <div className="flex gap-2 mb-5">
          {tabs.map(t => (
            <button
              key={t.label}
              onClick={t.onClick}
              className={`px-3 py-1 rounded-full text-[10px] tracking-widest uppercase transition-colors border cursor-pointer ${
                t.active ? 'text-white border-transparent' : 'text-stone-400 border-stone-200 hover:border-stone-400'
              }`}
              style={t.active ? { backgroundColor: '#595d8d' } : {}}
            >
              {t.label}
            </button>
          ))}
        </div>

        {actividades.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <div className="relative flex-1">
              <svg
                xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 pointer-events-none"
              >
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Buscar por título, sede o isla…"
                className="w-full border border-stone-200 rounded-xl pl-8 pr-8 py-2 text-base text-stone-800 bg-white focus:outline-none focus:border-stone-400 transition-colors placeholder:text-stone-500"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-700 transition-colors cursor-pointer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            {mesesDisponibles.length > 0 && (
              <div className="sm:w-56 shrink-0">
                <Select value={mesFiltro} onChange={setMesFiltro}>
                  <option value="">Todos los meses</option>
                  {mesesDisponibles.map(m => <option key={m} value={m}>{formatMes(m)}</option>)}
                </Select>
              </div>
            )}
          </div>
        )}

        {visible.length === 0 ? (
          <p className="text-sm text-stone-500 py-4 text-center">Sin actividades</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {visible.map(a => (
              <ActivityCard
                key={a.id}
                actividad={a}
                selected={a.id === selectedId}
                onClick={() => handleSelect(a.id)}
                onEdit={() => handleEdit(a.id)}
              />
            ))}
          </div>
        )}
      </SectionCard>

    </div>
  )
}

// ── Gestión de Sedes ──────────────────────────────────────────────────────

type SedeForm = {
  nombre: string; municipio: string; isla: string; imagen: string
  descripcion: string; lat: string; lng: string; fundacion: string; declaraciones: string
  bibliografia: string
}

function sedeToForm(c: Sede): SedeForm {
  return {
    nombre: c.nombre, municipio: c.municipio, isla: c.isla,
    imagen: c.imagen, descripcion: c.descripcion,
    lat: String(c.lat), lng: String(c.lng),
    fundacion: c.fundacion ?? '',
    declaraciones: (c.declaraciones ?? []).join(', '),
    bibliografia: (c.bibliografia ?? []).join('\n'),
  }
}

function formToSedeData(f: SedeForm): Omit<Sede, 'id' | 'actividadIds'> {
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

type SedeErrors = Partial<Record<keyof SedeForm, string>>

function validateSede(form: SedeForm): SedeErrors {
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

function SedeRow({ sede }: { sede: Sede }) {
  const [expanded, setExpanded] = useState(false)
  const [form, setForm] = useState<SedeForm>(sedeToForm(sede))
  const [errors, setErrors] = useState<SedeErrors>({})
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [saveError, setSaveError] = useState('')

  const set = (key: keyof SedeForm) => (v: string) => {
    setForm(f => ({ ...f, [key]: v }))
    setErrors(e => ({ ...e, [key]: undefined }))
  }

  const handleCancel = () => {
    setForm(sedeToForm(sede))
    setErrors({})
    setExpanded(false)
  }

  const handleSave = async () => {
    const errs = validateSede(form)
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setSaving(true)
    setSaveError('')
    try {
      await updateSede(sede.id, formToSedeData(form))
      setSuccess(true)
      setTimeout(() => { setSuccess(false); setExpanded(false) }, 1500)
    } catch {
      setSaveError('Error al guardar. Inténtalo de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="border-b border-stone-100 last:border-0">
      <button
        onClick={() => setExpanded(p => !p)}
        className="w-full flex items-center justify-between py-3 text-left cursor-pointer"
      >
        <div className="flex flex-col gap-0.5">
          <span className="text-sm text-stone-800">
            {sede.nombre.replace('Sede Histórica de ', '')}
          </span>
          <span className="text-[11px] text-stone-400">{sede.isla} · {sede.municipio}</span>
        </div>
        <svg
          xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
          className={`text-stone-500 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {expanded && (
        <div className="pb-5 flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <FieldLabel>Nombre *</FieldLabel>
            <Input value={form.nombre} onChange={set('nombre')} error={!!errors.nombre} />
            <FieldError msg={errors.nombre} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <FieldLabel>Municipio *</FieldLabel>
              <Input value={form.municipio} onChange={set('municipio')} error={!!errors.municipio} />
              <FieldError msg={errors.municipio} />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel>Isla *</FieldLabel>
              <Select value={form.isla} onChange={set('isla')} error={!!errors.isla}>
                <option value="">Seleccionar</option>
                {ISLAS.map(i => <option key={i} value={i}>{i}</option>)}
              </Select>
              <FieldError msg={errors.isla} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <FieldLabel>Latitud *</FieldLabel>
              <Input value={form.lat} onChange={set('lat')} type="number" error={!!errors.lat} />
              <FieldError msg={errors.lat} />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel>Longitud *</FieldLabel>
              <Input value={form.lng} onChange={set('lng')} type="number" error={!!errors.lng} />
              <FieldError msg={errors.lng} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <FieldLabel>Imagen URL</FieldLabel>
            <div className="flex gap-2">
              <Input value={form.imagen} onChange={set('imagen')} placeholder="https://..." error={!!errors.imagen} />
              <button
                type="button"
                onClick={() => openCloudinaryPicker(url => set('imagen')(url))}
                className="shrink-0 px-3 rounded-xl border border-stone-200 text-[10px] tracking-widest text-stone-400 hover:border-[#595d8d] hover:text-[#595d8d] transition-colors cursor-pointer whitespace-nowrap"
              >
                Biblioteca
              </button>
            </div>
            {form.imagen && !errors.imagen && (
              <img src={form.imagen} alt="" className="h-24 w-full object-cover rounded-xl mt-1"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                onLoad={e => { (e.target as HTMLImageElement).style.display = '' }}
              />
            )}
            <FieldError msg={errors.imagen} />
          </div>
          <div className="flex flex-col gap-1.5">
            <FieldLabel>Descripción *</FieldLabel>
            <Textarea value={form.descripcion} onChange={set('descripcion')} rows={3} />
            <FieldError msg={errors.descripcion} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <FieldLabel>Fundación</FieldLabel>
              <Input value={form.fundacion} onChange={set('fundacion')} placeholder="s. XVI" />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel>Declaraciones (coma)</FieldLabel>
              <Input value={form.declaraciones} onChange={set('declaraciones')} placeholder="Patrimonio UNESCO" />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <FieldLabel>Bibliografía (una referencia por línea)</FieldLabel>
            <Textarea value={form.bibliografia} onChange={set('bibliografia')} rows={3} placeholder={'Autor, A. (2005). Título. Editorial.\nhttps://...'} />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl border border-stone-200 text-[11px] tracking-widest uppercase text-stone-400 hover:bg-stone-50 transition-colors disabled:opacity-40 cursor-pointer"
            >
              Cancelar
            </button>
            <div className="flex-1">
              <SaveButton loading={saving} success={success} onClick={handleSave} />
            </div>
          </div>
          {saveError && <p className="text-[10px] text-red-500 text-center">{saveError}</p>}
        </div>
      )}
    </div>
  )
}

// El evento tiene una única sede fija (TEA) — sin buscador ni alta de sedes
// nuevas, que solo tenían sentido con la lista multi-sede de la plantilla
// original. Lo que queda es editar los datos de esa sede única.
function GestionSedes({ sedes }: { sedes: Sede[] }) {
  return (
    <SectionCard title="Sede">
      {sedes.length === 0 ? (
        <p className="text-sm text-stone-500 py-4 text-center">Sin sede. Inicializa la base de datos.</p>
      ) : (
        sedes.map(c => <SedeRow key={c.id} sede={c} />)
      )}
    </SectionCard>
  )
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

function Sidebar({ section, setSection }: { section: AdminSection; setSection: (s: AdminSection) => void }) {
  return (
    <aside
      className="hidden sm:flex fixed top-16 left-0 bottom-0 z-40 flex-col sm:w-14 lg:w-55 overflow-hidden"
      style={{ ...labelStyle, backgroundColor: '#595d8d' }}
    >
      {/* Logo row — lg only */}
      <div className="hidden lg:flex items-center gap-3 px-5 h-14 border-b border-white/15 shrink-0">
        <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: '#b19e7b' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
            <path d="M3 21h18M6 21V7l6-4 6 4v14" />
          </svg>
        </div>
        <span className="text-white/70 text-[10px] tracking-[0.2em] uppercase whitespace-nowrap">
          Administración
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 flex flex-col gap-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ key, label, sublabel, Icon }) => {
          const active = section === key
          return (
            <button
              key={key}
              onClick={() => setSection(key)}
              className={`flex items-center gap-3.5 py-3 px-4 lg:px-5 w-full transition-colors cursor-pointer
                sm:justify-center lg:justify-start
                ${active ? 'text-white' : 'text-white/55 hover:text-white hover:bg-white/10'}`}
              style={active ? { backgroundColor: '#b19e7b' } : {}}
            >
              <span className="shrink-0"><Icon /></span>
              <span className="hidden lg:flex flex-col items-start min-w-0">
                <span className="text-[11px] tracking-widest uppercase whitespace-nowrap">{label}</span>
                <span className={`text-[9px] tracking-widest whitespace-nowrap ${active ? 'text-white/70' : 'text-white/30'}`}>
                  {sublabel}
                </span>
              </span>
            </button>
          )
        })}
      </nav>

      {/* Back to site */}
      <div className="shrink-0 py-3 border-t border-white/15">
        <Link
          to="/"
          className="flex items-center gap-3 py-2.5 px-4 lg:px-5 text-white/40 hover:text-white/80 transition-colors sm:justify-center lg:justify-start"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          <span className="hidden lg:block text-[10px] tracking-widest uppercase whitespace-nowrap">
            Volver al sitio
          </span>
        </Link>
      </div>
    </aside>
  )
}

function MobileTabBar({ section, setSection }: { section: AdminSection; setSection: (s: AdminSection) => void }) {
  return (
    <nav
      className="sm:hidden fixed bottom-0 inset-x-0 z-40 border-t border-white/15 flex items-stretch"
      style={{ ...labelStyle, backgroundColor: '#595d8d' }}
    >
      {NAV_ITEMS.map(({ key, label, Icon }) => {
        const active = section === key
        return (
          <button
            key={key}
            onClick={() => setSection(key)}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 transition-colors cursor-pointer relative
              ${active ? 'text-white' : 'text-white/50'}`}
          >
            {active && (
              <span
                className="absolute top-0 inset-x-0 h-0.5"
                style={{ backgroundColor: '#b19e7b' }}
              />
            )}
            <Icon />
            <span className="text-[8px] tracking-widest uppercase">{label}</span>
          </button>
        )
      })}
    </nav>
  )
}

// ── Section header ────────────────────────────────────────────────────────────

function ContentHeader({ item }: { item: NavItem }) {
  return (
    <div className="bg-white border-b border-stone-100 px-6 sm:px-8 pt-8 pb-7">
      <p className="text-[10px] tracking-widest uppercase mb-1.5" style={{ color: ACCENT }}>
        {item.sublabel}
      </p>
      <h1 className="text-2xl text-stone-900 uppercase tracking-tight" style={titleStyle}>
        {item.label}
      </h1>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function AdminPage() {
  const { actividades, sedes } = useDataContext()
  const [section, setSection] = useState<AdminSection>('sedes')

  const currentNav = NAV_ITEMS.find(n => n.key === section)!

  return (
    <div className="min-h-screen bg-stone-50" style={labelStyle}>

      {/* Sidebar (sm+) */}
      <Sidebar section={section} setSection={setSection} />

      {/* Mobile bottom tab bar */}
      <MobileTabBar section={section} setSection={setSection} />

      {/* Content */}
      <div className="pt-16 sm:pl-14 lg:pl-55 pb-16 sm:pb-0 min-h-screen flex flex-col">

        <ContentHeader item={currentNav} />

        <div className="flex-1 px-6 sm:px-8 py-8">

          {section === 'sedes'  && <GestionSedes sedes={sedes} />}
          {section === 'asistentes' && <ControlAsistentes actividades={actividades} sedes={sedes} />}

        </div>
      </div>
    </div>
  )
}
