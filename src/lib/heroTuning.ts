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
  // Same kind of split, one bucket up: a large iPad in *portrait*
  // (~1024x1305) reports the same `lg` bucket by width as a landscape
  // tablet/narrow laptop (~1024x768) — but orb.lg is tuned for the
  // landscape case (confirmed live: it looks right there) and rides too
  // high/wrong on the tall portrait one. Used instead of orb.lg whenever
  // the bucket is `lg` and the viewport is portrait (not landscape).
  orbLgPortrait: HeroOrbTuning
  // Desplazamientos X/Y por bloque del hero desktop, uno por bucket lg/xl/
  // 2xl — ver HeroDesktopOffsets.
  desktop: Record<DesktopBucket, HeroDesktopOffsets>
}

// Desplazamiento (px, vía la propiedad CSS `translate`: no mueve el layout,
// solo el elemento) de cada bloque del hero desktop, por bucket. Todo en 0 =
// posición natural del layout; se ajusta en vivo desde HeroTuningPanel y,
// una vez decidido, se copian los valores acá.
export interface HeroDesktopOffsets {
  wordmarkX: number
  wordmarkY: number
  titularX: number
  titularY: number
  logosX: number
  logosY: number
  textosX: number
  textosY: number
  botonesX: number
  botonesY: number
}

export type DesktopBucket = 'lg' | 'xl' | '2xl'

const NO_OFFSETS: HeroDesktopOffsets = {
  wordmarkX: 0, wordmarkY: 0,
  titularX: 0, titularY: 0,
  logosX: 0, logosY: 0,
  textosX: 0, textosY: 0,
  botonesX: 0, botonesY: 0,
}

// One calibration point: a settled viewport height (the browser's own
// rendered height, chrome already subtracted — same value
// useSettledViewportHeight tracks, never a device's raw screen
// resolution), and the shiftX/shiftY/scale that looked right there.
export interface HeroOrbHeightPoint extends HeroOrbTuning {
  height: number
}

// `base` spans real phones from ~500px tall (iPhone SE) to ~950px (a big
// modern Pro Max) with no natural "step" in between — unlike the other
// buckets, a single fixed shiftY/scale for the whole range either overlaps
// the wordmark on short phones or looks too small/far on tall ones (found
// live, 2026-09-27/28: the same `base` values that looked right on one
// real device overlapped the wordmark on another, both comfortably inside
// the same <640px-wide bucket). Sorted ascending by `height` —
// interpolateOrbByHeight (PointsToShapes.tsx) picks two neighboring points
// and interpolates shiftX/shiftY/scale between them instead of using one
// fixed value for the whole bucket, so any height in between (the common
// case) gets a reasonable in-between framing instead of the nearest
// tested point's.
//
// Provenance matters here: Chrome DevTools' built-in device presets report
// each device's *raw screen resolution*, not what a real mobile browser
// actually renders after its own address bar/toolbar — confirmed live by
// comparing a DevTools "iPhone 16 Pro Max" preset (956) against a real
// iPhone 17 Pro Max measured through Safari's own Web Inspector
// (window.innerHeight, chrome already subtracted): 792, a 164px gap. Every
// point below marked "DevTools, corregido" has that same -164px estimate
// applied to its raw preset height; only the iPhone 17 Pro Max point is a
// real, directly measured value. Add more points here (real devices
// preferred) as they come up, keeping the array sorted by height.
export const HERO_ORB_BASE_BY_HEIGHT: HeroOrbHeightPoint[] = [
  // iPhone SE — DevTools preset 375x667, corregido a 503.
  { height: 503, shiftX: 0, shiftY: -45, scale: 0.60 },
  // iPhone 16 — DevTools preset 393x852, corregido a 688.
  { height: 688, shiftX: 0, shiftY: -60, scale: 0.50 },
  // Pixel 9/10 — DevTools preset 412x924, corregido a 760 (misma
  // estimación de -164px que iOS; Chrome en Android puede restar algo
  // distinto, sin confirmar todavía).
  { height: 760, shiftX: 0, shiftY: -65, scale: 0.50 },
  // iPhone 17 Pro Max — dispositivo real, medido en vivo por Safari Web
  // Inspector. El único punto que no es una estimación.
  { height: 792, shiftX: 0, shiftY: -55, scale: 0.55 },
]

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

// Piecewise-linear interpolation across `points` (must already be sorted
// ascending by `height`) — clamps to the nearest calibration point outside
// the tested range instead of extrapolating past it (an untested phone
// shorter than the shortest point gets that point's values exactly, not a
// linear projection past it toward who-knows-what).
export function interpolateOrbByHeight(points: HeroOrbHeightPoint[], height: number): HeroOrbTuning {
  const first = points[0]
  const last = points[points.length - 1]
  if (height <= first.height) return first
  if (height >= last.height) return last
  for (let i = 1; i < points.length; i++) {
    const p2 = points[i]
    if (height <= p2.height) {
      const p1 = points[i - 1]
      const t = (height - p1.height) / (p2.height - p1.height)
      return {
        shiftX: lerp(p1.shiftX, p2.shiftX, t),
        shiftY: lerp(p1.shiftY, p2.shiftY, t),
        scale: lerp(p1.scale, p2.scale, t),
      }
    }
  }
  return last
}

// Final values landed on via the live HeroTuningPanel sliders, after several
// blind "grow it a bit, move it left" rounds of guessing them by hand.
// railMaxWidthRem started at Tailwind's `max-w-7xl` (80rem, the same content
// rail Footer.tsx uses) and was widened from there once it turned out to be
// the actual limit on how far right the text column could go.
//
// Retuning process — two different ones now:
//
// sm/md/lg/xl/2xl (+ orbMdLandscape/orbLgPortrait), one fixed value each:
//   1. Chrome DevTools -> device toolbar (Cmd+Shift+M) -> "Responsive" ->
//      type an exact width inside that bucket's range (see BREAKPOINTS in
//      ../hooks/useBreakpoint) and any height.
//   2. Expand the "Hero tuning" panel (top-right, dev only) -> the matching
//      "Orb — <bucket>" folder.
//   3. Drag shiftX/shiftY/scale until it looks right, then report the 3
//      numbers back to update the matching entry here.
// Only the bucket matching the current viewport width is visible/live at
// once (see useBreakpoint), so tune one at a time.
//
// base: no panel folder, no single fixed value — interpolated by height
// against HERO_ORB_BASE_BY_HEIGHT above instead (see its own comment for
// why). To retune or add a device: find its *settled* height (ideally a
// real device via Safari/Chrome's own remote inspector,
// `window.innerHeight` in the console — DevTools presets alone report the
// raw screen size, not what the browser actually renders, see the
// provenance note above), edit the shiftX/shiftY/scale of the array entry
// by hand and reload to check (no live slider for this one — add a
// temporary `useOrbBucketControls` folder back in HeroTuningPanel.tsx if
// this needs frequent hand-tuning), then keep the array sorted by height.
export const HERO_TUNING_DEFAULTS: HeroTuning = {
  heroOverlayShiftPx: 42,
  railMaxWidthRem: 116,
  // Re-tuned live via HeroTuningPanel (2026-09-27) after the CameraRig
  // zoom-smoothing + settled-viewport-height fixes — the numbers below are
  // what looked right under that corrected math, not a straight carryover
  // of the pre-fix values.
  orb: {
    // Re-tuneado a mano (2026-09-27) contra un viewport real de 440x792
    // (iPhone 17 Pro Max, Safari) — más bajo que el que se usó para el
    // primer pase (390x844), lo que subía/agrandaba de más el orb hasta
    // encimarse con el wordmark. Un viewport más bajo dentro del mismo
    // bucket `base` puede necesitar este mismo retuneo otra vez.
    base: { shiftX: 0, shiftY: -55, scale: 0.55 },
    sm: { shiftX: 0, shiftY: -45, scale: 0.65 },
    md: { shiftX: 0, shiftY: -37, scale: 0.65 },
    lg: { shiftX: 83, shiftY: -12, scale: 0.65 },
    xl: { shiftX: 84, shiftY: 1, scale: 0.76 },
    '2xl': { shiftX: 75, shiftY: 3, scale: 0.83 },
  },
  // Confirmed live on an actual landscape phone (844x390) — see the
  // HeroTuning.orbMdLandscape comment above for why this exists separately
  // from orb.md.
  orbMdLandscape: { shiftX: 0, shiftY: 15, scale: 0.90 },
  // Confirmado en vivo contra un iPad grande en portrait real (1024x1305).
  orbLgPortrait: { shiftX: 83, shiftY: -18, scale: 0.45 },
  desktop: {
    lg: { ...NO_OFFSETS },
    xl: { ...NO_OFFSETS },
    // Ajustado en vivo a 1920×1080 (2026-10-05).
    '2xl': { ...NO_OFFSETS, wordmarkY: -60, titularY: -100, logosY: -100, textosY: -85, botonesY: -80 },
  },
}
