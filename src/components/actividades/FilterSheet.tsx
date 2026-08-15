import { createPortal } from 'react-dom'
import { motion, AnimatePresence, type Transition } from 'framer-motion'
import { useState, useEffect } from 'react'
import type { Tematica } from '../../data/tematicas'
import { TEMATICAS } from '../../data/tematicas'
import type { Dificultad } from '../../data/actividades'
import { ISLAS, DIFICULTADES } from '../../data/islas'
import { useDataContext } from '../../contexts/DataContext'
const labelStyle = { fontFamily: "'Open Sans', sans-serif" }

function useIsDesktop() {
  const [v, setV] = useState(() => window.matchMedia('(min-width: 640px)').matches)
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 640px)')
    const h = (e: MediaQueryListEvent) => setV(e.matches)
    mq.addEventListener('change', h)
    return () => mq.removeEventListener('change', h)
  }, [])
  return v
}

// Exported for reuse in FilterBar/AdminPage alongside the component in this
// file — costs Fast Refresh granularity, not correctness.
// eslint-disable-next-line react-refresh/only-export-components
export function formatMes(yyyyMM: string) {
  const [year, month] = yyyyMM.split('-')
  const s = new Date(Number(year), Number(month) - 1, 1)
    .toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export type FilterState = {
  tematica: Tematica | null
  isla: string | null
  sedeId: number | null
  mes: string | null
  dificultad: Dificultad | null
}

export type Section = 'tematica' | 'isla' | 'sede' | 'dificultad' | 'fecha'

type Props = {
  open: boolean
  initialSection?: Section | null
  onClose: () => void
  filters: FilterState
  mesesDisponibles: string[]
  onApply: (filters: FilterState) => void
}

const desktopTransition: Transition = { duration: 0.18, ease: 'easeOut' }
const mobileTransition: Transition = { type: 'spring', damping: 30, stiffness: 300 }

export function FilterSheet({ open, initialSection, onClose, filters, mesesDisponibles, onApply }: Props) {
  const isDesktop = useIsDesktop()
  const { sedes } = useDataContext()
  const [temp, setTemp] = useState<FilterState>(filters)
  const [openSection, setOpenSection] = useState<Section | null>(null)

  // Reset the draft filters whenever the sheet transitions to open — adjusting
  // state from a prop change during render (React's documented pattern for
  // this) instead of in an effect, so there's no stale-then-corrected flash.
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setTemp(filters)
      setOpenSection(initialSection ?? null)
    }
  }

  const toggle = (s: Section) => setOpenSection(p => p === s ? null : s)

  const sedesFiltrados = temp.isla ? sedes.filter(c => c.isla === temp.isla) : sedes

  const pick = {
    tematica:   (v: Tematica | null)   => { setTemp(t => ({ ...t, tematica: v }));                      setOpenSection(null) },
    isla:       (v: string | null)     => { setTemp(t => ({ ...t, isla: v, sedeId: null }));         setOpenSection(null) },
    sedeId: (v: number | null)     => { setTemp(t => ({ ...t, sedeId: v }));                     setOpenSection(null) },
    dificultad: (v: Dificultad | null) => { setTemp(t => ({ ...t, dificultad: v }));                     setOpenSection(null) },
    mes:        (v: string | null)     => { setTemp(t => ({ ...t, mes: v }));                            setOpenSection(null) },
  }

  const removePill = (key: keyof FilterState) => {
    if (key === 'isla') setTemp(t => ({ ...t, isla: null, sedeId: null }))
    else setTemp(t => ({ ...t, [key]: null }))
  }

  const pills = [
    temp.tematica   && { key: 'tematica'   as const, label: temp.tematica },
    temp.isla       && { key: 'isla'       as const, label: temp.isla },
    temp.sedeId && { key: 'sedeId' as const, label: sedes.find(c => c.id === temp.sedeId)?.nombre.replace('Sede Histórica de ', '') ?? '' },
    temp.mes        && { key: 'mes'        as const, label: formatMes(temp.mes) },
    temp.dificultad && { key: 'dificultad' as const, label: temp.dificultad },
  ].filter(Boolean) as { key: keyof FilterState; label: string }[]

  const activeCount = pills.length
  const handleApply = () => { onApply(temp); onClose() }

  const cardVariants = isDesktop
    ? { initial: { opacity: 0, scale: 0.96 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.96 } }
    : { initial: { y: '100%' }, animate: { y: 0 }, exit: { y: '100%' } }

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className={`fixed inset-0 z-[9999] bg-black/40 flex ${isDesktop ? 'items-center justify-center' : 'items-end'}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className={`bg-white flex flex-col overflow-hidden
              ${isDesktop
                ? 'w-full max-w-md rounded-2xl max-h-[80vh] shadow-2xl'
                : 'w-full rounded-t-3xl max-h-[90svh]'}`}
            variants={cardVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={isDesktop ? desktopTransition : mobileTransition}
            drag={isDesktop ? false : 'y'}
            dragConstraints={isDesktop ? undefined : { top: 0 }}
            dragElastic={isDesktop ? undefined : { top: 0 }}
            onDragEnd={isDesktop ? undefined : (_, info) => { if (info.offset.y > 80) onClose() }}
            onClick={e => e.stopPropagation()}
          >
            {/* Handle — solo mobile */}
            {!isDesktop && (
              <div className="flex justify-center pt-3 pb-1 shrink-0">
                <div className="w-10 h-1 rounded-full bg-stone-200" />
              </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 shrink-0">
              <span className="text-sm text-stone-900" style={labelStyle}>Filtros</span>
              <button onClick={onClose} className="text-stone-400 hover:text-stone-700 transition-colors" aria-label="Cerrar">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Accordion — scrollable */}
            <div className="flex-1 overflow-y-auto px-6">
              <AccordionSection label="Temática" isOpen={openSection === 'tematica'} hasValue={!!temp.tematica} onToggle={() => toggle('tematica')}>
                <OptionRow label="Todas" selected={!temp.tematica} onSelect={() => pick.tematica(null)} />
                {TEMATICAS.map(t => <OptionRow key={t} label={t} selected={temp.tematica === t} onSelect={() => pick.tematica(t)} />)}
              </AccordionSection>

              <AccordionSection label="Isla" isOpen={openSection === 'isla'} hasValue={!!temp.isla} onToggle={() => toggle('isla')}>
                <OptionRow label="Todas las islas" selected={!temp.isla} onSelect={() => pick.isla(null)} />
                {ISLAS.map(i => <OptionRow key={i} label={i} selected={temp.isla === i} onSelect={() => pick.isla(i)} />)}
              </AccordionSection>

              <AccordionSection label="Sede" isOpen={openSection === 'sede'} hasValue={!!temp.sedeId} onToggle={() => toggle('sede')}>
                <OptionRow label="Todos los sedes" selected={!temp.sedeId} onSelect={() => pick.sedeId(null)} />
                {sedesFiltrados.map(c => <OptionRow key={c.id} label={c.nombre.replace('Sede Histórica de ', '')} selected={temp.sedeId === c.id} onSelect={() => pick.sedeId(c.id)} />)}
              </AccordionSection>

              <AccordionSection label="Dificultad" isOpen={openSection === 'dificultad'} hasValue={!!temp.dificultad} onToggle={() => toggle('dificultad')}>
                <OptionRow label="Todas" selected={!temp.dificultad} onSelect={() => pick.dificultad(null)} />
                {DIFICULTADES.map(d => <OptionRow key={d} label={d} selected={temp.dificultad === d} onSelect={() => pick.dificultad(d)} />)}
              </AccordionSection>

              {mesesDisponibles.length > 0 && (
                <AccordionSection label="Fecha" isOpen={openSection === 'fecha'} hasValue={!!temp.mes} onToggle={() => toggle('fecha')}>
                  <OptionRow label="Todos los meses" selected={!temp.mes} onSelect={() => pick.mes(null)} />
                  {mesesDisponibles.map(m => <OptionRow key={m} label={formatMes(m)} selected={temp.mes === m} onSelect={() => pick.mes(m)} />)}
                </AccordionSection>
              )}
            </div>

            {/* Footer sticky */}
            <div className="shrink-0 border-t border-stone-100 px-6 pt-3 pb-6 flex flex-col gap-3">
              {pills.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {pills.map(p => (
                    <button
                      key={p.key}
                      onClick={() => removePill(p.key)}
                      className="flex-shrink-0 flex items-center gap-1 px-3 py-1 bg-stone-100 rounded-full text-[11px] text-stone-600 hover:bg-stone-200 transition-colors"
                      style={labelStyle}
                    >
                      {p.label}
                      <span className="text-stone-400 text-xs leading-none">×</span>
                    </button>
                  ))}
                </div>
              )}

              <button
                onClick={handleApply}
                className="w-full py-3.5 rounded-xl text-white text-[11px] tracking-widest uppercase transition-colors duration-200"
                style={{ ...labelStyle, backgroundColor: '#595d8d' }}
              >
                {activeCount > 0 ? `Aplicar · ${activeCount} filtro${activeCount > 1 ? 's' : ''}` : 'Aplicar'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}

function AccordionSection({ label, isOpen, hasValue, onToggle, children }: {
  label: string; isOpen: boolean; hasValue: boolean; onToggle: () => void; children: React.ReactNode
}) {
  return (
    <div className="border-b border-stone-100 last:border-0">
      <button onClick={onToggle} className="w-full flex items-center justify-between py-4" style={labelStyle}>
        <span className={`text-[11px] tracking-widest uppercase transition-colors ${hasValue ? 'text-stone-900 font-semibold' : 'text-stone-400'}`}>
          {label}
        </span>
        <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }} className="text-stone-400">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="pb-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function OptionRow({ label, selected, onSelect }: { label: string; selected: boolean; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className={`w-full flex items-center justify-between px-1 py-2.5 border-b border-stone-50 last:border-0 transition-colors text-sm ${selected ? 'text-stone-900' : 'text-stone-500 hover:text-stone-800'}`}
      style={labelStyle}
    >
      {label}
      {selected && (
        <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: '#595d8d' }}>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </span>
      )}
    </button>
  )
}
