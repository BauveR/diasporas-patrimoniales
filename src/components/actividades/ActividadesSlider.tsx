import { useRef, useState } from 'react'
import type { Actividad } from '../../data/actividades'
import { ActividadCard } from './ActividadCard'

const labelStyle = { fontFamily: "'Open Sans', sans-serif" }

type Props = {
  actividades: Actividad[]
  labelSingular?: string
  labelPlural?: string
}

export function ActividadesSlider({
  actividades,
  labelSingular = 'actividad disponible',
  labelPlural = 'actividades disponibles',
}: Props) {
  const [mode, setMode] = useState<'slider' | 'grid'>('slider')
  const scrollRef = useRef<HTMLDivElement>(null)

  if (actividades.length === 0) return null

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'right' ? 330 : -330, behavior: 'smooth' })
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-[10px] tracking-widest uppercase text-stone-400" style={labelStyle}>
          {actividades.length} {actividades.length === 1 ? labelSingular : labelPlural}
        </p>
        {actividades.length > 3 && (
          <button
            onClick={() => setMode(m => m === 'slider' ? 'grid' : 'slider')}
            className="flex items-center gap-1.5 text-[11px] text-stone-500 hover:text-stone-800 tracking-wide transition-colors"
            style={labelStyle}
          >
            {mode === 'slider' ? <>Ver todas <span aria-hidden>→</span></> : <><span aria-hidden>←</span> Volver al slider</>}
          </button>
        )}
      </div>

      {mode === 'slider' ? (
        <div className="relative group/slider">
          {/* Flecha izquierda — desktop */}
          <button
            onClick={() => scroll('left')}
            className="hidden sm:flex absolute left-0 top-[40%] -translate-y-1/2 -translate-x-5 z-10 w-10 h-10 bg-white border border-stone-100 shadow-md rounded-full items-center justify-center text-stone-600 hover:shadow-lg hover:text-stone-900 transition-all opacity-0 group-hover/slider:opacity-100"
            aria-label="Anterior"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          {/* Flecha derecha — desktop */}
          <button
            onClick={() => scroll('right')}
            className="hidden sm:flex absolute right-0 top-[40%] -translate-y-1/2 translate-x-5 z-10 w-10 h-10 bg-white border border-stone-100 shadow-md rounded-full items-center justify-center text-stone-600 hover:shadow-lg hover:text-stone-900 transition-all opacity-0 group-hover/slider:opacity-100"
            aria-label="Siguiente"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>

          {/* Track */}
          <div
            ref={scrollRef}
            className="flex gap-5 overflow-x-auto scrollbar-none scroll-smooth pb-2 -mx-4 px-4 sm:mx-0 sm:px-0"
            style={{ scrollSnapType: 'x mandatory' }}
          >
            {actividades.map(a => (
              <div
                key={a.id}
                className="flex-shrink-0 w-[78vw] sm:w-72 lg:w-80"
                style={{ scrollSnapAlign: 'start' }}
              >
                <ActividadCard actividad={a} />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {actividades.map(a => <ActividadCard key={a.id} actividad={a} />)}
        </div>
      )}
    </div>
  )
}
