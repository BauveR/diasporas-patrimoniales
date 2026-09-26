import { useTranslation } from 'react-i18next'
import { getPlazasEstado, type Actividad, type PlazasEstado } from '../../data/actividades'
import { useDataContext } from '../../contexts/DataContext'
import { labelStyle } from '../../lib/styles'

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
      // Mismo criterio que ActividadCard: card con fondo propio (bg-white +
      // sombra) en vez de texto directo sobre la sección — se sigue leyendo
      // igual sin importar el color de fondo de la sección que la envuelve.
      className="group flex w-full flex-col overflow-hidden rounded-2xl bg-white text-left shadow-sm cursor-pointer"
    >
      <div className="relative aspect-[4/3]">
        <img
          src={dia1.imagen}
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

      <div className="flex flex-col gap-1.5 p-4">
        <h3 className="font-mattone font-bold text-sm text-stone-900 leading-snug line-clamp-2 group-hover:text-stone-600 transition-colors">
          {t('inscripcion.ambosDias')}
        </h3>

        {sede && (
          <p className="text-[11px] text-stone-400 tracking-wide" style={labelStyle}>
            {sede.nombre} · {sede.isla}
          </p>
        )}

        <p className="text-[11px] text-stone-400" style={labelStyle}>
          {estadoLabel}
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
    </button>
  )
}
