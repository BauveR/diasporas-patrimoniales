import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useDataContext } from '../contexts/DataContext'
import { useOpenActividadId } from '../contexts/ActividadInlineContext'
import { useIsDesktop } from '../hooks/useIsDesktop'
import { ActividadCard } from './actividades/ActividadCard'
import { ActividadExpandido } from './actividades/ActividadExpandido'
import { AmbosDiasCard } from './actividades/AmbosDiasCard'
import { AmbosDiasExpandido } from './actividades/AmbosDiasExpandido'
import { AmbosDiasSheet } from './actividades/AmbosDiasSheet'
import { SlideInText } from './SlideInText'
import { RevealOnScroll, RevealGroup, RevealItem } from './RevealOnScroll'
import { labelStyle } from '../lib/styles'

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
  const isDesktop = useIsDesktop()
  const sede = sedes[0]
  const [comboAbierto, setComboAbierto] = useState(false)

  if (!sede) return null

  const today = new Date().toISOString().slice(0, 10)
  const sesiones = actividades
    .filter(a => a.sedeId === sede.id && !a.cancelada && a.fecha >= today)
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
  // La card "Ambos días" solo tiene sentido con las 2 jornadas todavía
  // disponibles para inscripción — si una ya pasó (se filtró arriba), un
  // registro combinado ya no es una opción real.
  const [dia1, dia2] = sesiones

  // Solo abre inline la que de verdad es una de las sesiones de esta
  // sección — si el id abierto pertenece a otra sección (ej. la grilla de
  // Perfil), esto simplemente no encuentra nada y sigue mostrando las
  // tarjetas normales. Gateado además a `isDesktop`: en mobile, ActividadCard
  // también manda `background` ahora (antes solo en desktop), así que
  // openActividadId se resolvería igual ahí — pero mobile usa el sheet que
  // sube desde abajo (ActividadModal/ActividadSheet) en vez de este panel
  // ancho, así que las tarjetas deben seguir mostrándose detrás sin cambiar.
  const abierta = isDesktop ? sesiones.find(a => a.id === openActividadId) : undefined

  return (
    <section id="sedes" className="scroll-mt-16 w-full bg-brand-red px-10 py-24 sm:px-16 sm:py-32 lg:px-24 lg:py-40">
      <div className="mx-auto flex max-w-7xl flex-col gap-10">
        <div className="flex flex-col gap-4">
          <SlideInText
            text={t('inscripcion.titulo')}
            revealOnScroll
            className="font-mattone text-fluid-title font-bold tracking-tight text-white uppercase"
          />
          <RevealOnScroll>
            <p className="max-w-2xl text-base leading-relaxed text-white/85 md:text-lg lg:text-xl" style={labelStyle}>
              {t('inscripcion.parrafo')}
            </p>
          </RevealOnScroll>
        </div>

        {sesiones.length > 0 && (
          <div className="flex flex-col gap-4">
            <span
              className="text-xs font-bold tracking-widest text-white/60 uppercase"
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
              ) : comboAbierto && dia1 && dia2 && isDesktop ? (
                <AmbosDiasExpandido
                  key="combo"
                  dia1={dia1}
                  dia2={dia2}
                  onClose={() => setComboAbierto(false)}
                />
              ) : (
                <RevealGroup key="cards" className="flex flex-wrap gap-8 lg:gap-6" amount={0.05} staggerChildren={0.12}>
                  {/* `lg:w-96` (24rem = 384px), no `lg:w-[28rem]`: en el peor
                      caso de `lg` (1024px, ~832px de columna tras el
                      `lg:px-24` de la sección) dos tarjetas de 28rem + el gap
                      sumaban 928px y se envolvían a una debajo de la otra —
                      384px×2 + gap-6 (24px) = 792px entra con margen. */}
                  {sesiones.map(a => (
                    <RevealItem key={a.id} className="w-full sm:w-[25.2rem] lg:w-96">
                      <ActividadCard actividad={a} />
                    </RevealItem>
                  ))}
                  {dia1 && dia2 && (
                    <RevealItem key="ambos-dias" className="w-full sm:w-[25.2rem] lg:w-96">
                      <AmbosDiasCard dia1={dia1} dia2={dia2} onClick={() => setComboAbierto(true)} />
                    </RevealItem>
                  )}
                </RevealGroup>
              )}
            </AnimatePresence>
            {/* Mobile: la card "Ambos días" abre un sheet propio (no depende
                de la ruta `/actividades/:id`, a diferencia de ActividadCard/
                ActividadModal) — se monta siempre y se muestra/oculta con
                `open`, igual que el sheet mobile de AdminPage.tsx. */}
            {!isDesktop && dia1 && dia2 && (
              <AmbosDiasSheet
                dia1={dia1}
                dia2={dia2}
                open={comboAbierto}
                onClose={() => setComboAbierto(false)}
              />
            )}
          </div>
        )}
      </div>
    </section>
  )
}
