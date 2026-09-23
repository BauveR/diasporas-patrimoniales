import { useEffect } from 'react'
import { Leva, useControls } from 'leva'
import { HERO_TUNING_DEFAULTS, type HeroTuning } from '../lib/heroTuning'

// Only ever mounted via a dynamic `import()` gated on `import.meta.env.DEV`
// (see PointsToShapes.tsx) — never a static import — so this file and the
// `leva` package it pulls in live in their own chunk and are never fetched
// in production. Reports live slider values up to the parent instead of
// owning them, since the parent (not this dev-only panel) is what needs
// them for every render, including production ones where this never mounts.
export default function HeroTuningPanel({ onChange }: { onChange: (tuning: HeroTuning) => void }) {
  const values = useControls('Hero — orbit shape', {
    shapeGrowth: { value: HERO_TUNING_DEFAULTS.shapeGrowth, min: 0.1, max: 3, step: 0.05 },
    largeScreenShiftWorldX: {
      value: HERO_TUNING_DEFAULTS.largeScreenShiftWorldX,
      min: 0,
      max: 150,
      step: 1,
    },
    heroOverlayShiftPx: {
      value: HERO_TUNING_DEFAULTS.heroOverlayShiftPx,
      min: 0,
      max: 350,
      step: 1,
    },
    railMaxWidthRem: {
      value: HERO_TUNING_DEFAULTS.railMaxWidthRem,
      min: 60,
      max: 160,
      step: 1,
    },
    smallScreenShiftWorldX: {
      value: HERO_TUNING_DEFAULTS.smallScreenShiftWorldX,
      min: -80,
      max: 80,
      step: 1,
    },
    smallScreenShiftWorldY: {
      value: HERO_TUNING_DEFAULTS.smallScreenShiftWorldY,
      min: -80,
      max: 80,
      step: 1,
    },
  })

  useEffect(() => {
    onChange(values)
  }, [values, onChange])

  return <Leva collapsed titleBar={{ title: 'Hero tuning' }} />
}
