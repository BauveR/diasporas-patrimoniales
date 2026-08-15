import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Actividad } from '../../data/actividades'
import { ActividadCard } from './ActividadCard'

const labelStyle = { fontFamily: "'Open Sans', sans-serif" }

type Props = { actividades: Actividad[] }

export function ActividadesInactivas({ actividades }: Props) {
  const [expanded, setExpanded] = useState(false)

  if (actividades.length === 0) return null

  const n = actividades.length

  return (
    <div className="mt-12 pt-8 border-t border-stone-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-[10px] tracking-widest uppercase text-stone-500" style={labelStyle}>
          Sin disponibilidad · {n} {n === 1 ? 'actividad' : 'actividades'}
        </p>
        <button
          onClick={() => setExpanded(e => !e)}
          className="flex items-center gap-1.5 text-[11px] text-stone-400 hover:text-stone-600 tracking-wide transition-colors"
          style={labelStyle}
        >
          {expanded
            ? <><span aria-hidden>↑</span> Mostrar menos</>
            : <><span aria-hidden>↓</span> Ver todas</>}
        </button>
      </div>

      {/* Grid con preview o expandido */}
      <div className="relative">
        <motion.div
          animate={{ maxHeight: expanded ? 2000 : 340 }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
          className="overflow-hidden"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-2">
            {actividades.map(a => <ActividadCard key={a.id} actividad={a} inactiva />)}
          </div>
        </motion.div>

        {/* Gradiente fade — solo cuando está colapsado */}
        <AnimatePresence>
          {!expanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white to-transparent pointer-events-none"
            />
          )}
        </AnimatePresence>
      </div>

      {/* Botón expandir centrado debajo del gradiente */}
      <div className="flex justify-center mt-4">
        <button
          onClick={() => setExpanded(e => !e)}
          className="px-5 py-2 rounded-full border border-stone-200 text-[11px] text-stone-500 tracking-wide hover:border-stone-400 hover:text-stone-700 transition-colors"
          style={labelStyle}
        >
          {expanded ? 'Mostrar menos' : `Ver las ${n} actividades sin disponibilidad`}
        </button>
      </div>
    </div>
  )
}
