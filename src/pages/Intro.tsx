import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { IntroCanvas } from '../components/intro/IntroCanvas'
import { IntroWordmark, type IntroWordmarkController } from '../components/intro/IntroWordmark'
import { IntroLiveBadge } from '../components/intro/IntroLiveBadge'
import { IntroTicker } from '../components/intro/IntroTicker'
import { IntroHeadlineTicker } from '../components/intro/IntroHeadlineTicker'
import { IntroCycleFade } from '../components/intro/IntroCycleFade'
import { SeoHead } from '../components/SeoHead'
import { useIntroIdioma } from '../hooks/useIntroIdioma'
import { INTRO_LAYOUT_DEFAULTS, INTRO_TUNING_DEFAULTS, ORB_TUNING_DEFAULTS, type IntroGuia } from '../lib/introTuning'

// TEMPORAL — guía de encuadre (puntos verdes en las esquinas del área que
// se verá): su proporción es parte de cada frame (`layout.guia`, ver
// IntroLayout en lib/introTuning.ts). Borrar este bloque (y su
// <FrameGuide /> más abajo) cuando ya no haga falta.
function computeFrame(guia: IntroGuia) {
  if (typeof window === 'undefined') return { width: 0, height: 0 }
  const ratio = guia === '9:16' ? 9 / 16 : 16 / 9
  const { innerWidth: vw, innerHeight: vh } = window
  return vw / vh > ratio
    ? { width: vh * ratio, height: vh }
    : { width: vw, height: vw / ratio }
}
function FrameGuide({ guia }: { guia: IntroGuia }) {
  const [, setResizes] = useState(0)
  useEffect(() => {
    const handler = () => setResizes((n) => n + 1)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  const frame = computeFrame(guia)
  const { width, height } = frame
  const dotStyle = 'pointer-events-none fixed z-50 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-green-500'
  const left = `calc(50% - ${width / 2}px)`
  const right = `calc(50% + ${width / 2}px)`
  const top = `calc(50% - ${height / 2}px)`
  const bottom = `calc(50% + ${height / 2}px)`
  return (
    <>
      <div className={dotStyle} style={{ left, top }} />
      <div className={dotStyle} style={{ left: right, top }} />
      <div className={dotStyle} style={{ left, top: bottom }} />
      <div className={dotStyle} style={{ left: right, top: bottom }} />
    </>
  )
}

// Dev-only, dynamically imported so the `leva` package it pulls in never
// reaches the production bundle — same pattern as PointsToShapes' own
// HeroTuningPanel.
const IntroTuningPanel = import.meta.env.DEV
  ? lazy(() => import('../components/intro/IntroTuningPanel'))
  : null

// Timing de aparición/desaparición del wordmark y del grupo badge+franjas
// dentro de cada superciclo (ver IntroCycleFade.tsx / getIntroSuperCycle en
// lib/introTuning.ts). El orb tiene el suyo propio en OrbTuning
// (appearDelay) + IntroParticleSwarm.tsx (INTRO_ORB_DISAPPEAR_SECONDS).
const WORDMARK_APPEAR_FADE_SECONDS = 7
const WORDMARK_DISAPPEAR_BEFORE_END_SECONDS = 3
const OVERLAYS_APPEAR_AT_SECONDS = 6
const OVERLAYS_APPEAR_FADE_SECONDS = 1.8
const OVERLAYS_DISAPPEAR_BEFORE_END_SECONDS = 3

// Chrome-less full-screen route (see App.tsx: /intro renders without Navbar/
// Footer). Just the animated particle background and the wordmark, centered.
// Spanish only for now; a dedicated language-transition animation for this
// version comes later, in IntroWordmark.
export function Intro() {
  const { t } = useTranslation()
  // Defaults own this in production (IntroTuningPanel never mounts there); in
  // development, IntroTuningPanel reports live slider edits back here.
  const [tuning, setTuning] = useState(INTRO_TUNING_DEFAULTS)
  const controllerRef = useRef<IntroWordmarkController | null>(null)
  // The particle swarm's own form/float/un-form cycle — independent from
  // `tuning` above on purpose (see OrbTuning's doc comment in
  // lib/introTuning.ts): changing `tuning` rebuilds IntroWordmark's whole
  // GSAP timeline, so bundling the orb's timing into it would restart the
  // wordmark every time an orb slider moved.
  const [orbTuning, setOrbTuning] = useState(ORB_TUNING_DEFAULTS)
  // Posición y tamaño del wordmark y del orb (IntroLayout).
  const [layout, setLayout] = useState(INTRO_LAYOUT_DEFAULTS)
  // Idioma del badge y de la franja de la frase (ES → FR → PT → EN).
  const idioma = useIntroIdioma(orbTuning, OVERLAYS_APPEAR_AT_SECONDS, OVERLAYS_DISAPPEAR_BEFORE_END_SECONDS)

  return (
    <div className="fixed inset-0 overflow-hidden bg-black">
      <SeoHead title={t('meta.homeTitle')} description={t('meta.homeDescription')} />
      {/* El orb tiene su propio appear (mount delay, orbTuning.appearDelay
          en IntroCanvas.tsx) + disappear (opacity de material,
          IntroParticleSwarm.tsx) — no pasa por IntroCycleFade porque
          comparte canvas con el fondo, que siempre queda visible. */}
      <IntroCanvas orbTuning={orbTuning} layout={layout} />
      {/* Wordmark a la derecha del centro (el orb queda a la izquierda) y
          algo por encima del centro vertical: ancho y desplazamiento salen
          de `layout` (IntroLayout en lib/introTuning.ts). */}
      <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center p-8">
        <IntroCycleFade
          orbTuning={orbTuning}
          appearAtSeconds={orbTuning.appearDelay}
          appearFadeSeconds={WORDMARK_APPEAR_FADE_SECONDS}
          disappearBeforeEndSeconds={WORDMARK_DISAPPEAR_BEFORE_END_SECONDS}
        >
          <div
            style={{
              width: `min(${layout.logoAnchoVw}vw, ${layout.logoAnchoMaxRem}rem)`,
              transform: `translate(${layout.logoX}vw, ${layout.logoY}vh)`,
            }}
          >
            <IntroWordmark className="h-auto w-full" tuning={tuning} controllerRef={controllerRef} />
          </div>
        </IntroCycleFade>
      </div>
      <IntroCycleFade
        orbTuning={orbTuning}
        appearAtSeconds={OVERLAYS_APPEAR_AT_SECONDS}
        appearFadeSeconds={OVERLAYS_APPEAR_FADE_SECONDS}
        disappearBeforeEndSeconds={OVERLAYS_DISAPPEAR_BEFORE_END_SECONDS}
      >
        <IntroLiveBadge {...idioma} />
        <IntroHeadlineTicker {...idioma} />
        <IntroTicker />
      </IntroCycleFade>
      <FrameGuide guia={layout.guia} />
      {IntroTuningPanel && (
        <Suspense fallback={null}>
          <IntroTuningPanel onChange={setTuning} onOrbChange={setOrbTuning} onLayoutChange={setLayout} controllerRef={controllerRef} />
        </Suspense>
      )}
    </div>
  )
}
