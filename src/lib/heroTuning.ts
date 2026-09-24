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
//
// Retuning process for each bucket (used for `base`, still pending for
// sm/md/lg/xl/2xl — their values below are untouched pre-fix placeholders,
// not real tuned positions):
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
  orb: {
    // base/sm/md: tuned live via HeroTuningPanel, under the corrected
    // (non-recentering) camera math above.
    base: { shiftX: 1, shiftY: -35, scale: 0.7 },
    sm: { shiftX: 0, shiftY: -37, scale: 0.65 },
    md: { shiftX: 0, shiftY: -45, scale: 0.6 },
    // lg/xl/2xl: tuned live via HeroTuningPanel.
    lg: { shiftX: 75, shiftY: -12, scale: 0.7 },
    xl: { shiftX: 80, shiftY: 3, scale: 0.8 },
    '2xl': { shiftX: 75, shiftY: 6, scale: 0.9 },
  },
}
