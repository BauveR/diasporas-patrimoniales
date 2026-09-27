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
  // A landscape phone (e.g. a rotated iPhone, ~844x390) reports the same
  // `md` bucket by width as a portrait tablet (~768x1024, iPad) — but the
  // viewport is short and wide instead of tall and narrow, and needs very
  // different framing than orb.md (confirmed live: the tablet-tuned values
  // rode the orb up too high on an actual landscape phone). Used instead of
  // orb.md whenever the bucket is `md` and the viewport is landscape — see
  // useIsLandscape in PointsToShapes.tsx.
  orbMdLandscape: HeroOrbTuning
}

// Final values landed on via the live HeroTuningPanel sliders, after several
// blind "grow it a bit, move it left" rounds of guessing them by hand.
// railMaxWidthRem started at Tailwind's `max-w-7xl` (80rem, the same content
// rail Footer.tsx uses) and was widened from there once it turned out to be
// the actual limit on how far right the text column could go.
//
// Retuning process for each bucket — all 6 are tuned as of the 2026-09-27
// pass noted below; repeat this if the camera math or a bucket's on-screen
// content changes enough to need another pass:
//   1. Chrome DevTools -> device toolbar (Cmd+Shift+M) -> "Responsive" ->
//      type an exact width inside that bucket's range (see BREAKPOINTS in
//      ../hooks/useBreakpoint) and any height.
//   2. Expand the "Hero tuning" panel (top-right, dev only) -> the matching
//      "Orb — <bucket>" folder.
//   3. Drag shiftX/shiftY/scale until it looks right, then report the 3
//      numbers back to update the matching entry here.
// Only the bucket matching the current viewport width is visible/live at
// once (see useBreakpoint), so tune one at a time.
export const HERO_TUNING_DEFAULTS: HeroTuning = {
  heroOverlayShiftPx: 42,
  railMaxWidthRem: 116,
  // Re-tuned live via HeroTuningPanel (2026-09-27) after the CameraRig
  // zoom-smoothing + settled-viewport-height fixes — the numbers below are
  // what looked right under that corrected math, not a straight carryover
  // of the pre-fix values.
  orb: {
    base: { shiftX: 0, shiftY: -35, scale: 0.70 },
    sm: { shiftX: 0, shiftY: -45, scale: 0.65 },
    md: { shiftX: 0, shiftY: -37, scale: 0.65 },
    lg: { shiftX: 83, shiftY: -12, scale: 0.65 },
    xl: { shiftX: 84, shiftY: 1, scale: 0.76 },
    '2xl': { shiftX: 78, shiftY: 3, scale: 0.87 },
  },
  // Confirmed live on an actual landscape phone (844x390) — see the
  // HeroTuning.orbMdLandscape comment above for why this exists separately
  // from orb.md.
  orbMdLandscape: { shiftX: 0, shiftY: 15, scale: 0.90 },
}
