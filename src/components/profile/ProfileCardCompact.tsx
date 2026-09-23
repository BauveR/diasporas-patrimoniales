import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import type { Actividad } from '../../data/actividades'
import { TEMATICA_COLORS } from '../../data/tematicas'
import { useDataContext } from '../../contexts/DataContext'

const labelStyle = { fontFamily: "'Open Sans', sans-serif" }

type Props = {
  actividad: Actividad
  inactiva?: boolean
  onLiberar?: () => Promise<void>
}

export function ProfileCardCompact({ actividad, inactiva = false, onLiberar }: Props) {
  const location = useLocation()
  const { sedes } = useDataContext()
  const sede = sedes.find(c => c.id === actividad.sedeId)
  const [confirmando, setConfirmando] = useState(false)
  const [liberando, setLiberando] = useState(false)

  const fecha = new Date(actividad.fecha + 'T00:00:00').toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
  })

  const handleLiberar = async () => {
    if (!onLiberar) return
    setLiberando(true)
    try {
      await onLiberar()
    } finally {
      setLiberando(false)
      setConfirmando(false)
    }
  }

  return (
    <div className={`flex gap-4 items-center ${inactiva || actividad.cancelada ? 'opacity-50' : ''}`} style={labelStyle}>

      {/* Imagen */}
      <Link
        to={`/actividades/${actividad.id}`}
        state={{ from: 'perfil-mobile', background: location }}
        className="relative shrink-0 w-20 h-20 rounded-2xl overflow-hidden"
      >
        <img
          src={actividad.imagen}
          alt={actividad.titulo}
          loading="lazy"
          className={`w-full h-full object-cover transition-transform duration-300 ${inactiva || actividad.cancelada ? 'grayscale' : 'hover:scale-105'}`}
        />
        {(inactiva || actividad.cancelada) && (
          <div className="absolute inset-0 bg-white/20 flex items-center justify-center">
            <span className="px-2 py-0.5 bg-white/90 text-stone-400 text-[9px] tracking-widest uppercase rounded-full">
              {actividad.cancelada ? 'Cancelado' : 'Finalizada'}
            </span>
          </div>
        )}
      </Link>

      {/* Info + acción */}
      <div className="flex flex-col gap-1 min-w-0 flex-1">
        <span
          className="w-fit px-2 py-0.5 rounded-full text-[9px] tracking-widest uppercase text-white font-bold"
          style={{ backgroundColor: TEMATICA_COLORS[actividad.tematica] }}
        >
          {actividad.tematica}
        </span>
        <Link
          to={`/actividades/${actividad.id}`}
          state={{ from: 'perfil-mobile', background: location }}
          className="text-sm text-stone-800 leading-snug line-clamp-2 hover:text-stone-500 transition-colors"
        >
          {actividad.titulo}
        </Link>
        <p className="text-[11px] text-stone-400">
          {fecha} · {actividad.hora}{sede ? ` · ${sede.isla}` : ''}
        </p>

        {/* Aviso cancelación */}
        {actividad.cancelada && (
          <p className="mt-0.5 text-[10px] tracking-widest uppercase text-red-400">
            Evento cancelado
          </p>
        )}

        {/* Liberar plaza — solo futuras no canceladas */}
        {!inactiva && !actividad.cancelada && onLiberar && (
          confirmando ? (
            <div className="flex gap-2 mt-1">
              <button
                onClick={handleLiberar}
                disabled={liberando}
                className="text-[10px] tracking-widest uppercase text-red-400 hover:text-red-600 transition-colors disabled:opacity-40 cursor-pointer"
              >
                {liberando ? '...' : 'Sí, liberar'}
              </button>
              <span className="text-stone-200 text-[10px]">·</span>
              <button
                onClick={() => setConfirmando(false)}
                disabled={liberando}
                className="text-[10px] tracking-widest uppercase text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
              >
                Mantener
              </button>
            </div>
          ) : (
            <div className="flex gap-2 mt-1">
              <button
                onClick={() => setConfirmando(true)}
                className="w-fit text-[10px] tracking-widest uppercase text-stone-500 hover:text-red-400 transition-colors cursor-pointer"
              >
                Liberar plaza
              </button>
            </div>
          )
        )}
      </div>
    </div>
  )
}
