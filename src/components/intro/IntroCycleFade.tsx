import { useId, type ReactNode } from 'react'
import { getIntroSuperCycle, type OrbTuning } from '../../lib/introTuning'

interface IntroCycleFadeProps {
  orbTuning: OrbTuning
  // Segundos dentro del superciclo (ver getIntroSuperCycle) en los que
  // arranca el fade-in, y cuánto dura.
  appearAtSeconds: number
  appearFadeSeconds: number
  // Segundos antes de que termine el superciclo en los que arranca el
  // fade-out — llega a 0 justo cuando el superciclo se reinicia.
  disappearBeforeEndSeconds: number
  children: ReactNode
}

// Fade in/out periódico para elementos DOM (wordmark, badge, franjas) —
// repite cada superciclo completo, en vez de aparecer/desaparecer una sola
// vez. El orb NO usa esto: comparte canvas con el fondo (ver
// GrainientBackground.tsx), así que su propio fade vive como opacity de
// material en IntroParticleSwarm.tsx, no acá.
//
// `useId` le da un nombre de keyframe único a cada instancia — puede haber
// más de una al mismo tiempo (wordmark, badge+franjas), cada una con su
// propio timing, sin que una @keyframes pise a la otra.
export function IntroCycleFade({
  orbTuning,
  appearAtSeconds,
  appearFadeSeconds,
  disappearBeforeEndSeconds,
  children,
}: IntroCycleFadeProps) {
  const cycle = getIntroSuperCycle(orbTuning)
  const appearStartPct = (appearAtSeconds / cycle) * 100
  const appearEndPct = ((appearAtSeconds + appearFadeSeconds) / cycle) * 100
  const disappearStartPct = ((cycle - disappearBeforeEndSeconds) / cycle) * 100
  const animName = `intro-cycle-fade-${useId().replace(/[^a-zA-Z0-9]/g, '')}`

  return (
    <>
      <style>{`
        @keyframes ${animName} {
          0% { opacity: 0; }
          ${appearStartPct}% { opacity: 0; }
          ${appearEndPct}% { opacity: 1; }
          ${disappearStartPct}% { opacity: 1; }
          100% { opacity: 0; }
        }
        .${animName} { animation: ${animName} ${cycle}s linear infinite; }
        @media (prefers-reduced-motion: reduce) {
          .${animName} { animation: none; opacity: 1; }
        }
      `}</style>
      <div className={animName} style={{ opacity: 0 }}>{children}</div>
    </>
  )
}
