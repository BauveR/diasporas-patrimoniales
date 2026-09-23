import { useTranslation } from 'react-i18next'
import { SlideInText } from './SlideInText'
import { RevealGroup, RevealItem } from './RevealOnScroll'

const labelStyle = { fontFamily: "'Open Sans', sans-serif" }

export function AboutSection() {
  const { t } = useTranslation()

  return (
    <section className="w-full bg-white px-10 py-24 sm:px-16 sm:py-32 lg:px-24 lg:py-40">
      {/* `grid-cols-[30fr_70fr]`, not `w-[30%]`/`w-[70%]` on flex children —
          `fr` tracks divide the space remaining *after* `gap` is subtracted,
          so the split stays exactly 30/70 regardless of gap size (see the
          hero's own `grid-cols-[64fr_36fr]` fix for the bug this avoids:
          percentage widths + flex `gap` overflow the container by the gap
          amount, silently narrowing whichever child isn't `shrink-0`). */}
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 lg:grid-cols-[30fr_70fr] lg:gap-16">
        <SlideInText
          text={t('sobreEncuentro.titulo')}
          revealOnScroll
          className="font-mattone text-fluid-title font-bold tracking-tight text-brand-red uppercase"
        />
        <RevealGroup className="flex flex-col gap-5 text-base leading-relaxed text-stone-600 md:text-lg lg:text-xl" style={labelStyle}>
          <RevealItem><p>{t('sobreEncuentro.parrafo1')}</p></RevealItem>
          <RevealItem><p>{t('sobreEncuentro.parrafo2')}</p></RevealItem>
          <RevealItem><p>{t('sobreEncuentro.parrafo3')}</p></RevealItem>
        </RevealGroup>
      </div>
    </section>
  )
}
