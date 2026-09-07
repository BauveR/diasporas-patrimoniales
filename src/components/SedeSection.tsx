import { useTranslation } from 'react-i18next'
import { useDataContext } from '../contexts/DataContext'
import { SedePanel } from './map/SedePanel'
import { SlideInText } from './SlideInText'
import { RevealOnScroll } from './RevealOnScroll'

export function SedeSection() {
  const { t } = useTranslation()
  const { sedes } = useDataContext()
  const sede = sedes[0]

  if (!sede) return null

  return (
    // Padding plano de 64px (sin escalar por breakpoint), no la escala
    // 96/128/160 de las demás secciones — así maneja Apple sus propias
    // secciones cortas de una sola pieza (ej. su banner de upgrade usa un
    // `padding-top:64px!important` fijo en vez de la escala de sus
    // secciones de contenido largo): menos padding vertical porque el
    // contenido (una sola card) no necesita el mismo "aire" que una
    // sección con varios párrafos o una grilla.
    <section className="w-full bg-white px-10 py-16 sm:px-16 lg:px-24">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <SlideInText
          text={t('sedeSection.titulo')}
          revealOnScroll
          className="font-mattone text-3xl font-bold tracking-tight text-[#9b2923] uppercase md:text-4xl lg:text-5xl"
        />
        {/* Sin tope propio (`max-w-*`): ocupa el ancho completo del rail
            `max-w-7xl` de la sección, hasta los gutters. */}
        <RevealOnScroll className="w-full overflow-hidden rounded-3xl border border-stone-100 shadow-sm">
          <SedePanel sede={sede} />
        </RevealOnScroll>
      </div>
    </section>
  )
}
