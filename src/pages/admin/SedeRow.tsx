import { useState } from 'react'
import type { Sede } from '../../data/sedes'
import { ISLAS } from '../../data/islas'
import { updateSede } from '../../lib/db'
import { openCloudinaryPicker } from './cloudinary'
import { FieldLabel, Input, Select, FieldError, Textarea, SaveButton } from './fields'
import { type SedeForm, type SedeErrors, sedeToForm, formToSedeData, validateSede } from './sedeForm'

export function SedeRow({ sede }: { sede: Sede }) {
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
    <div className="border-b border-white/10 last:border-0">
      <button
        onClick={() => setExpanded(p => !p)}
        className="w-full flex items-center justify-between py-3 text-left cursor-pointer"
      >
        <div className="flex flex-col gap-0.5">
          <span className="text-sm text-white">
            {sede.nombre.replace('Sede Histórica de ', '')}
          </span>
          <span className="text-[11px] text-stone-400">{sede.isla} · {sede.municipio}</span>
        </div>
        <svg
          xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
          className={`text-stone-400 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
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
              className="flex-1 py-2.5 rounded-xl border border-white/15 text-[11px] tracking-widest uppercase text-stone-300 hover:bg-white/5 transition-colors disabled:opacity-40 cursor-pointer"
            >
              Cancelar
            </button>
            <div className="flex-1">
              <SaveButton loading={saving} success={success} onClick={handleSave} />
            </div>
          </div>
          {saveError && <p className="text-[10px] text-red-400 text-center">{saveError}</p>}
        </div>
      )}
    </div>
  )
}
