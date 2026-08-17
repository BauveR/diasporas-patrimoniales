import { useState } from 'react'
import type { Sede } from '../../data/sedes'
import { useDataContext } from '../../contexts/DataContext'

const labelStyle = { fontFamily: "'Open Sans', sans-serif" }
const titleStyle = { fontFamily: "'Google Sans Flex', sans-serif", fontVariationSettings: "'wght' 100" }

type Props = {
  sede: Sede
}

export function SedePanel({ sede }: Props) {
  const { actividades: todasActividades } = useDataContext()
  const [bibOpen, setBibOpen] = useState(false)
  const actividades = todasActividades.filter(a => a.sedeId === sede.id)

  const stats = [
    `${actividades.length} actividad${actividades.length !== 1 ? 'es' : ''}`,
    ...(sede.declaraciones ?? []),
    ...(sede.fundacion ? [`Fundada en ${sede.fundacion}`] : []),
  ]

  return (
    <div className="flex flex-col">

      {/* Hero image */}
      <div className="relative w-full aspect-16/7 shrink-0 overflow-hidden">
        <img
          src={sede.imagen}
          alt={sede.nombre}
          className="w-full h-full object-cover"
        />
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
