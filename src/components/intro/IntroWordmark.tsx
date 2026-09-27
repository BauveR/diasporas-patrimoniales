import { useRef } from 'react'
import type { MutableRefObject } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import Logo from '../../assets/diasporas nimation-01.svg?react'
import { INTRO_TUNING_DEFAULTS, type IntroTuning } from '../../lib/introTuning'

// /intro's wordmark: a self-contained, looping piece that walks the four
// language states — NOT driven by i18n (the page stays Spanish). There is no
// letter fill; every glyph is only its glowing outline (the "halo"), and
// states are built and unbuilt *along that outline* — the next language draws
// itself on stroke-by-stroke, the previous one un-draws the same way. No
// fades, no pops.
//
//   ES   "Diásporas patrimoniales"                              hold ~2s
//   ES→FR   the acute accent un-draws away
//   FR   "Diasporas patrimoniales"                              hold ~2s
//   FR→PT   "les" un-draws; the accent and "is" draw back in
//   PT   "Diásporas patrimoniais"                               hold ~2s
//   PT→EN   letter by letter along the contours, top and bottom line
//           together: "DIÁSPORAS"/"patrimoniais" un-draw while
//           "HERITAGE"/"DIASPORAS" draw in below
//   EN   "HERITAGE / DIASPORAS"                                 hold ~2s
//   EN→ES   same, both lines together, back to Spanish — then the loop
//           repeats
//
// Source art groups (one shared viewBox, so nothing reflows):
//   #frances   22 paths — line 1 [0..8] "DIASPORAS", line 2 [9..21]
//              "patrimoniales" ([9..18] "patrimonia", [19..21] "les")
//   #espanol   1 — the acute accent (sits above line 1's first "a")
//   #portugues 2 — [0] "i", [1] "s" (the "-is" ending)
//   #ingles    17 — line 1 [0..7] "HERITAGE", line 2 [8..16] "DIASPORAS".
//              Drawn on its own grid in the art, so it gets a one-time
//              measured transform to sit on #frances' size/position.
const HALO_COLOR = '#fff'
const HALO_CRISP_STROKE_WIDTH = 0.6
const HALO_GLOW_STROKE_WIDTH = 1
const HALO_GLOW_BLUR_PX = 0.8

// Choreography tempo — now lives in `tuning` (see ../../lib/introTuning.ts)
// instead of module constants, so IntroTuningPanel can drive it live in dev.
// Production always gets INTRO_TUNING_DEFAULTS (the panel never mounts
// there). See the `const { hold: HOLD, … } = tuning` destructure below for
// what each field controls — it deliberately keeps the original ALL_CAPS
// names in scope so the rest of this file (draw/erase/settleTravel/the
// timeline) didn't need to change.

// A controller handed back to the caller (via `controllerRef`) once the
// timeline is built, for IntroTuningPanel's transport controls — seeking to
// a phase, play/pause, scrubbing, and slow/fast-motion via timeScale.
export interface IntroWordmarkController {
  seek: (target: string | number) => void
  play: () => void
  pause: () => void
  setTimeScale: (value: number) => void
  setProgress: (value: number) => void
  // One full ES→FR→PT→EN→ES loop's length in seconds — lets IntroParticleSwarm
  // sync its own form/float/un-form cycle to the wordmark's, instead of the
  // two running on unrelated clocks.
  getDuration: () => number
}

// A glyph's two outline layers: a wide soft "glow" and a thin crisp line on
// top, both drawn/erased in lockstep via strokeDashoffset. `dasharray` is one
// full-length dash + one full-length gap, so dashoffset 0 = whole outline
// lit, dashoffset = length = nothing. Each layer carries its own length in
// `data-len` for the erase tween.
function buildHalo(templatePath: SVGPathElement): [SVGPathElement, SVGPathElement] {
  const length = templatePath.getTotalLength()

  const makeLayer = (strokeWidth: number, blurPx: number) => {
    const layer = templatePath.cloneNode(false) as SVGPathElement
    layer.removeAttribute('class')
    layer.dataset.halo = '' // marks a halo clone, kept out of the glyph queries
    layer.dataset.len = String(length)
    layer.style.fill = 'none'
    layer.style.stroke = HALO_COLOR
    layer.style.strokeWidth = String(strokeWidth)
    layer.style.strokeDasharray = `${length} ${length}`
    layer.style.strokeDashoffset = String(length) // start un-drawn
    layer.style.transform = 'none'
    layer.style.filter = blurPx ? `blur(${blurPx}px)` : 'none'
    return layer
  }

  const glow = makeLayer(HALO_GLOW_STROKE_WIDTH, HALO_GLOW_BLUR_PX)
  const crisp = makeLayer(HALO_CRISP_STROKE_WIDTH, 0)
  templatePath.after(glow)
  glow.after(crisp)
  return [glow, crisp]
}

// Union bounding box of several paths, in the SVG's user space.
function unionBBox(paths: SVGPathElement[]) {
  let x1 = Infinity
  let y1 = Infinity
  let x2 = -Infinity
  let y2 = -Infinity
  for (const p of paths) {
    const b = p.getBBox()
    x1 = Math.min(x1, b.x)
    y1 = Math.min(y1, b.y)
    x2 = Math.max(x2, b.x + b.width)
    y2 = Math.max(y2, b.y + b.height)
  }
  return { h: y2 - y1, cx: (x1 + x2) / 2, cy: (y1 + y2) / 2 }
}

export function IntroWordmark({
  className,
  tuning = INTRO_TUNING_DEFAULTS,
  controllerRef,
}: {
  className?: string
  tuning?: IntroTuning
  controllerRef?: MutableRefObject<IntroWordmarkController | null>
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  // Every glyph's [glow, crisp] layer pair, kept for teardown on unmount.
  const layersRef = useRef<SVGPathElement[]>([])

  useGSAP(
    () => {
      const root = rootRef.current
      if (!root) return

      const {
        hold: HOLD,
        holdLong: HOLD_LONG,
        draw: DRAW,
        erase: ERASE,
        stagger: STAGGER,
        handoff: HANDOFF,
        ptEndingErase: PT_ENDING_ERASE,
        ptEndingDraw: PT_ENDING_DRAW,
        ptEndingStagger: PT_ENDING_STAGGER,
        ptToEnDraw: PT_TO_EN_DRAW,
        ptToEnErase: PT_TO_EN_ERASE,
        ptToEnStagger: PT_TO_EN_STAGGER,
        enToEsTopDraw: EN_TO_ES_TOP_DRAW,
        enToEsTopErase: EN_TO_ES_TOP_ERASE,
        enToEsTopStagger: EN_TO_ES_TOP_STAGGER,
        enToEsBottomDraw: EN_TO_ES_BOTTOM_DRAW,
        enToEsBottomErase: EN_TO_ES_BOTTOM_ERASE,
        enToEsBottomStagger: EN_TO_ES_BOTTOM_STAGGER,
        holdCoverage: HOLD_COVERAGE,
        holdLoopS: HOLD_LOOP_S,
        resolve: RESOLVE,
      } = tuning

      // Clear stale halo clones (HMR / StrictMode re-run).
      root.querySelectorAll('[data-halo]').forEach((n) => n.remove())
      layersRef.current = []

      const pathsOf = (id: string) =>
        Array.from(root.querySelectorAll<SVGPathElement>(`#${id} path:not([data-halo])`))

      const frances = pathsOf('frances')
      const accent = pathsOf('espanol')
      const port = pathsOf('portugues')
      const ingles = pathsOf('ingles')

      if (
        frances.length !== 22 ||
        ingles.length !== 17 ||
        port.length !== 2 ||
        accent.length !== 1
      ) {
        return // art changed shape — bail rather than misfire
      }

      // One-time transform so #ingles' two-line lockup sits at #frances' size
      // and position (the art draws it on a different grid): match total
      // height, centre on centre.
      const fBox = unionBBox(frances)
      const iBox = unionBBox(ingles)
      const scale = iBox.h > 0 ? fBox.h / iBox.h : 1
      root
        .querySelector<SVGGElement>('#ingles')!
        .setAttribute(
          'transform',
          `translate(${fBox.cx} ${fBox.cy}) scale(${scale}) translate(${-iBox.cx} ${-iBox.cy})`,
        )

      // Halo only: hide every glyph's own fill so nothing shows but the
      // outline layers built below.
      gsap.set([...frances, ...accent, ...port, ...ingles], { fillOpacity: 0 })

      // Build outline layers for every glyph up front (all start un-drawn).
      const layersByPath = new Map<SVGPathElement, [SVGPathElement, SVGPathElement]>()
      for (const p of [...frances, ...accent, ...port, ...ingles]) {
        const pair = buildHalo(p)
        layersByPath.set(p, pair)
        layersRef.current.push(...pair)
      }
      // Flatten a set of glyphs to their outline layers, interleaved
      // [glow0, crisp0, glow1, crisp1, …] so a per-glyph stagger keeps each
      // glyph's two layers in lockstep.
      const L = (paths: SVGPathElement[]) => paths.flatMap((p) => layersByPath.get(p)!)
      const byGlyph = (stag: number) => (i: number) => Math.floor(i / 2) * stag
      const toLen = (_i: number, el: Element) => Number((el as SVGPathElement).dataset.len)

      const fLine1 = frances.slice(0, 9) // "DIASPORAS"
      const fStem = frances.slice(9, 19) // "patrimonia"
      const fLes = frances.slice(19) // "les"
      const iLine1 = ingles.slice(0, 8) // "HERITAGE"
      const iLine2 = ingles.slice(8) // "DIASPORAS" (English)

      // draw/erase helpers — add to a timeline at `pos`, staggered per glyph.
      // `dur`/`stag` default to the short-transition tempo; the EN line swaps
      // pass their slower values.
      const draw = (
        tl: gsap.core.Timeline,
        paths: SVGPathElement[],
        pos?: gsap.Position,
        dur = DRAW,
        stag = STAGGER,
      ) =>
        tl.to(
          L(paths),
          { strokeDashoffset: 0, duration: dur, stagger: byGlyph(stag), ease: 'power2.out' },
          pos,
        )
      const erase = (
        tl: gsap.core.Timeline,
        paths: SVGPathElement[],
        pos?: gsap.Position,
        dur = ERASE,
        stag = STAGGER,
      ) =>
        tl.to(
          L(paths),
          { strokeDashoffset: toLen, duration: dur, stagger: byGlyph(stag), ease: 'power2.in' },
          pos,
        )

      // dasharray "L 0"  = solid, offset irrelevant   (complete outline)
      // dasharray "0.85L 0.15L" + flowing offset       (traveling arc)
      const seg = (_i: number, el: Element) => {
        const len = Number((el as SVGPathElement).dataset.len)
        return `${len * HOLD_COVERAGE} ${len * (1 - HOLD_COVERAGE)}`
      }
      const solid = (_i: number, el: Element) => `${Number((el as SVGPathElement).dataset.len)} 0`
      const full = (_i: number, el: Element) => {
        const len = Number((el as SVGPathElement).dataset.len)
        return `${len} ${len}`
      }

      // Named, independent traveling loops. The "shared" group (everything in
      // "Diasporas patrimonia") is started once and NEVER stopped across
      // ES/FR/PT — only the accent and the ending swap. It's only resolved
      // for the whole-layout PT↔EN changes.
      const shared = frances.slice(0, 19) // "Diasporas patrimonia"
      const travelSets: Record<string, SVGPathElement[]> = {
        shared,
        accent,
        les: fLes,
        port,
        en: ingles,
      }
      const travelLayers = Object.fromEntries(
        Object.entries(travelSets).map(([k, v]) => [k, L(v)]),
      ) as Record<string, SVGPathElement[]>
      const travels = new Map<string, gsap.core.Tween[]>()

      const startTravel = (key: string) => {
        travels.get(key)?.forEach((t) => t.kill())
        const layers = travelLayers[key]
        travels.set(key, [
          // Linear, not eased: the offset alongside it already moves at a
          // constant rate (ease:'none' below), so a gap that opens at a
          // constant rate too reads as one steady motion. An eased open
          // (slow→fast→slow) made the arc look like it was "catching up" as
          // the gap widened — the same illusion an eased close created right
          // before an erase (see settleTravel).
          gsap.to(layers, { strokeDasharray: seg, duration: RESOLVE, ease: 'none' }),
          gsap.fromTo(
            layers,
            { strokeDashoffset: 0 },
            {
              strokeDashoffset: (_i: number, el: Element) =>
                -Number((el as SVGPathElement).dataset.len),
              duration: HOLD_LOOP_S,
              ease: 'none',
              repeat: -1,
            },
          ),
        ])
      }
      // Resolve a traveling group back to a solid, offset-0 outline *inside*
      // `tl` (gap closes while the offset still flows — no cut), then kill its
      // flow. After this the set is ready for erase()/draw(). Linear ease,
      // same reasoning as startTravel's gap-open: an eased close decelerates
      // to a dead stop right as erase() (which itself starts slow, easing
      // "in") takes over — that double-slow handoff is what read as the
      // outline "finishing, then speeding up" instead of one steady motion.
      const settleTravel = (tl: gsap.core.Timeline, key: string, pos?: gsap.Position) => {
        const layers = travelLayers[key]
        tl.to(layers, { strokeDasharray: solid, duration: RESOLVE, ease: 'none' }, pos)
        tl.call(() => {
          travels.get(key)?.forEach((t) => t.kill())
          travels.delete(key)
        })
        tl.set(layers, { strokeDasharray: full, strokeDashoffset: 0 })
      }
      const killTravels = () => {
        travels.forEach((ts) => ts.forEach((t) => t.kill()))
        travels.clear()
      }

      // First load: Spanish on-screen and already traveling. On later loops
      // P4's tail restarts these instead.
      gsap.set(L([...frances, ...accent]), { strokeDashoffset: 0 })
      startTravel('shared')
      startTravel('accent')
      startTravel('les')

      const tl = gsap.timeline({ repeat: -1, repeatRefresh: true })

      tl.to({}, { duration: HOLD }) // P0 — hold ES (shared + accent + les traveling)

      // P1 — ES → FR: ONLY the accent changes. "shared" and "les" never stop.
      tl.addLabel('p1')
      tl.addLabel('p1e', `p1+=${RESOLVE}`)
      settleTravel(tl, 'accent', 'p1')
      erase(tl, accent, 'p1e')
      tl.to({}, { duration: HOLD }) // hold FR

      // P2 — FR → PT: "les" leaves, accent + "is" arrive. "shared" never stops.
      tl.addLabel('p2')
      tl.addLabel('p2e', `p2+=${RESOLVE}`)
      settleTravel(tl, 'les', 'p2')
      erase(tl, fLes, 'p2e', PT_ENDING_ERASE, PT_ENDING_STAGGER)
      draw(tl, accent, `p2e+=${HANDOFF}`)
      draw(tl, port, `p2e+=${HANDOFF}`, PT_ENDING_DRAW, PT_ENDING_STAGGER)
      tl.call(() => {
        startTravel('accent')
        startTravel('port')
      })
      tl.to({}, { duration: HOLD_LONG }) // hold PT

      // P3 — PT → EN: whole layout changes. Resolve every traveling group
      // (no cut), then both lines erase and draw together — same reasoning
      // as P4's EN→ES: erasing them one after the other left the not-yet-
      // erased line's old word lingering next to the new one already drawn
      // on the other line.
      tl.addLabel('p3')
      tl.addLabel('p3e', `p3+=${RESOLVE}`)
      settleTravel(tl, 'shared', 'p3')
      settleTravel(tl, 'accent', 'p3')
      settleTravel(tl, 'port', 'p3')
      erase(tl, [...fLine1, ...accent], 'p3e', PT_TO_EN_ERASE, PT_TO_EN_STAGGER)
      erase(tl, [...fStem, ...port], 'p3e', PT_TO_EN_ERASE, PT_TO_EN_STAGGER)
      draw(tl, iLine1, `p3e+=${HANDOFF}`, PT_TO_EN_DRAW, PT_TO_EN_STAGGER)
      draw(tl, iLine2, `p3e+=${HANDOFF}`, PT_TO_EN_DRAW, PT_TO_EN_STAGGER)
      tl.call(() => startTravel('en'))
      tl.to({}, { duration: HOLD_LONG }) // hold EN

      // P4 — EN → ES, both lines at once, then the loop repeats — same
      // reasoning as P3: erasing top and bottom together is what keeps the
      // old word from lingering on one line while the other already reads
      // the new one.
      tl.addLabel('p4')
      tl.addLabel('p4e', `p4+=${RESOLVE}`)
      settleTravel(tl, 'en', 'p4')
      erase(tl, iLine1, 'p4e', EN_TO_ES_TOP_ERASE, EN_TO_ES_TOP_STAGGER)
      erase(tl, iLine2, 'p4e', EN_TO_ES_BOTTOM_ERASE, EN_TO_ES_BOTTOM_STAGGER)
      draw(tl, [...fLine1, ...accent], `p4e+=${HANDOFF}`, EN_TO_ES_TOP_DRAW, EN_TO_ES_TOP_STAGGER)
      draw(
        tl,
        [...fStem, ...fLes],
        `p4e+=${HANDOFF}`,
        EN_TO_ES_BOTTOM_DRAW,
        EN_TO_ES_BOTTOM_STAGGER,
      )
      // Without this, "shared"/"accent"/"les" are only ever started once, at
      // mount — P2 and P3 both correctly restart what they draw back in, but
      // P4 didn't, so ES/FR/PT would sit fully drawn and static instead of
      // traveling from the second loop onward (the first loop's ES/FR/PT
      // hold traveling only because of that one-time mount-time start).
      tl.call(() => {
        startTravel('shared')
        startTravel('accent')
        startTravel('les')
      })

      if (controllerRef) {
        controllerRef.current = {
          seek: (target) => tl.seek(target),
          play: () => tl.play(),
          pause: () => tl.pause(),
          setTimeScale: (value) => tl.timeScale(value),
          setProgress: (value) => tl.progress(value),
          getDuration: () => tl.duration(),
        }
      }

      return () => {
        if (controllerRef) controllerRef.current = null
        killTravels()
        layersRef.current.forEach((el) => el.remove())
        layersRef.current = []
      }
    },
    { scope: rootRef, dependencies: [tuning] },
  )

  return (
    <div ref={rootRef} className={className}>
      <Logo className="h-auto w-full" />
    </div>
  )
}
