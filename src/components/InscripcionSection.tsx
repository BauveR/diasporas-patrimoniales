import { useTranslation } from 'react-i18next'
import { useDataContext } from '../contexts/DataContext'
import { ActividadCard } from './actividades/ActividadCard'
import { SlideInText } from './SlideInText'
import { RevealOnScroll, RevealGroup, RevealItem } from './RevealOnScroll'

const labelStyle = { fontFamily: "'Open Sans', sans-serif" }

// `id="sedes"` lives here (not on a wrapping element in Home.tsx) because
// every existing anchor to it — the navbar's "Registro"/"Participantes"/
// "Programa" links, the hero's "Inscribirme"/"Programa" buttons — means
// "scroll to registration", which is what this section now is. Moving that
// content into SedeSection.tsx (a separate section below) meant the id had
// to move with the meaning, not stay on the old MapSection.tsx layout it
// used to sit on.
export function InscripcionSection() {
  const { t } = useTranslation()
  const { sedes, actividades } = useDataContext()
  const sede = sedes[0]

  if (!sede) return null

  const today = new Date().toISOString().slice(0, 10)
  const sesiones = actividades
    .filter(a => a.sedeId === sede.id && !a.cancelada && a.fecha >= today)
    .sort((a, b) => a.fecha.localeCompare(b.fecha))

  return (
    <section id="sedes" className="scroll-mt-16 w-full bg-stone-100 px-10 py-24 sm:px-16 sm:py-32 lg:px-24 lg:py-40">
      <div className="mx-auto flex max-w-7xl flex-col gap-10">
        <div className="flex flex-col gap-4">
          <SlideInText
            text={t('inscripcion.titulo')}
            revealOnScroll
            className="font-mattone text-3xl font-bold tracking-tight text-[#9b2923] uppercase md:text-4xl lg:text-5xl"
          />
          <RevealOnScroll>
            <p className="max-w-2xl text-base leading-relaxed text-stone-600 md:text-lg lg:text-xl" style={labelStyle}>
              {t('inscripcion.parrafo')}
            </p>
          </RevealOnScroll>
        </div>

        {sesiones.length > 0 && (
          // Sized from the old ActividadesSlider card width (sm:w-72
          // lg:w-80) grown 40% — that slider's own scroll/grid-toggle
          // machinery is built for more items than the two fixed sessions
          // (Día 1 / Día 2) this event actually has, so these render
          // directly instead of through it.
          <RevealGroup className="flex flex-col gap-4">
            <span
              className="text-xs font-bold tracking-widest text-stone-400 uppercase"
              style={labelStyle}
            >
              {t('inscripcion.encabezado')}
            </span>
            <div className="flex flex-wrap gap-8">
              {sesiones.map(a => (
                <RevealItem key={a.id} className="w-full sm:w-[25.2rem] lg:w-[28rem]">
                  <ActividadCard actividad={a} />
                </RevealItem>
              ))}
            </div>
          </RevealGroup>
        )}
      </div>
    </section>
  )
}
