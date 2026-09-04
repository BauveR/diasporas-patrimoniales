import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { Actividad } from '../../data/actividades'

import { DifficultyDots } from './DifficultyDots'
import { useIsDesktop } from '../../hooks/useIsDesktop'
import { useDataContext } from '../../contexts/DataContext'
import { LOCALE_TAGS, type Locale } from '../../i18n/config'

const labelStyle = { fontFamily: "'Open Sans', sans-serif" }

type Props = { actividad: Actividad; inactiva?: boolean; from?: string }

export function ActividadCard({ actividad, inactiva = false, from = 'actividades' }: Props) {
  const { t, i18n } = useTranslation()
  const location = useLocation()
  const isDesktop = useIsDesktop()
  const { sedes } = useDataContext()
  const sede = sedes.find(c => c.id === actividad.sedeId)
  const dateTag = LOCALE_TAGS[i18n.language as Locale] ?? LOCALE_TAGS.es
  const fecha = new Date(actividad.fecha + 'T00:00:00').toLocaleDateString(dateTag, {
    day: 'numeric',
    month: 'short',
  })
  const plazasPct = actividad.plazas === 0 ? null : actividad.plazasDisponibles / actividad.plazas
  const showPlazasBadge = plazasPct !== null && (plazasPct <= 0.10 || plazasPct < 0.40 || plazasPct >= 0.60)
  const today = new Date().toISOString().slice(0, 10)
  const esProximamente = !!actividad.fechaAperturaInscripciones && actividad.fechaAperturaInscripciones > today
  const fechaApertura = esProximamente
    ? new Date(actividad.fechaAperturaInscripciones + 'T00:00:00').toLocaleDateString(dateTag, { day: 'numeric', month: 'short' })
    : null

  return (
    <Link
      to={`/actividades/${actividad.id}`}
      state={isDesktop ? { from, background: location } : { from }}
      className={`group flex flex-col gap-3 ${inactiva ? 'opacity-50' : ''}`}
    >
      {/* Imagen */}
      <div className="relative overflow-hidden rounded-2xl aspect-[4/3]">
        <img
          src={actividad.imagen}
          alt={actividad.titulo}
          className={`w-full h-full object-cover transition-transform duration-500 ${inactiva ? 'grayscale' : 'group-hover:scale-105'}`}
        />
        {/* Overlay inactiva */}
        {(inactiva || actividad.cancelada) && (
          <div className="absolute inset-0 bg-white/10 flex items-center justify-center">
            <span className="px-3 py-1 bg-white/90 text-stone-500 text-[10px] tracking-widest uppercase rounded-full" style={labelStyle}>
              {actividad.cancelada ? t('actividadCard.cancelado') : actividad.plazasDisponibles === 0 ? t('actividadCard.agotada') : t('actividadCard.finalizada')}
            </span>
          </div>
        )}
        {/* Badge temática */}
        <span
          className="absolute top-3 left-3 px-3 py-1 font-bold text-[10px] tracking-widest uppercase rounded-full"
          style={{ ...labelStyle, color: '#cd6a26', backgroundColor: 'white', outline: '1.5px solid #cd6a26' }}
        >
          {actividad.tematica}
        </span>
        {/* Badge plazas / próximamente */}
        {esProximamente ? (
          <span
            className="absolute top-3 right-3 px-3 py-1 font-bold text-[10px] tracking-widest uppercase rounded-full text-white"
            style={{ ...labelStyle, backgroundColor: '#595d8d' }}
          >
            {t('actividadCard.abreEl', { fecha: fechaApertura })}
          </span>
        ) : showPlazasBadge && (
          <span
            className="absolute top-3 right-3 px-3 py-1 font-bold text-[10px] tracking-widest uppercase rounded-full text-white"
            style={{ ...labelStyle, backgroundColor: '#cd6a26' }}
          >
            {t('actividadCard.plazasBadge', { n: actividad.plazasDisponibles })}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1.5 px-1">
        <h3
          className="text-sm text-stone-900 leading-snug line-clamp-2 group-hover:text-stone-600 transition-colors"
          style={labelStyle}
        >
          {actividad.titulo}
        </h3>

        {sede && (
          <p className="text-[11px] text-stone-400 tracking-wide" style={labelStyle}>
            {sede.nombre} · {sede.isla}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-stone-500" style={labelStyle}>
          <span>{fecha} · {actividad.hora}</span>
          <span className="text-stone-300">·</span>
          <span>{actividad.duracion}</span>
        </div>
        <DifficultyDots dificultad={actividad.dificultad} />

        <p className="text-[11px] text-stone-400" style={labelStyle}>
          {esProximamente
            ? t('actividadCard.inscripcionesDesde', { fecha: fechaApertura })
            : t('actividadCard.plazasDisponibles', { disponibles: actividad.plazasDisponibles, total: actividad.plazas })}
        </p>

        <span
          className="mt-1 text-[10px] tracking-widest uppercase text-stone-400 group-hover:text-stone-700 transition-colors duration-200 flex items-center gap-1"
          style={labelStyle}
        >
          {t('actividadCard.verDetalle')}
          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="translate-x-0 group-hover:translate-x-0.5 transition-transform duration-200">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </span>
      </div>
    </Link>
  )
}
