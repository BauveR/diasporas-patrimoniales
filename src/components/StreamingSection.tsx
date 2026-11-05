import { useEffect, useState, type PointerEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion'
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
  miniaturaVideo,
  tiempoRestante,
  urlVideo,
  type SesionStreaming,
} from '../data/streaming'

// Calendario de retransmisiones al estilo de los calendarios de semanas de
// la moda (FHCM / Vogue Runway): una fila editorial por sesión con fecha
// grande, turno y las 3 versiones de idioma como pastillas que abren
// YouTube. En escritorio, al pasar sobre una fila la miniatura del directo
// sigue al cursor — solo se descarga entonces (mqdefault, ~15 KB), sin
// iframes ni scripts de YouTube en la página.

// Re-render cada 30 s: suficiente para que "En directo"/la cuenta atrás
// cambien solos sin recargar.
function useAhora(intervaloMs = 30_000) {
  const [ahora, setAhora] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setAhora(Date.now()), intervaloMs)
    return () => window.clearInterval(id)
  }, [intervaloMs])
  return ahora
}

function usePunteroFino() {
  const [fino, setFino] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia?.('(hover: hover) and (pointer: fine)')
    if (!mq) return
    setFino(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setFino(e.matches)
    mq.addEventListener?.('change', onChange)
    return () => mq.removeEventListener?.('change', onChange)
  }, [])
  return fino
}

function fechaPartes(iso: string, tag: string) {
  const partes = new Intl.DateTimeFormat(tag, { day: 'numeric', month: 'short', timeZone: ZONA_HORARIA_EVENTO }).formatToParts(new Date(iso))
  const dia = partes.find(p => p.type === 'day')?.value ?? ''
  const mes = (partes.find(p => p.type === 'month')?.value ?? '').replace('.', '')
  return { dia, mes }
}

function hora(iso: string, tag: string) {
  return new Intl.DateTimeFormat(tag, { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: ZONA_HORARIA_EVENTO }).format(new Date(iso))
}

export function StreamingSection() {
  const { t, i18n } = useTranslation()
  const locale = (i18n.language as Locale) ?? DEFAULT_LOCALE
  const tag = LOCALE_TAGS[locale] ?? LOCALE_TAGS[DEFAULT_LOCALE]
  const idiomaDefecto = idiomaStreamingPorDefecto(locale)
  const ahora = useAhora()
  const punteroFino = usePunteroFino()
  const reducirMovimiento = useReducedMotion()
  const flotante = punteroFino && !reducirMovimiento

  const [hover, setHover] = useState<SesionStreaming | null>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 300, damping: 30, mass: 0.6 })
  const sy = useSpring(y, { stiffness: 300, damping: 30, mass: 0.6 })

  const onMove = (e: PointerEvent) => {
    x.set(e.clientX + 24)
    y.set(e.clientY - 90)
  }

  return (
    <section id="streaming" className="scroll-mt-16 w-full bg-stone-50 px-10 py-24 text-stone-900 sm:px-16 sm:py-32 lg:px-24 lg:py-40">
      <div className="mx-auto flex max-w-7xl flex-col gap-14">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[30fr_70fr] lg:gap-16">
          <SlideInText
            text={t('streaming.titulo')}
            revealOnScroll
            className="font-mattone text-fluid-title font-bold tracking-tight text-brand-red uppercase"
          />
          <RevealOnScroll>
            <p className="max-w-2xl text-sm leading-relaxed text-stone-600 md:text-base lg:text-lg" style={labelStyle}>
              {t('streaming.parrafo')}
            </p>
            {locale === 'pt' && (
              <p className="mt-4 max-w-2xl text-sm text-stone-500 italic" style={labelStyle}>
                {t('streaming.avisoIdioma')}
              </p>
            )}
          </RevealOnScroll>
        </div>

        <RevealOnScroll amount={0.1}>
          <ul className="border-b border-stone-900/15" onPointerLeave={() => setHover(null)}>
            {SESIONES_STREAMING.map(sesion => {
              const estado = estadoSesion(sesion, ahora)
              const { dia, mes } = fechaPartes(sesion.inicio, tag)
              const restante = estado === 'programada' ? tiempoRestante(sesion.inicio, ahora) : null
              const turno = t(sesion.turno === 'manana' ? 'streaming.manana' : 'streaming.tarde')
              return (
                <li
                  key={sesion.id}
                  onPointerEnter={flotante ? () => setHover(sesion) : undefined}
                  onPointerMove={flotante ? onMove : undefined}
                  className="group grid grid-cols-[auto_1fr] items-center gap-x-6 gap-y-5 border-t border-stone-900/15 py-8 transition-colors hover:bg-white md:grid-cols-[11rem_1fr_auto] md:gap-x-10 md:px-4 lg:py-10"
                >
                  {/* Fecha grande — el gesto editorial del calendario. */}
                  <div className="flex flex-col leading-none">
                    <span className="font-mattone text-5xl font-bold tracking-tight transition-colors group-hover:text-brand-red lg:text-6xl">
                      {dia}
                    </span>
                    <span className="mt-2 font-mattone text-xs tracking-[0.3em] text-stone-500 uppercase">
                      {mes} · {t('streaming.dia', { n: sesion.dia })}
                    </span>
                  </div>

                  <div className="flex min-w-0 flex-col gap-2">
                    <a
                      href={urlVideo(sesion.videos[idiomaDefecto])}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-fit font-mattone text-xl font-bold leading-tight tracking-tight uppercase transition-colors hover:text-brand-red lg:text-2xl"
                    >
                      {turno}
                    </a>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-stone-500" style={labelStyle}>
                      <span>
                        {hora(sesion.inicio, tag)}–{hora(sesion.fin, tag)} · {t('streaming.horaCanarias')}
                      </span>
                      <EstadoBadge estado={estado} restante={restante} />
                    </div>
                  </div>

                  {/* Pastillas de idioma: la del idioma del sitio va rellena. */}
                  <div className="col-span-2 flex gap-2 md:col-span-1">
                    {IDIOMAS_STREAMING.map(idioma => {
                      const activa = idioma === idiomaDefecto
                      return (
                        <a
                          key={idioma}
                          href={urlVideo(sesion.videos[idioma])}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={t('streaming.verEn', { idioma: t(`streaming.idiomas.${idioma}`), turno })}
                          className={
                            'rounded-full border px-4 py-2 font-mattone text-xs font-bold tracking-widest uppercase transition-colors ' +
                            (activa
                              ? 'border-brand-orange bg-brand-orange text-white hover:opacity-85'
                              : 'border-stone-900/25 text-stone-700 hover:border-brand-red hover:text-brand-red')
                          }
                        >
                          {idioma}
                        </a>
                      )
                    })}
                  </div>
                </li>
              )
            })}
          </ul>
        </RevealOnScroll>
      </div>

      {/* Miniatura flotante que sigue al cursor (solo escritorio). */}
      <AnimatePresence>
        {flotante && hover && (
          <motion.div
            key="miniatura"
            aria-hidden="true"
            className="pointer-events-none fixed top-0 left-0 z-30 w-72 overflow-hidden rounded-sm shadow-2xl"
            style={{ x: sx, y: sy }}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <img
              src={miniaturaVideo(hover.videos[idiomaDefecto])}
              alt=""
              width={320}
              height={180}
              className="aspect-video w-full object-cover"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

function EstadoBadge({ estado, restante }: { estado: ReturnType<typeof estadoSesion>; restante: ReturnType<typeof tiempoRestante> }) {
  const { t } = useTranslation()
  const base = 'inline-flex items-center gap-2 font-mattone text-[0.65rem] font-bold tracking-widest uppercase'

  if (estado === 'directo') {
    return (
      <span className={`${base} text-brand-orange`}>
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand-orange opacity-75 motion-reduce:animate-none" />
          <span className="relative inline-flex size-2 rounded-full bg-brand-orange" />
        </span>
        {t('streaming.enDirecto')}
      </span>
    )
  }
  if (estado === 'finalizada') {
    return <span className={`${base} text-stone-400`}>{t('streaming.diferido')}</span>
  }
  if (restante) {
    const tiempo = restante.dias > 0
      ? t('streaming.diasHoras', { d: restante.dias, h: restante.horas })
      : t('streaming.horasMinutos', { h: restante.horas, m: restante.minutos })
    return <span className={`${base} text-brand-red`}>{t('streaming.empiezaEn', { tiempo })}</span>
  }
  return <span className={`${base} text-stone-400`}>{t('streaming.programada')}</span>
}
