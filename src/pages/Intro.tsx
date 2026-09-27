import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { IntroCanvas } from '../components/intro/IntroCanvas'
import { IntroWordmark, type IntroWordmarkController } from '../components/intro/IntroWordmark'
import { SeoHead } from '../components/SeoHead'
import { INTRO_TUNING_DEFAULTS } from '../lib/introTuning'

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
  // The particle swarm's own form/float/un-form cycle length, read off the
  // wordmark's actual built GSAP timeline so the two stay in sync — starts
  // at Infinity (IntroParticleSwarm's "just form once, like before" default)
  // until the very first render has given IntroWordmark a chance to build.
  // IntroWordmark's useGSAP runs as a layout effect, so by the time this
  // (a plain effect) runs, controllerRef.current is already the latest one —
  // including right after `tuning` changes rebuild it with a new duration.
  const [cycleDuration, setCycleDuration] = useState<number>(Infinity)
  useEffect(() => {
    const duration = controllerRef.current?.getDuration()
    if (duration) setCycleDuration(duration)
  }, [tuning])

  return (
    <div className="fixed inset-0 overflow-hidden bg-black">
      <SeoHead title={t('meta.homeTitle')} description={t('meta.homeDescription')} />
      <IntroCanvas cycleDuration={cycleDuration} />
      {/* Wordmark nudged right of centre — the particle shape sits left (see
          CAMERA_SHIFT_X in IntroCanvas). `translate-x-[16vw]` is the nudge:
          raise it to push further right, lower to bring it back toward centre. */}
      <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center p-8">
        <IntroWordmark
          className="h-auto w-[min(80vw,60rem)] translate-x-[16vw]"
          tuning={tuning}
          controllerRef={controllerRef}
        />
      </div>
      {IntroTuningPanel && (
        <Suspense fallback={null}>
          <IntroTuningPanel onChange={setTuning} controllerRef={controllerRef} />
        </Suspense>
      )}
    </div>
  )
}
