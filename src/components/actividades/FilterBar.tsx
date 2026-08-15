import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TEMATICAS, type Tematica } from '../../data/tematicas'
import type { Dificultad } from '../../data/actividades'
import { SEDES } from '../../data/sedes'
import { ISLAS, DIFICULTADES } from '../../data/islas'
import { formatMes } from './FilterSheet'
const labelStyle = { fontFamily: "'Open Sans', sans-serif" }

type Props = {
  tematica: Tematica | null
  isla: string | null
  sedeId: number | null
  mes: string | null
  dificultad: Dificultad | null
  mesesDisponibles: string[]
  onTematica: (t: Tematica | null) => void
  onIsla: (i: string | null) => void
  onSede: (id: number | null) => void
  onMes: (m: string | null) => void
  onDificultad: (d: Dificultad | null) => void
  onOpenSheet: () => void
}

export function FilterBar({
  tematica, isla, sedeId, mes, dificultad, mesesDisponibles,
  onTematica, onIsla, onSede, onMes, onDificultad, onOpenSheet,
}: Props) {
  const [panelOpen, setPanelOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!panelOpen) return
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node))
        setPanelOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [panelOpen])

  const sedesFiltrados = isla ? SEDES.filter(c => c.isla === isla) : SEDES

  const activePills = [
    tematica   && { key: 'tematica',   label: tematica,   onClear: () => onTematica(null) },
    isla       && { key: 'isla',       label: isla,        onClear: () => { onIsla(null); onSede(null) } },
    sedeId && { key: 'sede',   label: SEDES.find(c => c.id === sedeId)?.nombre.replace('Sede Histórica de ', '') ?? '', onClear: () => onSede(null) },
    dificultad && { key: 'dificultad', label: dificultad,  onClear: () => onDificultad(null) },
    mes        && { key: 'mes',        label: formatMes(mes), onClear: () => onMes(null) },
  ].filter(Boolean) as { key: string; label: string; onClear: () => void }[]

  const activeCount = activePills.length

  return (
    <div ref={wrapperRef}>

      {/* ── Mobile: botón → FilterSheet ── */}
      <div className="flex items-center gap-2 sm:hidden">
        <button
          onClick={onOpenSheet}
          className="flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] text-white tracking-wide transition-colors"
          style={{ ...labelStyle, backgroundColor: '#595d8d' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M4 6h16M7 12h10M10 18h4" />
          </svg>
          Filtros
          {activeCount > 0 && (
            <span className="w-4 h-4 rounded-full text-white text-[9px] flex items-center justify-center font-bold" style={{ backgroundColor: '#b19e7b' }}>
              {activeCount}
            </span>
          )}
        </button>
        {activeCount > 0 && (
          <button
            onClick={() => { onTematica(null); onIsla(null); onSede(null); onMes(null); onDificultad(null) }}
            className="text-[11px] text-stone-400 hover:text-stone-700 transition-colors"
            style={labelStyle}
          >
            Limpiar
          </button>
        )}
      </div>

      {/* ── Desktop: botón + pills + panel ── */}
      <div className="hidden sm:block">

        {/* Fila de controles */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setPanelOpen(p => !p)}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[11px] text-white tracking-wide transition-colors"
            style={{ ...labelStyle, backgroundColor: '#595d8d' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M4 6h16M7 12h10M10 18h4" />
            </svg>
            Filtros
            <motion.span animate={{ rotate: panelOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </motion.span>
          </button>

          {/* Pills activas */}
          {activePills.map(pill => (
            <button
              key={pill.key}
              onClick={pill.onClear}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-stone-300 bg-stone-100 text-[11px] text-stone-700 tracking-wide hover:bg-stone-200 transition-colors"
              style={labelStyle}
            >
              {pill.label}
              <span className="text-stone-400 text-xs leading-none">×</span>
            </button>
          ))}

          {activeCount > 0 && (
            <button
              onClick={() => { onTematica(null); onIsla(null); onSede(null); onMes(null); onDificultad(null) }}
              className="text-[11px] text-stone-400 hover:text-stone-700 transition-colors"
              style={labelStyle}
            >
              Limpiar todo
            </button>
          )}
        </div>

        {/* Panel expandible */}
        <AnimatePresence>
          {panelOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="mt-3 border border-stone-100 rounded-2xl bg-white shadow-sm p-6 grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-6">

                <FilterColumn
                  title="Temática"
                  options={[{ value: null, label: 'Todas' }, ...TEMATICAS.map(t => ({ value: t, label: t }))]}
                  selected={tematica}
                  onSelect={v => onTematica(v as Tematica | null)}
                />

                <FilterColumn
                  title="Isla"
                  options={[{ value: null, label: 'Todas' }, ...ISLAS.map(i => ({ value: i, label: i }))]}
                  selected={isla}
                  onSelect={v => { onIsla(v); if (!v) onSede(null) }}
                />

                <FilterColumn
                  title="Sede"
                  options={[{ value: null, label: 'Todos' }, ...sedesFiltrados.map(c => ({ value: String(c.id), label: c.nombre.replace('Sede Histórica de ', '') }))]}
                  selected={sedeId ? String(sedeId) : null}
                  onSelect={v => onSede(v ? Number(v) : null)}
                />

                <FilterColumn
                  title="Dificultad"
                  options={[{ value: null, label: 'Todas' }, ...DIFICULTADES.map(d => ({ value: d, label: d }))]}
                  selected={dificultad}
                  onSelect={v => onDificultad(v as Dificultad | null)}
                />

                {mesesDisponibles.length > 0 && (
                  <FilterColumn
                    title="Fecha"
                    options={[{ value: null, label: 'Todos' }, ...mesesDisponibles.map(m => ({ value: m, label: formatMes(m) }))]}
                    selected={mes}
                    onSelect={v => onMes(v)}
                  />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ── Sub-componente ────────────────────────────────────────────

type Option = { value: string | null; label: string }

function FilterColumn({ title, options, selected, onSelect }: {
  title: string
  options: Option[]
  selected: string | null
  onSelect: (v: string | null) => void
}) {
  const labelStyle = { fontFamily: "'Open Sans', sans-serif" }
  return (
    <div className="flex flex-col gap-1">
      <p className="text-[10px] tracking-widest uppercase mb-2 font-semibold" style={{ ...labelStyle, color: '#cd6a26' }}>
        {title}
      </p>
      {options.map(opt => (
        <button
          key={opt.value ?? '__all'}
          onClick={() => onSelect(opt.value)}
          className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-left transition-colors w-full ${
            selected === opt.value
              ? 'bg-stone-100 text-stone-900 font-medium'
              : 'text-stone-500 hover:text-stone-800 hover:bg-stone-50'
          }`}
          style={labelStyle}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
