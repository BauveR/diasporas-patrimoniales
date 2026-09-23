import { AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useDataContext } from '../contexts/DataContext'
import { useOpenActividadId } from '../contexts/ActividadInlineContext'
import { ActividadCard } from './actividades/ActividadCard'
import { ActividadExpandido } from './actividades/ActividadExpandido'
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
  const navigate = useNavigate()
  const { sedes, actividades } = useDataContext()
  const openActividadId = useOpenActividadId()
  const sede = sedes[0]

  if (!sede) return null

  const today = new Date().toISOString().slice(0, 10)
  const sesiones = actividades
    .filter(a => a.sedeId === sede.id && !a.cancelada && a.fecha >= today)
    .sort((a, b) => a.fecha.localeCompare(b.fecha))

  // Solo abre inline la que de verdad es una de las sesiones de esta
  // sección — si el id abierto pertenece a otra sección (ej. la grilla de
  // Perfil), esto simplemente no encuentra nada y sigue mostrando las
  // tarjetas normales.
  const abierta = sesiones.find(a => a.id === openActividadId)

  return (
    <section id="sedes" className="scroll-mt-16 w-full bg-stone-100 px-10 py-24 sm:px-16 sm:py-32 lg:px-24 lg:py-40">
      <div className="mx-auto flex max-w-7xl flex-col gap-10">
        <div className="flex flex-col gap-4">
          <SlideInText
            text={t('inscripcion.titulo')}
            revealOnScroll
            className="font-mattone text-3xl font-bold tracking-tight text-brand-red uppercase md:text-4xl lg:text-5xl"
          />
          <RevealOnScroll>
            <p className="max-w-2xl text-base leading-relaxed text-stone-600 md:text-lg lg:text-xl" style={labelStyle}>
              {t('inscripcion.parrafo')}
            </p>
          </RevealOnScroll>
        </div>

        {sesiones.length > 0 && (
          <div className="flex flex-col gap-4">
            <span
              className="text-xs font-bold tracking-widest text-stone-400 uppercase"
              style={labelStyle}
            >
              {t('inscripcion.encabezado')}
            </span>
            {/* Con una sesión abierta, el panel horizontal (ActividadExpandido)
                reemplaza la fila de tarjetas en vez de superponerse encima —
                usa el ancho total de la sección como lienzo, sin necesidad de
                anclarse a la celda exacta que se clickeó (a diferencia de
                ParticipanteExpandido, acá no hay una grilla CSS fija de la que
                calcular fila/columna).

                RevealGroup vive DENTRO del ternario (no por fuera, envolviendo
                todo, como antes) a propósito: su trigger de scroll-into-view
                es `once: true`, guardado en el propio motion.div — si viviera
                afuera y sobreviviera el swap entre panel/tarjetas, las
                tarjetas se remontarían dentro de un observer que ya disparó
                una vez y quedarían congeladas en su estado "hidden" (opacity
                0) para siempre al volver a mostrarse. Que todo el RevealGroup
                se desmonte y remonte junto con las tarjetas es lo que le da
                un observer nuevo, y por lo tanto una revelación nueva, cada
                vez que se cierra el panel. */}
            <AnimatePresence mode="wait">
              {abierta ? (
                <ActividadExpandido
                  key={abierta.id}
                  actividad={abierta}
                  onClose={() => navigate(-1)}
                />
              ) : (
                <RevealGroup key="cards" className="flex flex-wrap gap-8" amount={0.05} staggerChildren={0.12}>
                  {sesiones.map(a => (
                    <RevealItem key={a.id} className="w-full sm:w-[25.2rem] lg:w-[28rem]">
                      <ActividadCard actividad={a} />
                    </RevealItem>
                  ))}
                </RevealGroup>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </section>
  )
}
