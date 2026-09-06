// Plain values + type only, deliberately kept free of any `leva` import —
// PointsToShapes.tsx (production and development alike) reads these
// directly, while the `leva` package itself is only ever pulled in by
// HeroTuningPanel.tsx, loaded via a dynamic import gated on
// `import.meta.env.DEV` so it never reaches the production bundle.
export interface HeroTuning {
  shapeGrowth: number
  largeScreenShiftWorldX: number
  heroOverlayShiftPx: number
  railMaxWidthRem: number
}

// Final values landed on via the live HeroTuningPanel sliders, after several
// blind "grow it a bit, move it left" rounds of guessing them by hand.
// railMaxWidthRem started at Tailwind's `max-w-7xl` (80rem, the same content
// rail Footer.tsx uses) and was widened from there once it turned out to be
// the actual limit on how far right the text column could go.
export const HERO_TUNING_DEFAULTS: HeroTuning = {
  shapeGrowth: 1,
  largeScreenShiftWorldX: 62,
  heroOverlayShiftPx: 42,
  railMaxWidthRem: 116,
}
