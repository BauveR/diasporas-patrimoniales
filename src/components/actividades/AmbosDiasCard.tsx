import { useTranslation } from 'react-i18next'
import { getPlazasEstado, IMAGEN_AMBOS_DIAS, type Actividad, type PlazasEstado } from '../../data/actividades'
import { useDataContext } from '../../contexts/DataContext'
import { labelStyle } from '../../lib/styles'
import { ikImage } from '../../lib/imagekit'

// Cuál de las 2 jornadas es el cuello de botella real de "ambos días": si
// una está más comprometida que la otra, ese es el estado que importa
// mostrar (inscribirse a ambos días no es más fácil que inscribirse a la
// jornada más ajustada de las dos).
const ESTADO_RANK: Record<PlazasEstado, number> = { disponibles: 0, algunas: 1, pocas: 2, agotada: 3 }

function peorEstado(a: Actividad, b: Actividad): PlazasEstado {
  const estadoA = getPlazasEstado(a)
  const estadoB = getPlazasEstado(b)
  return ESTADO_RANK[estadoA] >= ESTADO_RANK[estadoB] ? estadoA : estadoB
}

type Props = { dia1: Actividad; dia2: Actividad; onClick: () => void }

export function AmbosDiasCard({ dia1, dia2, onClick }: Props) {
  const { t } = useTranslation()
  const { sedes } = useDataContext()
  const sede = sedes.find(c => c.id === dia1.sedeId)

  const estado = peorEstado(dia1, dia2)
  const estadoLabel = t(`actividadCard.${estado === 'algunas' ? 'algunasPlazas' : estado === 'pocas' ? 'pocasPlazas' : 'plazasDisponibles'}`)

  return (
    <button
      type="button"
      onClick={onClick}
      // Mismo criterio que ActividadCard: card con fondo propio (bg-stone-900
      // + sombra) en vez de texto directo sobre la sección.
      className="group flex h-full w-full flex-col overflow-hidden rounded-2xl bg-stone-900 text-left shadow-sm cursor-pointer"
    >
      <div className="relative aspect-[4/3]">
        <img
          src={ikImage(IMAGEN_AMBOS_DIAS, 800)}
          alt={t('inscripcion.ambosDias')}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* Mismo estilo que ActividadCard: pastilla blanca con borde/texto en
            naranja, siempre visible sobre la imagen. */}
        <span
          className="absolute top-3 left-3 px-3 py-1 font-bold text-[10px] tracking-widest uppercase rounded-full"
          style={{ ...labelStyle, color: '#cd6a26', backgroundColor: 'white', outline: '1.5px solid #cd6a26' }}
        >
          {estadoLabel}
        </span>
      </div>

      {/* flex-1 + CTA con mt-auto: mismo criterio que ActividadCard, para
          que el "Ver detalle" quede pegado abajo aunque esta tarjeta tenga
          un renglón menos de texto (no trae la línea de fecha/duración). */}
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <h3 className="font-mattone font-bold text-sm text-white leading-snug line-clamp-2 group-hover:text-white/70 transition-colors">
          {t('inscripcion.ambosDias')}
        </h3>

        {sede && (
          <p className="text-[11px] text-white/60 tracking-wide" style={labelStyle}>
            {sede.nombre} · {sede.isla}
          </p>
        )}

        <p className="text-[11px] text-white/60" style={labelStyle}>
          {estadoLabel}
        </p>

        <span
          className="mt-auto pt-1 text-[10px] tracking-widest uppercase text-white/60 group-hover:text-white transition-colors duration-200 flex items-center gap-1"
          style={labelStyle}
        >
          {t('actividadCard.verDetalle')}
          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="translate-x-0 group-hover:translate-x-0.5 transition-transform duration-200">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </span>
      </div>
    </button>
  )
}
