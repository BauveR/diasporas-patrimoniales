import { useState } from 'react'
import type React from 'react'
import { labelStyle } from '../../lib/styles'

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-[10px] tracking-widest uppercase text-stone-400">{children}</label>
  )
}

// `colorScheme: 'dark'` en los 3 campos de abajo (Input/Select/Textarea):
// sin esto, el navegador renderiza el caret y el overlay de autocompletado
// nativo con su esquema claro por defecto, que no matchea el fondo oscuro —
// mismo bug (y arreglo) que el input de teléfono de BookingWidget.
export function Input({ value, onChange, type = 'text', placeholder, className = '', error = false, selectOnFocus = false }: {
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
      style={{ colorScheme: 'dark' }}
      className={`w-full border rounded-xl px-3 py-2 text-base text-white bg-white/5 focus:outline-none transition-colors placeholder:text-stone-500 ${
        error ? 'border-red-500/50 focus:border-red-400' : 'border-white/15 focus:border-brand-orange'
      } ${className}`}
    />
  )
}

export function Select({ value, onChange, children, error = false }: {
  value: string | number
  onChange: (v: string) => void
  children: React.ReactNode
  error?: boolean
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{ colorScheme: 'dark' }}
      className={`w-full border rounded-xl px-3 py-2 text-base text-white bg-white/5 focus:outline-none transition-colors ${
        error ? 'border-red-500/50 focus:border-red-400' : 'border-white/15 focus:border-brand-orange'
      }`}
    >
      {children}
    </select>
  )
}

export function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null
  return <p className="text-[10px] text-red-400 mt-0.5 wrap-break-word">{msg}</p>
}

export function Textarea({ value, onChange, rows = 3, placeholder }: {
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
      style={{ colorScheme: 'dark' }}
      className="w-full border border-white/15 rounded-xl px-3 py-2 text-base text-white bg-white/5 focus:outline-none focus:border-brand-orange transition-colors resize-none placeholder:text-stone-500"
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

export function DuracionField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
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
            className="shrink-0 text-[10px] tracking-widest uppercase text-stone-400 hover:text-brand-orange transition-colors cursor-pointer"
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

export function SaveButton({ loading, success, onClick, label = 'Guardar' }: {
  loading: boolean
  success: boolean
  onClick: () => void
  label?: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`w-full py-2.5 rounded-xl text-[11px] tracking-widest uppercase transition-all disabled:opacity-40 cursor-pointer text-white hover:opacity-90 ${success ? '' : 'bg-brand-orange'}`}
      // El verde de éxito (#50664d) es el mismo que ya usa el resto del sitio
      // para "inscripción confirmada" (BookingWidget) — sin token @theme
      // propio todavía, así que se mantiene como color literal en vez de
      // introducir uno nuevo solo para este botón.
      style={success ? { backgroundColor: '#50664d' } : undefined}
    >
      {loading ? '...' : success ? '✓ Guardado' : label}
    </button>
  )
}

export function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-stone-900 rounded-2xl border border-white/10 p-6" style={labelStyle}>
      <p className="font-mattone text-[10px] font-bold tracking-widest text-brand-red uppercase mb-5">{title}</p>
      {children}
    </div>
  )
}
