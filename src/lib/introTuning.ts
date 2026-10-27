// Plain values + type only, deliberately kept free of any `leva` import —
// IntroWordmark.tsx (production and development alike) reads these directly,
// while the `leva` package itself is only ever pulled in by
// IntroTuningPanel.tsx, loaded via a dynamic import gated on
// `import.meta.env.DEV` so it never reaches the production bundle. Field
// names match the constants IntroWordmark used before this became tunable
// (HOLD, DRAW, EN_STAGGER, …), just camelCased.
export interface IntroTuning {
  hold: number
  holdLong: number
  draw: number
  erase: number
  stagger: number
  handoff: number
  ptEndingErase: number
  ptEndingDraw: number
  ptEndingStagger: number
  ptToEnDraw: number
  ptToEnErase: number
  ptToEnStagger: number
  // Both lines of a swap start together now (PT→EN and EN→ES alike) — one
  // line lagging behind the other used to leave the not-yet-swapped word
  // lingering next to the new one already in place. EN→ES additionally gets
  // its own top-line/bottom-line pairs (unlike PT→EN, still shared above) so
  // the two lines' own speed can be tuned independently even though they
  // start at the same instant.
  enToEsTopDraw: number
  enToEsTopErase: number
  enToEsTopStagger: number
  enToEsBottomDraw: number
  enToEsBottomErase: number
  enToEsBottomStagger: number
  holdCoverage: number
  holdLoopS: number
  resolve: number
}

export const INTRO_TUNING_DEFAULTS: IntroTuning = {
  hold: 6,
  holdLong: 9,
  draw: 1.1,
  erase: 0.95,
  stagger: 0.08,
  handoff: 0.12,
  ptEndingErase: 1.6,
  ptEndingDraw: 1.8,
  ptEndingStagger: 0.14,
  ptToEnDraw: 1.7,
  ptToEnErase: 1.4,
  ptToEnStagger: 0.11,
  enToEsTopDraw: 1.7,
  enToEsTopErase: 1.4,
  enToEsTopStagger: 0.11,
  enToEsBottomDraw: 1.7,
  enToEsBottomErase: 1.4,
  enToEsBottomStagger: 0.11,
  holdCoverage: 0.85,
  holdLoopS: 12,
  resolve: 0.9,
}

// The orb's own form/float/un-form cycle — deliberately its own type/state,
// separate from IntroTuning above: IntroWordmark rebuilds its whole GSAP
// timeline (and restarts the language loop) whenever `tuning` changes, so
// bundling the orb's timing into that object would restart the wordmark
// every time an orb slider moved. Used to be derived from the wordmark's own
// tl.duration() (see IntroParticleSwarm's git history) — now fully
// independent, tunable on its own clock.
export interface OrbTuning {
  // Segundos antes de MONTAR el canvas del orb (no solo mostrarlo) — así el
  // reloj de la animación (swirl + form/float/unform) arranca en cero justo
  // cuando aparece, en vez de haber estado corriendo en silencio de fondo
  // mientras estaba oculto. Ver IntroCanvas.tsx.
  appearDelay: number
  formStart: number
  formDuration: number
  floatDuration: number
}

export const ORB_TUNING_DEFAULTS: OrbTuning = {
  appearDelay: 3,
  formStart: 4,
  formDuration: 3.3,
  floatDuration: 31.85,
}

export function getOrbCycle(orbTuning: OrbTuning) {
  return orbTuning.formStart + orbTuning.formDuration + orbTuning.floatDuration + orbTuning.formDuration
}

// El "loop" completo de /intro (para poder cortar una grabación sin que se
// note) dura varias vueltas del orb, no una sola — ver IntroCycleFade.tsx
// (wordmark, badge, franjas) e IntroParticleSwarm.tsx (fade del propio orb,
// que no puede usar el mismo truco CSS porque comparte canvas con el fondo).
export const INTRO_SUPER_CYCLE_MULTIPLIER = 3
// Cuántos segundos antes de que termine el superciclo empieza a
// desvanecerse el orb — ver IntroParticleSwarm.tsx.
export const INTRO_ORB_DISAPPEAR_SECONDS = 3

export function getIntroSuperCycle(orbTuning: OrbTuning) {
  return getOrbCycle(orbTuning) * INTRO_SUPER_CYCLE_MULTIPLIER
}

// The timeline's labels, in order — shared with IntroTuningPanel so its phase
// picker always matches whatever IntroWordmark actually builds. `0` is the
// implicit start (ES, held from t=0); everything else is a real GSAP label.
export const INTRO_PHASES = [
  { label: 'ES (0)', seek: 0 as number | string },
  { label: 'p1 — ES→FR starts', seek: 'p1' },
  { label: 'p1e — accent erasing', seek: 'p1e' },
  { label: 'p2 — FR→PT starts', seek: 'p2' },
  { label: 'p2e — les/is swapping', seek: 'p2e' },
  { label: 'p3 — PT→EN starts', seek: 'p3' },
  { label: 'p3e — both lines swapping', seek: 'p3e' },
  { label: 'p4 — EN→ES starts', seek: 'p4' },
  { label: 'p4e — both lines swapping', seek: 'p4e' },
] as const

// Posición y tamaño del wordmark y del orb en /intro — ajustables desde el
// panel en desarrollo; Frame 1 fijado el 2026-10-14. Antes
// eran: wordmark 80vw / 60rem / X 16 / Y −6, orb 1.1 / X −48 / Y 0.
// '16:9' = vídeo de YouTube; '9:16' = pantalla de 55" en vertical
// (1080×1920 / 2160×3840).
export type IntroGuia = '16:9' | '9:16'
export const INTRO_GUIAS: IntroGuia[] = ['16:9', '9:16']

export interface IntroLayout {
  logoAnchoVw: number // ancho del wordmark en vw…
  logoAnchoMaxRem: number // …con este tope en rem
  logoX: number // vw, + = derecha
  logoY: number // vh, + = abajo
  orbTamano: number // 1 = tamaño base, 1.1 = +10%
  orbX: number // unidades de la escena, + = derecha
  orbY: number // unidades de la escena, + = arriba
  // Guía de encuadre (puntos verdes): proporción de la
  // pantalla para la que se compone el frame.
  guia: IntroGuia
  badge: boolean // "Empezamos en unos minutos" (IntroLiveBadge)
  fondoNegro: boolean // true = sin el degradado (GrainientBackground), negro liso
  fecha: boolean // fecha en la franja de abajo (IntroTicker)
}

// Composiciones guardadas (se eligen en el panel, desplegable "frame").
export const INTRO_LAYOUT_FRAMES = {
  'Frame 1': {
    logoAnchoVw: 81,
    logoAnchoMaxRem: 38,
    logoX: 6.5,
    logoY: -9,
    orbTamano: 0.61,
    orbX: -66,
    orbY: 8,
    guia: '16:9',
    badge: true,
    fondoNegro: false,
    fecha: true,
  },
  'Frame 2': {
    logoAnchoVw: 81,
    logoAnchoMaxRem: 26,
    logoX: 0,
    logoY: 7,
    orbTamano: 0.61,
    orbX: 0,
    orbY: 22,
    guia: '9:16',
    badge: true,
    fondoNegro: false,
    fecha: true,
  },
  // Sin el badge "Empezamos en unos minutos" ni la fecha en la franja de
  // abajo, con fondo negro y su propia composición (2026-10-16).
  'Frame 3': {
    logoAnchoVw: 81,
    logoAnchoMaxRem: 30,
    logoX: 8,
    logoY: -18,
    orbTamano: 0.47,
    orbX: -55,
    orbY: 39,
    guia: '16:9',
    badge: false,
    fondoNegro: true,
    fecha: false,
  },
} satisfies Record<string, IntroLayout>

export type IntroLayoutFrame = keyof typeof INTRO_LAYOUT_FRAMES

// La que usa la web (en producción no hay panel).
export const INTRO_LAYOUT_FRAME_DEFAULT: IntroLayoutFrame = 'Frame 3'
export const INTRO_LAYOUT_DEFAULTS: IntroLayout = INTRO_LAYOUT_FRAMES[INTRO_LAYOUT_FRAME_DEFAULT]
