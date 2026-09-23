import { useEffect, useMemo } from 'react'
import { Leva, useControls } from 'leva'
import { HERO_TUNING_DEFAULTS, type HeroOrbTuning, type HeroTuning } from '../lib/heroTuning'
import type { BreakpointBucket } from '../hooks/useBreakpoint'

// One leva folder per breakpoint bucket — same three sliders each time, only
// the defaults (and the folder label) change. Always called in the same
// fixed order below (never conditionally), so this stays rules-of-hooks safe
// despite being a helper wrapping useControls.
function useOrbBucketControls(label: string, defaults: HeroOrbTuning): HeroOrbTuning {
  return useControls(label, {
    shiftX: { value: defaults.shiftX, min: -80, max: 150, step: 1 },
    shiftY: { value: defaults.shiftY, min: -80, max: 80, step: 1 },
    scale: { value: defaults.scale, min: 0.1, max: 3, step: 0.05 },
  })
}

// Only ever mounted via a dynamic `import()` gated on `import.meta.env.DEV`
// (see PointsToShapes.tsx) — never a static import — so this file and the
// `leva` package it pulls in live in their own chunk and are never fetched
// in production. Reports live slider values up to the parent instead of
// owning them, since the parent (not this dev-only panel) is what needs
// them for every render, including production ones where this never mounts.
export default function HeroTuningPanel({ onChange }: { onChange: (tuning: HeroTuning) => void }) {
  const layout = useControls('Hero — layout', {
    heroOverlayShiftPx: { value: HERO_TUNING_DEFAULTS.heroOverlayShiftPx, min: 0, max: 350, step: 1 },
    railMaxWidthRem: { value: HERO_TUNING_DEFAULTS.railMaxWidthRem, min: 60, max: 160, step: 1 },
  })

  const base = useOrbBucketControls('Orb — base (<640)', HERO_TUNING_DEFAULTS.orb.base)
  const sm = useOrbBucketControls('Orb — sm (640)', HERO_TUNING_DEFAULTS.orb.sm)
  const md = useOrbBucketControls('Orb — md (768)', HERO_TUNING_DEFAULTS.orb.md)
  const lg = useOrbBucketControls('Orb — lg (1024)', HERO_TUNING_DEFAULTS.orb.lg)
  const xl = useOrbBucketControls('Orb — xl (1280)', HERO_TUNING_DEFAULTS.orb.xl)
  const xxl = useOrbBucketControls('Orb — 2xl (1536)', HERO_TUNING_DEFAULTS.orb['2xl'])

  const orb = useMemo<Record<BreakpointBucket, HeroOrbTuning>>(
    () => ({ base, sm, md, lg, xl, '2xl': xxl }),
    [base, sm, md, lg, xl, xxl],
  )
  const tuning = useMemo<HeroTuning>(() => ({ ...layout, orb }), [layout, orb])

  useEffect(() => {
    onChange(tuning)
  }, [tuning, onChange])

  return <Leva collapsed titleBar={{ title: 'Hero tuning' }} />
}
