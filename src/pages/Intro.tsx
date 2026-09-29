import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { IntroCanvas } from '../components/intro/IntroCanvas'
import { IntroWordmark, type IntroWordmarkController } from '../components/intro/IntroWordmark'
import { IntroLiveBadge } from '../components/intro/IntroLiveBadge'
import { SeoHead } from '../components/SeoHead'
import { INTRO_TUNING_DEFAULTS, ORB_TUNING_DEFAULTS } from '../lib/introTuning'

// TEMPORAL — guía de encuadre 16:9 (proporción estándar de YouTube) para
// grabar la pantalla. Borrar este bloque (y su <YoutubeFrameGuide /> más
// abajo) una vez terminada la grabación.
const YOUTUBE_RATIO = 16 / 9
function computeYoutubeFrame() {
  if (typeof window === 'undefined') return { width: 0, height: 0 }
  const { innerWidth: vw, innerHeight: vh } = window
  return vw / vh > YOUTUBE_RATIO
    ? { width: vh * YOUTUBE_RATIO, height: vh }
    : { width: vw, height: vw / YOUTUBE_RATIO }
}
function YoutubeFrameGuide() {
  const [frame, setFrame] = useState(computeYoutubeFrame)
  useEffect(() => {
    const handler = () => setFrame(computeYoutubeFrame())
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
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

  return (
    <div className="fixed inset-0 overflow-hidden bg-black">
      <SeoHead title={t('meta.homeTitle')} description={t('meta.homeDescription')} />
      <IntroCanvas orbTuning={orbTuning} />
      {/* Wordmark nudged right of centre — the particle shape sits left (see
          CAMERA_SHIFT_X in IntroCanvas). `translate-x-[16vw]` is the nudge:
          raise it to push further right, lower to bring it back toward centre.
          `-translate-y-[6vh]` raises it above vertical centre — more negative
          pushes it further up, 0 to re-center. */}
      <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center p-8">
        <IntroWordmark
          className="h-auto w-[min(80vw,60rem)] translate-x-[16vw] -translate-y-[6vh]"
          tuning={tuning}
          controllerRef={controllerRef}
        />
      </div>
      <IntroLiveBadge />
      <YoutubeFrameGuide />
      {IntroTuningPanel && (
        <Suspense fallback={null}>
          <IntroTuningPanel onChange={setTuning} onOrbChange={setOrbTuning} controllerRef={controllerRef} />
        </Suspense>
      )}
    </div>
  )
}
