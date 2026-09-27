import { useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useIsDesktop } from '../../hooks/useIsDesktop'
import type { Actividad, Dificultad } from '../../data/actividades'
import type { Sede } from '../../data/sedes'
import { TEMATICAS, type Tematica } from '../../data/tematicas'
import { DIFICULTADES } from '../../data/islas'
import { updateActividad } from '../../lib/db'
import { labelStyle } from '../../lib/styles'
import { openCloudinaryPicker } from './cloudinary'
import { FieldLabel, Input, Select, FieldError, Textarea, DuracionField, SaveButton } from './fields'
import {
  type ActividadForm, type ActividadErrors,
  defaultActividadForm, actividadToForm, validateActividad, DEFAULT_IMAGE,
} from './actividadForm'

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
              bg-stone-900 flex flex-col overflow-hidden
              fixed bottom-0 left-0 right-0 rounded-t-3xl max-h-[92svh]
              pb-[env(safe-area-inset-bottom,0px)]
              sm:top-0 sm:bottom-auto sm:left-auto sm:right-0
              sm:w-[440px] sm:rounded-none sm:rounded-l-2xl sm:h-full sm:max-h-full sm:pb-0
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
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>
            )}

            {/* Scrollable content */}
            <div className="overflow-y-auto flex-1 px-8 py-7 flex flex-col gap-5" style={labelStyle}>

              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] tracking-[0.25em] uppercase text-stone-400 mb-1">Editando evento</p>
                  <p className="font-mattone text-sm font-bold text-white leading-snug">{actividad.titulo}</p>
                  {inscritos > 0 && (
                    <p className="text-[11px] text-amber-400 mt-1">
                      {inscritos} inscrito{inscritos !== 1 ? 's' : ''} · plazas no reducibles por debajo de este número
                    </p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="shrink-0 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
                  aria-label="Cerrar"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="w-full h-px bg-white/10" />

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
                      className="shrink-0 px-3 rounded-xl border border-white/15 text-[10px] tracking-widest text-stone-400 hover:border-brand-orange hover:text-brand-orange transition-colors cursor-pointer whitespace-nowrap"
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
                {saveError && <p className="text-[10px] text-red-400 text-center">{saveError}</p>}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}

export { EditActividadDrawer }
