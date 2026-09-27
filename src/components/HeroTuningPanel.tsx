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
    // Wide enough to reach past a fully-grown mobile section's height, not
    // just one screen's worth: CameraRig now anchors the frustum's top to a
    // fixed viewport-height reference instead of the (possibly much taller,
    // content-dependent) canvas's own midpoint, so shiftY may need to travel
    // considerably further than "one screen" to bring the swarm back into
    // view on a tall stacked-content layout.
    shiftX: { value: defaults.shiftX, min: -300, max: 300, step: 1 },
    shiftY: { value: defaults.shiftY, min: -300, max: 300, step: 1 },
    scale: { value: defaults.scale, min: 0.1, max: 5, step: 0.05 },
  })
}

// Only ever mounted via a dynamic `import()` gated on `import.meta.env.DEV`
// (see PointsToShapes.tsx) — never a static import — so this file and the
// `leva` package it pulls in live in their own chunk and are never fetched
// in production. Reports live slider values up to the parent instead of
// owning them, since the parent (not this dev-only panel) is what needs
// them for every render, including production ones where this never mounts.
export default function HeroTuningPanel({
  onChange,
  bucket,
  isMdLandscapePhone,
}: {
  onChange: (tuning: HeroTuning) => void
  bucket: BreakpointBucket
  isMdLandscapePhone: boolean
}) {
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
  // Only takes effect at the `md` bucket while the viewport is landscape
  // (a rotated phone, not a portrait tablet) — see the orbMdLandscape
  // comment in heroTuning.ts.
  const mdLandscape = useOrbBucketControls('Orb — md landscape (phone)', HERO_TUNING_DEFAULTS.orbMdLandscape)

  const orb = useMemo<Record<BreakpointBucket, HeroOrbTuning>>(
    () => ({ base, sm, md, lg, xl, '2xl': xxl }),
    [base, sm, md, lg, xl, xxl],
  )
  const tuning = useMemo<HeroTuning>(() => ({ ...layout, orb, orbMdLandscape: mdLandscape }), [layout, orb, mdLandscape])

  useEffect(() => {
    onChange(tuning)
  }, [tuning, onChange])

  return (
    <>
      {/* Every "Orb — <bucket>" folder above is always visible at once,
          regardless of the real viewport — only the one matching the
          CURRENT bucket actually affects anything on screen (see
          PointsToShapes/useBreakpoint). Without this readout it's easy to
          drag a folder's sliders while the browser is still narrower/wider
          than that bucket's range and see no effect, and wrongly read that
          as the controls being broken (happened tuning `sm`). */}
      <div className="pointer-events-none fixed right-4 bottom-4 z-[10000] rounded-md bg-black/80 px-3 py-1.5 font-mono text-xs text-white">
        Bucket activo: <strong>{BUCKET_LABELS[bucket]}</strong>
        {isMdLandscapePhone && <> — <strong>md landscape (phone)</strong> activo</>}
      </div>
      <Leva collapsed titleBar={{ title: 'Hero tuning' }} />
    </>
  )
}

const BUCKET_LABELS: Record<BreakpointBucket, string> = {
  base: 'base (<640)',
  sm: 'sm (640)',
  md: 'md (768)',
  lg: 'lg (1024)',
  xl: 'xl (1280)',
  '2xl': '2xl (1536)',
}
