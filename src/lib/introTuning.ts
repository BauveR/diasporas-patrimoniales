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
