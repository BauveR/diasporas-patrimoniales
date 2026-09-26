import { useTranslation } from 'react-i18next'
import { PROGRAMA_DIA_1, PROGRAMA_DIA_2 } from '../data/programa'
import { ProgramaTimeline } from './ProgramaTimeline'
import { SlideInText } from './SlideInText'
import { RevealOnScroll } from './RevealOnScroll'
import { labelStyle } from '../lib/styles'

export function ProgramaSection() {
  const { t } = useTranslation()

  return (
    <section id="programa" className="scroll-mt-16 w-full bg-stone-900 px-10 py-24 sm:px-16 sm:py-32 lg:px-24 lg:py-40">
      <div className="mx-auto flex max-w-7xl flex-col gap-10">
        <div className="flex flex-col gap-4">
          <SlideInText
            text={t('programa.titulo')}
            revealOnScroll
            className="font-mattone text-fluid-title font-bold tracking-tight text-brand-red uppercase"
          />
          <RevealOnScroll>
            <p className="max-w-2xl text-base leading-relaxed text-stone-300 md:text-lg lg:text-xl" style={labelStyle}>
              {t('programa.parrafo')}
            </p>
          </RevealOnScroll>
        </div>

        {/* Dos líneas de tiempo, una por jornada — en columna en mobile/
            tablet, lado a lado desde `lg`. `dark`: recolorea horas/títulos a
            blanco para el nuevo fondo bg-stone-900 de la sección.
            `showDiaHeading`: a diferencia de los otros 2 llamadores de `dark`
            (ActividadExpandido/AmbosDiasExpandido, que ya muestran su propio
            badge de día), acá sigue haciendo falta el encabezado "Día 1/2".
            `chipsLight`: los chips de ponentes se quedan con el mismo gris
            claro de siempre en vez del translúcido que sí usan esos paneles. */}
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
          <ProgramaTimeline dia={t('programa.dia1')} items={PROGRAMA_DIA_1} dark showDiaHeading chipsLight />
          <ProgramaTimeline dia={t('programa.dia2')} items={PROGRAMA_DIA_2} dark showDiaHeading chipsLight />
        </div>
      </div>
    </section>
  )
}
