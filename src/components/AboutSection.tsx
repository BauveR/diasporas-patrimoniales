import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SlideInText } from './SlideInText'
import { RevealGroup, RevealItem } from './RevealOnScroll'
import { labelStyle } from '../lib/styles'

// Chunk aparte (componente + datos, ~18 KB gzip) que además solo se pide
// cuando la sección está por entrar en pantalla (ver MomiaCuandoCerca): ni
// la descarga ni el parseo del JSON compiten con la carga inicial.
const MomiaConstellation = lazy(() => import('./MomiaConstellation').then(m => ({ default: m.MomiaConstellation })))

// Proporción del dibujo (w/h de momia-puntos.json): el hueco se reserva
// antes de cargar, así la página no salta cuando aparece.
const MOMIA_ASPECT = '735.8 / 531.8'

function MomiaCuandoCerca() {
  const ref = useRef<HTMLDivElement>(null)
  const [cerca, setCerca] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    // 200px de margen: carga justo antes de verse (el chunk es chico y el
    // canvas arranca vacío, sin flash). Con más margen se cargaba ya al abrir
    // la página, porque la sección está pegada al hero.
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setCerca(true)
        io.disconnect()
      }
    }, { rootMargin: '200px 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div ref={ref} className="w-full" style={{ aspectRatio: MOMIA_ASPECT }}>
      {cerca && (
        <Suspense fallback={null}>
          <MomiaConstellation className="block w-full" />
        </Suspense>
      )}
    </div>
  )
}

export function AboutSection() {
  const { t } = useTranslation()

  return (
    <section className="w-full bg-black px-10 py-24 sm:px-16 sm:py-32 lg:px-24 lg:py-40">
      <div className="mx-auto max-w-7xl">
        {/* Título en una sola línea, arriba de todo y a ancho completo. */}
        <SlideInText
          text={t('sobreEncuentro.titulo')}
          revealOnScroll
          className="font-mattone text-fluid-title font-bold tracking-tight text-brand-red uppercase sm:whitespace-nowrap"
        />
        {/* Debajo: la constelación (más ancha) y el texto. `fr`, no
            porcentajes — ver el fix de `grid-cols-[64fr_36fr]` del hero:
            porcentajes + `gap` desbordan el contenedor. */}
        <div className="mt-10 grid grid-cols-1 items-center gap-10 lg:mt-14 lg:grid-cols-[56fr_44fr] lg:gap-16">
          <MomiaCuandoCerca />
          <RevealGroup className="flex flex-col gap-5 text-sm leading-relaxed text-stone-300 md:text-base lg:text-lg" style={labelStyle}>
            <RevealItem><p>{t('sobreEncuentro.parrafo1')}</p></RevealItem>
            <RevealItem><p>{t('sobreEncuentro.parrafo2')}</p></RevealItem>
            <RevealItem><p>{t('sobreEncuentro.parrafo3')}</p></RevealItem>
          </RevealGroup>
        </div>
      </div>
    </section>
  )
}
