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
  // Un móvil chico girado (iPhone SE ~667×325, Android ~740×310) cae en
  // `sm` igual que un iPad mini vertical (744×1000)
  // y necesita un encuadre muy distinto (medido en vivo 2026-10-05). Se usa
  // en vez de la escala por alto de sm cuando sm está en horizontal.
  orbSmLandscape: HeroOrbTuning
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
  // Solo dev: con `enabled`, todo lo que está por debajo de `lg` (base, sm y
  // md, vertical u horizontal) usa estos valores en vez de su tabla por alto
  // o su valor fijo — para calibrar una medida concreta desde
  // HeroTuningPanel y agregarla como punto a la tabla que corresponda.
  orbBaseOverride: HeroOrbTuning & { enabled: boolean }
  // Solo dev: con true, lg y xl usan sus carpetas "Orb"/"Desktop" del panel
  // (lg vertical: "Orb — lg portrait" + "Desktop — lg") y 2xl usa el shiftX
  // de "Orb — 2xl", en vez de las tablas por medida (HERO_LG_BY_WIDTH,
  // HERO_LG_PORTRAIT_OFFSETS, HERO_XL_BY_HEIGHT, HERO_ORB_2XL_SHIFTX_BY_WIDTH).
  desktopManual: boolean
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
  // Recalibrado en vivo el 2026-10-05 con el panel ("Orb — base (alto
  // actual)") en la vista de dispositivo de Chrome, a las medidas indicadas.
  // iPhone SE — 375×503.
  { height: 503, shiftX: 0, shiftY: -20, scale: 0.55 },
  // Móviles pequeños — 375×560.
  { height: 560, shiftX: 0, shiftY: -25, scale: 0.55 },
  // Móviles medianos — 390×620.
  { height: 620, shiftX: 0, shiftY: -35, scale: 0.65 },
  // iPhone 16 — 393×688.
  { height: 688, shiftX: 0, shiftY: -40, scale: 0.60 },
  // Pixel 9/10 — 412×760 (confirmado: se ve bien con el valor previo).
  { height: 760, shiftX: 0, shiftY: -65, scale: 0.50 },
  // iPhone 17 Pro Max — dispositivo real, medido por Safari Web Inspector
  // (440×792; confirmado de nuevo que se ve bien).
  { height: 792, shiftX: 0, shiftY: -55, scale: 0.55 },
  // Móviles grandes — 430×850.
  { height: 850, shiftX: 0, shiftY: -65, scale: 0.50 },
  // Móviles muy altos — 464×920 (antes el wordmark se montaba sobre el orb:
  // por encima de 792 se quedaba fijo en el último punto).
  { height: 920, shiftX: 0, shiftY: -65, scale: 0.50 },
  // Más alto que lo anterior — 480×960.
  { height: 960, shiftX: 0, shiftY: -72, scale: 0.48 },
]

// `sm` vertical (640–767px de ancho: iPad mini, plegables abiertos), misma
// interpolación por alto que base. Calibrado en vivo 2026-10-05 en la vista
// de dispositivo de Chrome a las medidas indicadas.
export const HERO_ORB_SM_BY_HEIGHT: HeroOrbHeightPoint[] = [
  // Límite inferior de sm — 640×860.
  { height: 860, shiftX: 0, shiftY: -38, scale: 0.65 },
  // Plegables abiertos / tablets chicas — 700×900.
  { height: 900, shiftX: 0, shiftY: -40, scale: 0.65 },
  // iPad mini vertical — 744×1000 (confirmado con el valor previo de sm).
  { height: 1000, shiftX: 0, shiftY: -45, scale: 0.65 },
]

// `md` vertical (768–1023px de ancho: iPads, tablets Android). Calibrado en
// vivo 2026-10-05: 955 y 1050 se ven bien con el valor fijo que tenía md
// (-37/0.65); 1150 pide subirlo y achicarlo.
export const HERO_ORB_MD_BY_HEIGHT: HeroOrbHeightPoint[] = [
  // iPad 9 y anteriores — 768×955.
  { height: 955, shiftX: 0, shiftY: -37, scale: 0.65 },
  // iPad 10 / iPad Air — 820×1050.
  { height: 1050, shiftX: 0, shiftY: -37, scale: 0.65 },
  // Tablets Android — 800×1150.
  { height: 1150, shiftX: 0, shiftY: -48, scale: 0.60 },
]

// `md` horizontal: un móvil girado (iPhone/Pixel, ~850–930×340–370) cae en
// `md` igual que un iPad vertical y necesita un encuadre muy distinto.
// Calibrado en vivo 2026-10-05 (reemplaza el valor fijo 15/0.90 de antes,
// medido a 844×390 en un iPhone real).
export const HERO_ORB_MD_LANDSCAPE_BY_HEIGHT: HeroOrbHeightPoint[] = [
  // iPhone 15/16 girado — 852×340.
  { height: 340, shiftX: 0, shiftY: 23, scale: 0.95 },
  // Pixel girado — 915×360.
  { height: 360, shiftX: 0, shiftY: 20, scale: 0.95 },
  // iPhone Pro Max girado — 932×370.
  { height: 370, shiftX: 0, shiftY: 20, scale: 0.95 },
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
// lg/xl/2xl (+ orbLgPortrait), one fixed value each:
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
// --- Escritorio: tablas por medida ---------------------------------------
// Igual que en móvil, un único valor por bucket no alcanzó: xl y el shiftX
// de 2xl se interpolan por medida. Calibrado en vivo 2026-10-05 en la vista
// de dispositivo de Chrome (altos con la barra de Chrome ya restada).

// Un punto de xl: alto del viewport + orb + desplazamientos de cada bloque.
export interface HeroDesktopHeightPoint extends HeroOrbTuning, HeroDesktopOffsets {
  height: number
}

// xl (1280–1535px de ancho), interpolado por alto. Donde no se indicó un
// valor quedó en 0 (textos/botones) o, para el orb de 1470×830 ("ok") y
// 1512×860 (sin indicar), el último ajustado (1440×790).
export const HERO_XL_BY_HEIGHT: HeroDesktopHeightPoint[] = [
  // Portátil Windows 1366×768 — 1366×650.
  { height: 650, shiftX: 92, shiftY: 0, scale: 0.85, ...NO_OFFSETS, wordmarkY: -50, titularY: -100, logosY: -100 },
  // Portátil 1280×800 / MacBook antiguo — 1280×720.
  { height: 720, shiftX: 87, shiftY: 5, scale: 0.80, ...NO_OFFSETS, wordmarkY: -50, titularY: -100, logosY: -110 },
  // MacBook Air 13" — 1440×790.
  { height: 790, shiftX: 90, shiftY: 8, scale: 0.74, ...NO_OFFSETS, wordmarkY: -40, titularY: -85, logosY: -95 },
  // MacBook Air 15" — 1470×830.
  { height: 830, shiftX: 90, shiftY: 8, scale: 0.74, ...NO_OFFSETS, wordmarkY: -50, titularY: -100, logosY: -100, textosY: -20 },
  // MacBook Pro 14" — 1512×860.
  { height: 860, shiftX: 90, shiftY: 8, scale: 0.74, ...NO_OFFSETS, wordmarkY: -40, titularY: -85, logosY: -95, textosY: -20 },
]

// Un punto de lg: ancho del viewport + orb + desplazamientos de cada bloque.
export interface HeroDesktopWidthPoint extends HeroOrbTuning, HeroDesktopOffsets {
  width: number
}

// lg horizontal (1024–1279px: tablets en horizontal, portátiles chicos),
// interpolado por ANCHO, no por alto: 1024×650 y 1024×690 quedaron iguales y
// 1270×700 muy distinto con solo 10px más de alto. Botones y textos en 0
// (no se indicaron). 1024 y 1180 reajustados con los sliders (2026-10-05).
export const HERO_LG_BY_WIDTH: HeroDesktopWidthPoint[] = [
  // iPad 9 en horizontal / portátil 1024×768 — 1024×690 y 1024×650.
  { width: 1024, shiftX: 90, shiftY: 2, scale: 0.65, ...NO_OFFSETS, wordmarkY: -30, titularY: -80, logosY: -80 },
  // iPad Air / iPad 10 en horizontal — 1180×750.
  { width: 1180, shiftX: 89, shiftY: 0, scale: 0.65, ...NO_OFFSETS, wordmarkY: -30, titularY: -70, logosY: -70 },
  // iPad Pro 11" en horizontal — 1194×760.
  { width: 1194, shiftX: 85, shiftY: 0, scale: 0.70, ...NO_OFFSETS, wordmarkY: -30, titularY: -80, logosY: -90 },
  // Justo antes de xl — 1270×700.
  { width: 1270, shiftX: 85, shiftY: 0, scale: 0.80, ...NO_OFFSETS, wordmarkY: -50, titularY: -90, logosY: -90 },
]

// lg vertical (iPad Pro 12,9" — 1024×1250): desplazamientos propios de los
// bloques (el orb usa orbLgPortrait).
// Reajustado con los sliders (2026-10-05); textos/botones en 0, como
// estaban en los sliders al aprobarlo.
export const HERO_LG_PORTRAIT_OFFSETS: HeroDesktopOffsets = {
  ...NO_OFFSETS,
  wordmarkY: -30,
  titularY: -70,
  logosY: -45,
}

// shiftX del orb en 2xl, interpolado por ancho (el rail del texto tiene
// ancho máximo y el canvas no, así que el encuadre cambia con el ancho).
export const HERO_ORB_2XL_SHIFTX_BY_WIDTH: { width: number; shiftX: number }[] = [
  // Límite inferior de 2xl — 1536×730.
  { width: 1536, shiftX: 90 },
  // 1920×1080.
  { width: 1920, shiftX: 75 },
  // MacBook Pro 16" en "Más espacio" — 2056×1198.
  { width: 2056, shiftX: 83 },
]

// Interpolación lineal por tramos de todos los campos numéricos de `points`
// según `key` (alto o ancho), fija fuera del rango — misma idea que
// interpolateOrbByHeight, para puntos con más campos.
export function interpolatePoints<K extends string, T extends Record<K, number>>(points: T[], key: K, value: number): T {
  const first = points[0]
  const last = points[points.length - 1]
  if (value <= first[key]) return first
  if (value >= last[key]) return last
  for (let i = 1; i < points.length; i++) {
    const p2 = points[i]
    if (value <= p2[key]) {
      const p1 = points[i - 1]
      const t = (value - p1[key]) / (p2[key] - p1[key])
      const out = { ...p1 }
      for (const field of Object.keys(p1) as (keyof T)[]) {
        const a = p1[field], b = p2[field]
        if (typeof a === 'number' && typeof b === 'number') out[field] = lerp(a, b, t) as T[keyof T]
      }
      return out
    }
  }
  return last
}

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
  // 667×325 y 740×310, mismo valor en los dos (2026-10-05).
  orbSmLandscape: { shiftX: 0, shiftY: 20, scale: 0.75 },
  // Confirmado en vivo contra un iPad grande en portrait real (1024x1305).
  // 1024×1250 (2026-10-05): shiftY de -18 a 0.
  orbLgPortrait: { shiftX: 83, shiftY: 0, scale: 0.45 },
  desktop: {
    lg: { ...NO_OFFSETS },
    xl: { ...NO_OFFSETS },
    // Ajustado en vivo a 1920×1080 (2026-10-05).
    '2xl': { ...NO_OFFSETS, wordmarkY: -60, titularY: -100, logosY: -100, textosY: -85, botonesY: -80 },
  },
  orbBaseOverride: { enabled: false, shiftX: 0, shiftY: -55, scale: 0.55 },
  desktopManual: false,
}
