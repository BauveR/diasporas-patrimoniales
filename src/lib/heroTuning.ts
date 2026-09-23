import type { BreakpointBucket } from '../hooks/useBreakpoint'

// Plain values + type only, deliberately kept free of any `leva` import —
// PointsToShapes.tsx (production and development alike) reads these
// directly, while the `leva` package itself is only ever pulled in by
// HeroTuningPanel.tsx, loaded via a dynamic import gated on
// `import.meta.env.DEV` so it never reaches the production bundle.
export interface HeroOrbTuning {
  // World-space camera pan, same units/axes CameraRig already glides toward.
  shiftX: number
  shiftY: number
  // Multiplies the orthographic zoom baseline (1 = today's on-screen size).
  scale: number
}

export interface HeroTuning {
  heroOverlayShiftPx: number
  railMaxWidthRem: number
  // One independent {shiftX, shiftY, scale} per breakpoint bucket (see
  // useBreakpoint) instead of a single isLargeScreen on/off split — lets the
  // orb be positioned/sized separately at each of sm/md/lg/xl/2xl plus the
  // base (<640px) zone.
  orb: Record<BreakpointBucket, HeroOrbTuning>
}

// Final values landed on via the live HeroTuningPanel sliders, after several
// blind "grow it a bit, move it left" rounds of guessing them by hand.
// railMaxWidthRem started at Tailwind's `max-w-7xl` (80rem, the same content
// rail Footer.tsx uses) and was widened from there once it turned out to be
// the actual limit on how far right the text column could go.
export const HERO_TUNING_DEFAULTS: HeroTuning = {
  heroOverlayShiftPx: 42,
  railMaxWidthRem: 116,
  orb: {
    // base/sm/md reproduce the old "small screen" behavior exactly (shape
    // dead-center behind the stacked text) — these are starting points to
    // tune away, not a hardcoded center with no knob the way it used to be.
    base: { shiftX: 0, shiftY: 0, scale: 1 },
    sm: { shiftX: 0, shiftY: 0, scale: 1 },
    md: { shiftX: 0, shiftY: 0, scale: 1 },
    // lg/xl/2xl reproduce the old "large screen" behavior exactly (panned
    // left to make room for the wordmark/text column).
    lg: { shiftX: 62, shiftY: 0, scale: 1 },
    xl: { shiftX: 62, shiftY: 0, scale: 1 },
    '2xl': { shiftX: 62, shiftY: 0, scale: 1 },
  },
}
