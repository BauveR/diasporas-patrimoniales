import { useTranslation } from 'react-i18next'
import { PROGRAMA_DIA_1, PROGRAMA_DIA_2 } from '../data/programa'
import { ProgramaTimeline } from './ProgramaTimeline'

const labelStyle = { fontFamily: "'Open Sans', sans-serif" }

export function ProgramaSection() {
  const { t } = useTranslation()

  return (
    <section className="w-full bg-white px-10 py-16 sm:px-16 sm:py-20 lg:px-24 lg:py-24">
      <div className="mx-auto flex max-w-7xl flex-col gap-10">
        <div className="flex flex-col gap-4">
          <h2 className="font-mattone text-2xl font-bold tracking-tight text-[#9b2923] uppercase md:text-3xl">
            {t('programa.titulo')}
          </h2>
          <p className="max-w-2xl text-sm leading-relaxed text-stone-600 md:text-base" style={labelStyle}>
            {t('programa.parrafo')}
          </p>
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
