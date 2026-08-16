import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import type { Sede } from '../../data/sedes'
import { TEMATICA_COLORS } from '../../data/tematicas'
import { HandTap } from '../HandTap'
import { useDataContext } from '../../contexts/DataContext'

const labelStyle = { fontFamily: "'Open Sans', sans-serif" }
const titleStyle = { fontFamily: "'Google Sans Flex', sans-serif", fontVariationSettings: "'wght' 100" }

type Props = {
  sede: Sede | null
  onClose?: () => void
}

export function SedePanel({ sede, onClose }: Props) {
  const location = useLocation()
  const { actividades: todasActividades } = useDataContext()
  const [bibOpen, setBibOpen] = useState(false)
  const actividades = sede
    ? todasActividades.filter(a => a.sedeId === sede.id)
    : []

  if (!sede) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-10 gap-4">
        <HandTap className="w-40 h-40" />
        <p className="text-xs tracking-widest uppercase text-stone-400" style={labelStyle}>
          Selecciona una sede de la lista
        </p>
      </div>
    )
  }

  const stats = [
    `${actividades.length} actividad${actividades.length !== 1 ? 'es' : ''}`,
    ...(sede.declaraciones ?? []),
    ...(sede.fundacion ? [`Fundada en ${sede.fundacion}`] : []),
  ]

  return (
    <div className="flex flex-col h-full overflow-y-auto">

      {/* Hero image */}
      <div className="relative w-full aspect-16/7 shrink-0 overflow-hidden">
        <img
          src={sede.imagen}
          alt={sede.nombre}
          className="w-full h-full object-cover"
        />
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white/80 hover:bg-white transition-colors shadow-sm cursor-pointer"
            aria-label="Cerrar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-5 px-8 py-7">

        <p className="text-[10px] tracking-[0.25em] uppercase text-stone-400" style={labelStyle}>
          {sede.isla} — {sede.municipio}
        </p>

        <h2 className="text-2xl font-thin uppercase tracking-tight leading-tight" style={{ ...titleStyle, color: '#b19e7b' }}>
          {sede.nombre}
        </h2>

        <div className="w-8 h-px bg-stone-200" />

        <p className="text-sm text-stone-500 leading-relaxed" style={labelStyle}>
          {sede.descripcion}
        </p>

        {/* Stat bar */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-stone-400" style={labelStyle}>
          {stats.map((stat, i) => (
            <span key={stat} className="flex items-center gap-2">
              {i > 0 && <span aria-hidden className="text-stone-200">·</span>}
              {stat}
            </span>
          ))}
        </div>

        <div className="w-full h-px bg-stone-100" />

        <p className="text-[10px] tracking-[0.25em] uppercase text-stone-400" style={labelStyle}>
          Actividades
        </p>

        {/* Mini-cards horizontal scroll */}
        <div
          className="flex gap-3 overflow-x-auto pb-2 -mx-8 px-8"
          style={{ scrollbarWidth: 'none' }}
        >
          {actividades.map(act => (
            <Link
              key={act!.id}
              to={`/actividades/${act!.id}`}
              state={{ from: 'sedes', background: location }}
              className="flex-none w-36 flex flex-col gap-1.5 group"
            >
              <div className="aspect-4/3 rounded-xl overflow-hidden">
                <img
                  src={act!.imagen}
                  alt={act!.titulo}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <span
                className="px-2 py-0.5 rounded-full text-[9px] tracking-widest uppercase text-white font-bold w-fit"
                style={{ backgroundColor: TEMATICA_COLORS[act!.tematica] }}
              >
                {act!.tematica}
              </span>
              <p className="text-xs text-stone-800 leading-snug line-clamp-2" style={labelStyle}>
                {act!.titulo}
              </p>
            </Link>
          ))}
        </div>

        {/* Bibliografía */}
        {(sede.bibliografia?.length ?? 0) > 0 && (
          <div className="border border-stone-100 rounded-2xl overflow-hidden">
            <button
              onClick={() => setBibOpen(p => !p)}
              className="w-full flex items-center justify-between px-5 py-3.5 text-left cursor-pointer hover:bg-stone-50 transition-colors"
              style={labelStyle}
            >
              <span className="text-[10px] tracking-[0.25em] uppercase text-stone-400">Bibliografía</span>
              <svg
                xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
                className={`text-stone-300 shrink-0 transition-transform duration-200 ${bibOpen ? 'rotate-180' : ''}`}
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            {bibOpen && (
              <ul className="flex flex-col gap-2 px-5 pb-5 pt-1">
                {sede.bibliografia!.map((ref, i) => (
                  <li key={i} className="text-[11px] text-stone-500 leading-relaxed" style={labelStyle}>
                    {ref.startsWith('http') ? (
                      <a href={ref} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 decoration-stone-300 hover:text-stone-700 break-all">
                        {ref}
                      </a>
                    ) : ref}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
