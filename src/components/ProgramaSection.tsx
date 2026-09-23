import { useTranslation } from 'react-i18next'
import { PROGRAMA_DIA_1, PROGRAMA_DIA_2 } from '../data/programa'
import { ProgramaTimeline } from './ProgramaTimeline'
import { SlideInText } from './SlideInText'
import { RevealOnScroll } from './RevealOnScroll'

const labelStyle = { fontFamily: "'Open Sans', sans-serif" }

export function ProgramaSection() {
  const { t } = useTranslation()

  return (
    <section id="programa" className="scroll-mt-16 w-full bg-white px-10 py-24 sm:px-16 sm:py-32 lg:px-24 lg:py-40">
      <div className="mx-auto flex max-w-7xl flex-col gap-10">
        <div className="flex flex-col gap-4">
          <SlideInText
            text={t('programa.titulo')}
            revealOnScroll
            className="font-mattone text-3xl font-bold tracking-tight text-brand-red uppercase md:text-4xl lg:text-5xl"
          />
          <RevealOnScroll>
            <p className="max-w-2xl text-base leading-relaxed text-stone-600 md:text-lg lg:text-xl" style={labelStyle}>
              {t('programa.parrafo')}
            </p>
          </RevealOnScroll>
        </div>

        {/* Dos líneas de tiempo, una por jornada — en columna en mobile/
            tablet, lado a lado desde `lg`. */}
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
          <ProgramaTimeline dia={t('programa.dia1')} items={PROGRAMA_DIA_1} />
          <ProgramaTimeline dia={t('programa.dia2')} items={PROGRAMA_DIA_2} />
        </div>
      </div>
    </section>
  )
}
