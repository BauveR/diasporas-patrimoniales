import { useState } from 'react'
import type React from 'react'
import type { Actividad } from '../../data/actividades'
import { TEMATICA_COLORS } from '../../data/tematicas'
import { cancelActividad, reactivarActividad, eliminarActividad } from '../../lib/db'
import { labelStyle } from '../../lib/styles'

type ActivityCardProps = {
  actividad: Actividad
  selected: boolean
  onClick: () => void
  onEdit: () => void
}

export function ActivityCard({ actividad, selected, onClick, onEdit }: ActivityCardProps) {
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [acting, setActing] = useState(false)
  const [actingError, setActingError] = useState('')

  const count = actividad.plazas - actividad.plazasDisponibles
  const pct   = actividad.plazas > 0 ? Math.round((count / actividad.plazas) * 100) : 0
  const fecha = new Date(actividad.fecha + 'T00:00:00').toLocaleDateString('es-ES', {
    day: 'numeric', month: 'short',
  })
  const isCancelada = !!actividad.cancelada

  const handleCancel = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setActing(true)
    setActingError('')
    try { await cancelActividad(actividad.id) }
    catch { setActingError('Error al cancelar. Inténtalo de nuevo.') }
    finally { setActing(false); setConfirmCancel(false) }
  }

  const handleReactivar = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setActing(true)
    setActingError('')
    try { await reactivarActividad(actividad.id) }
    catch { setActingError('Error al reactivar. Inténtalo de nuevo.') }
    finally { setActing(false) }
  }

  const handleEliminar = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setActing(true)
    setActingError('')
    try { await eliminarActividad(actividad.id) }
    catch { setActingError('Error al eliminar. Inténtalo de nuevo.') }
    finally { setActing(false); setConfirmDelete(false) }
  }

  const plazasLibres = actividad.plazasDisponibles

  return (
    <div
      className={`rounded-xl border transition-colors ${
        selected
          ? 'border-brand-orange bg-stone-800'
          : isCancelada
            ? 'border-red-900/40 bg-red-950/20'
            : 'border-white/10 hover:border-white/25 bg-stone-800'
      }`}
      style={labelStyle}
    >
      {/* Info + barra — clickable */}
      <button onClick={onClick} className="w-full text-left px-4 pt-4 pb-3 cursor-pointer">
        {/* Tematica badge */}
        <span
          className="inline-block mb-2 px-2 py-0.5 rounded-full text-[9px] tracking-widest uppercase text-white font-medium"
          style={{ backgroundColor: isCancelada ? '#57534e' : TEMATICA_COLORS[actividad.tematica] }}
        >
          {actividad.tematica}
        </span>

        <div className="flex items-start gap-2 mb-0.5">
          <p className={`text-sm truncate flex-1 leading-snug ${isCancelada ? 'text-stone-500 line-through' : 'text-white'}`}>
            {actividad.titulo}
          </p>
          {isCancelada && (
            <span className="shrink-0 px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-400 text-[9px] tracking-widest uppercase">
              Cancelado
            </span>
          )}
        </div>
        <p className="text-[11px] text-stone-400 mb-3">{fecha}</p>

        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden mb-2">
          <div
            className={`h-full rounded-full transition-all ${isCancelada ? 'bg-stone-600' : pct >= 90 ? 'bg-red-500' : pct >= 60 ? 'bg-brand-orange' : 'bg-brand-red'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] tabular-nums">
          <span className="text-stone-400">{count} / {actividad.plazas} inscritos</span>
          {!isCancelada && plazasLibres <= 5 && plazasLibres > 0 && (
            <span className="text-red-400">¡{plazasLibres} libre{plazasLibres !== 1 ? 's' : ''}!</span>
          )}
          {!isCancelada && plazasLibres === 0 && (
            <span className="text-stone-400">Completo</span>
          )}
          {!isCancelada && plazasLibres > 5 && (
            <span className="text-stone-400">{pct}%</span>
          )}
        </div>
      </button>

      {actingError && (
        <p className="px-4 pb-2 text-[10px] text-red-400">{actingError}</p>
      )}

      {/* Acción inferior */}
      <div className="px-4 pt-2 pb-3 border-t border-white/10 flex items-center justify-between gap-3">
        {confirmCancel ? (
          <div className="flex gap-2 items-center">
            <button
              onClick={e => { e.stopPropagation(); setConfirmCancel(false) }}
              className="text-[10px] text-stone-400 hover:text-stone-200 cursor-pointer"
            >
              No
            </button>
            <button
              onClick={handleCancel}
              disabled={acting}
              className="px-3 py-1 rounded-lg bg-red-500 text-white text-[10px] tracking-widest uppercase hover:bg-red-600 disabled:opacity-40 cursor-pointer"
            >
              {acting ? '...' : 'Sí, cancelar'}
            </button>
          </div>
        ) : confirmDelete ? (
          <div className="flex gap-2 items-center">
            <button
              onClick={e => { e.stopPropagation(); setConfirmDelete(false) }}
              className="text-[10px] text-stone-400 hover:text-stone-200 cursor-pointer"
            >
              No
            </button>
            <button
              onClick={handleEliminar}
              disabled={acting}
              className="px-3 py-1 rounded-lg bg-red-700 text-white text-[10px] tracking-widest uppercase hover:bg-red-800 disabled:opacity-40 cursor-pointer"
            >
              {acting ? '...' : 'Sí, eliminar'}
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={e => { e.stopPropagation(); onEdit() }}
              className="text-[10px] tracking-widest uppercase text-stone-400 hover:text-brand-orange transition-colors cursor-pointer"
            >
              Editar
            </button>
            {isCancelada ? (
              <div className="flex gap-3 items-center">
                <button
                  onClick={handleReactivar}
                  disabled={acting}
                  className="text-[10px] tracking-widest uppercase text-stone-400 transition-colors cursor-pointer disabled:opacity-40 hover:text-[#7a9a74]"
                >
                  {acting ? '...' : 'Reactivar'}
                </button>
                <button
                  onClick={e => { e.stopPropagation(); setConfirmDelete(true) }}
                  className="text-[10px] tracking-widest uppercase text-stone-400 hover:text-red-400 transition-colors cursor-pointer"
                >
                  Eliminar
                </button>
              </div>
            ) : (
              <button
                onClick={e => { e.stopPropagation(); setConfirmCancel(true) }}
                className="text-[10px] tracking-widest uppercase text-stone-400 hover:text-red-400 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
