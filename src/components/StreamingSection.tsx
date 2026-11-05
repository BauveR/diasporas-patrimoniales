import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SlideInText } from './SlideInText'
import { RevealOnScroll } from './RevealOnScroll'
import { labelStyle } from '../lib/styles'
import { DEFAULT_LOCALE, LOCALE_TAGS, type Locale } from '../i18n/config'
import {
  IDIOMAS_STREAMING,
  SESIONES_STREAMING,
  ZONA_HORARIA_EVENTO,
  estadoSesion,
  idiomaStreamingPorDefecto,
  tiempoRestante,
  urlVideo,
  type IdiomaStreaming,
} from '../data/streaming'

// Retransmisiones como "lookbook" (Prada / Jacquemus / SSENSE): rejilla 2×2
// de tarjetas grandes con la miniatura del directo en 16:9, desaturada hasta
// el hover, y un selector de idioma único para toda la sección (por defecto
// el del sitio; PT → EN). Sin iframes ni scripts de YouTube: cada tarjeta es
// un enlace y la miniatura se carga en diferido (loading="lazy").

// Re-render cada 30 s: "En directo"/la cuenta atrás cambian solos.
function useAhora(intervaloMs = 30_000) {
  const [ahora, setAhora] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setAhora(Date.now()), intervaloMs)
    return () => window.clearInterval(id)
  }, [intervaloMs])
  return ahora
}

function fecha(iso: string, tag: string) {
  return new Intl.DateTimeFormat(tag, { day: 'numeric', month: 'short', timeZone: ZONA_HORARIA_EVENTO })
    .format(new Date(iso))
    .replace('.', '')
}

function hora(iso: string, tag: string) {
  return new Intl.DateTimeFormat(tag, { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: ZONA_HORARIA_EVENTO }).format(new Date(iso))
}

// hqdefault (480×360) recortada a 16:9 con object-cover: tapa las bandas
// negras y existe siempre, también en directos aún no emitidos (maxresdefault no).
function miniatura(id: string) {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
}

// Punto naranja que parpadea — señal de "en vivo" junto al título.
function PuntoVivo({ className = '' }: { className?: string }) {
  return (
    <span aria-hidden="true" className={`relative inline-flex ${className}`}>
      <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand-orange opacity-75 motion-reduce:animate-none" />
      <span className="relative inline-flex size-full rounded-full bg-brand-orange animate-pulse motion-reduce:animate-none" />
    </span>
  )
}

export function StreamingSection() {
  const { t, i18n } = useTranslation()
  const locale = (i18n.language as Locale) ?? DEFAULT_LOCALE
  const tag = LOCALE_TAGS[locale] ?? LOCALE_TAGS[DEFAULT_LOCALE]
  const ahora = useAhora()

  const [idioma, setIdioma] = useState<IdiomaStreaming>(() => idiomaStreamingPorDefecto(locale))
  // Cambiar el idioma del sitio reajusta el selector.
  useEffect(() => setIdioma(idiomaStreamingPorDefecto(locale)), [locale])

  return (
    <section id="streaming" className="scroll-mt-16 w-full bg-stone-50 px-10 py-24 text-stone-900 sm:px-16 sm:py-32 lg:px-24 lg:py-40">
      <div className="mx-auto flex max-w-7xl flex-col gap-14">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[30fr_70fr] lg:gap-16">
          <div className="flex items-start gap-3">
            <SlideInText
              text={t('streaming.titulo')}
              revealOnScroll
              className="font-mattone text-fluid-title font-bold tracking-tight text-brand-red uppercase"
            />
            <PuntoVivo className="mt-[0.35em] size-3 shrink-0 lg:size-3.5" />
          </div>
          <RevealOnScroll>
            <p className="max-w-2xl text-sm leading-relaxed text-stone-600 md:text-base lg:text-lg" style={labelStyle}>
              {t('streaming.parrafo')}
            </p>
            {locale === 'pt' && (
              <p className="mt-4 max-w-2xl text-sm text-stone-500 italic" style={labelStyle}>
                {t('streaming.avisoIdioma')}
              </p>
            )}

            {/* Selector de idioma único para las 4 tarjetas. */}
            <div role="radiogroup" aria-label={t('streaming.idiomaSelector')} className="mt-8 inline-flex rounded-full border border-stone-900/20 p-1">
              {IDIOMAS_STREAMING.map(i => {
                const activo = i === idioma
                return (
                  <button
                    key={i}
                    type="button"
                    role="radio"
                    aria-checked={activo}
                    aria-label={t(`streaming.idiomas.${i}`)}
                    onClick={() => setIdioma(i)}
                    className={
                      'rounded-full px-5 py-2 font-mattone text-xs font-bold tracking-widest uppercase transition-colors ' +
                      (activo ? 'bg-brand-orange text-white' : 'text-stone-600 hover:text-brand-red')
                    }
                  >
                    {i}
                  </button>
                )
              })}
            </div>
          </RevealOnScroll>
        </div>

        <ul className="grid grid-cols-1 gap-x-8 gap-y-14 md:grid-cols-2 lg:gap-x-12 lg:gap-y-20">
          {SESIONES_STREAMING.map((sesion, i) => {
            const estado = estadoSesion(sesion, ahora)
            const restante = estado === 'programada' ? tiempoRestante(sesion.inicio, ahora) : null
            const turno = t(sesion.turno === 'manana' ? 'streaming.manana' : 'streaming.tarde')
            const videoId = sesion.videos[idioma]
            return (
              <li key={sesion.id}>
              <RevealOnScroll delay={(i % 2) * 0.12} amount={0.2}>
                <a
                  href={urlVideo(videoId)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t('streaming.verEn', { idioma: t(`streaming.idiomas.${idioma}`), turno })}
                  className="group block"
                >
                  <div className="relative aspect-video overflow-hidden bg-stone-200">
                    <img
                      key={videoId}
                      src={miniatura(videoId)}
                      alt=""
                      width={480}
                      height={270}
                      loading="lazy"
                      decoding="async"
                      className={
                        'size-full object-cover transition duration-700 ease-out group-hover:scale-[1.04] group-hover:grayscale-0 ' +
                        (estado === 'directo' ? 'grayscale-0' : 'grayscale')
                      }
                    />
                    {/* Etiqueta de estado arriba a la izquierda, como el
                        "NEW IN" de las fichas de moda. */}
                    <div className="absolute top-4 left-4">
                      <EstadoEtiqueta estado={estado} restante={restante} />
                    </div>
                    {/* Número de look grande, abajo a la derecha. */}
                    <span className="absolute right-4 bottom-2 font-mattone text-5xl font-bold text-white/90 mix-blend-difference lg:text-6xl">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                  </div>

                  <div className="mt-5 flex items-start justify-between gap-6 border-t border-stone-900/15 pt-4">
                    <div className="flex min-w-0 flex-col gap-1.5">
                      <span className="font-mattone text-[0.65rem] tracking-[0.3em] text-stone-500 uppercase">
                        {t('streaming.dia', { n: sesion.dia })} · {fecha(sesion.inicio, tag)}
                      </span>
                      <span className="font-mattone text-lg font-bold leading-tight tracking-tight uppercase transition-colors group-hover:text-brand-red lg:text-xl">
                        {turno}
                      </span>
                      <span className="text-sm text-stone-500" style={labelStyle}>
                        {hora(sesion.inicio, tag)}–{hora(sesion.fin, tag)} · {t('streaming.horaCanarias')}
                      </span>
                    </div>
                    <span
                      aria-hidden="true"
                      className="mt-5 font-mattone text-2xl text-stone-400 transition duration-300 group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-brand-red"
                    >
                      ↗
                    </span>
                  </div>
                </a>
              </RevealOnScroll>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

function EstadoEtiqueta({ estado, restante }: { estado: ReturnType<typeof estadoSesion>; restante: ReturnType<typeof tiempoRestante> }) {
  const { t } = useTranslation()
  const base = 'inline-flex items-center gap-2 rounded-full px-3 py-1.5 font-mattone text-[0.6rem] font-bold tracking-widest uppercase backdrop-blur-sm'

  if (estado === 'directo') {
    return (
      <span className={`${base} bg-brand-orange text-white`}>
        <span className="relative flex size-1.5">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-white opacity-75 motion-reduce:animate-none" />
          <span className="relative inline-flex size-1.5 rounded-full bg-white" />
        </span>
        {t('streaming.enDirecto')}
      </span>
    )
  }
  if (estado === 'finalizada') {
    return <span className={`${base} bg-white/85 text-stone-700`}>{t('streaming.diferido')}</span>
  }
  if (restante) {
    const tiempo = restante.dias > 0
      ? t('streaming.diasHoras', { d: restante.dias, h: restante.horas })
      : t('streaming.horasMinutos', { h: restante.horas, m: restante.minutos })
    return <span className={`${base} bg-white/85 text-brand-red`}>{t('streaming.empiezaEn', { tiempo })}</span>
  }
  return <span className={`${base} bg-white/85 text-stone-700`}>{t('streaming.programada')}</span>
}
