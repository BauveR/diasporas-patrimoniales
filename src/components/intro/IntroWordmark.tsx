import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import Logo from '../../assets/diasporas nimation-01.svg?react'

// /intro's wordmark: a self-contained, looping choreography that walks the
// four language states as a showcase — NOT driven by i18n (the page stays
// Spanish). One full loop:
//
//   ES            "Diásporas patrimoniales", shown as-is           (hold)
//   ES → FR       the acute accent over "a" dissolves away
//   FR → PT       "les" dissolves; the accent draws back; then "i"
//                 draws in, then "s" draws in            → "patrimoniais"
//   PT → EN       top line dissolves / "HERITAGE" draws in; when that
//                 lands, the bottom line dissolves / "DIASPORAS" draws
//                 in below
//   EN → ES       everything English dissolves, the ES wordmark draws
//                 back in — then the timeline repeats
//
// The traveling "halo" is the through-line: it keeps looping on every glyph
// that's currently present, is torn down the instant a glyph starts leaving,
// and is (re)built the instant an entering glyph lands.
//
// Source art groups (one shared viewBox, so nothing reflows — every state is
// just opacity/scale on <path>s):
//   #frances   22 paths — line 1 [0..8] "DIASPORAS", line 2 [9..21]
//              "patrimoniales" ([9..18] "patrimonia", [19..21] "les")
//   #espanol   1 — the acute accent
//   #portugues 2 — [0] "i", [1] "s" (the "-is" ending)
//   #ingles    17 — line 1 [0..7] "HERITAGE", line 2 [8..16] "DIASPORAS".
//              Drawn on its own grid in the art, so it gets a one-time
//              measured transform here to sit on #frances' size/position.
const FILL_OPACITY = 0.4
const HALO_COLOR = '#fff'
const HALO_COVERAGE = 0.6
const HALO_CRISP_STROKE_WIDTH = 0.6
const HALO_GLOW_STROKE_WIDTH = 1
const HALO_GLOW_BLUR_PX = 0.8
const HALO_LOOP_MS = 13000

// Choreography tempo (seconds) — first-pass values, tune freely.
const HOLD = 1.4 // how long a finished state is shown
const DISSOLVE = 0.45 // a glyph fading/shrinking out
const DRAWON = 0.5 // a glyph fading/scaling in
const STAGGER = 0.09 // gap between glyphs in a staggered run

// Builds the glow+crisp halo pair from `templatePath` (cloned with fill:none)
// and inserts both right after it. Returns a teardown that cancels the two
// animations and removes the two clones.
function buildHalo(templatePath: SVGPathElement): () => void {
  const length = templatePath.getTotalLength()
  const dasharray = `${length * HALO_COVERAGE} ${length * (1 - HALO_COVERAGE)}`
  const keyframes = [{ strokeDashoffset: 0 }, { strokeDashoffset: -length }]
  const timing = { duration: HALO_LOOP_MS, iterations: Infinity, easing: 'linear' } as const

  const makeLayer = (strokeWidth: number, blurPx: number) => {
    const layer = templatePath.cloneNode(false) as SVGPathElement
    layer.removeAttribute('class')
    layer.dataset.halo = '' // marks this as a halo clone, not a glyph
    layer.style.fill = 'none'
    layer.style.stroke = HALO_COLOR
    layer.style.strokeWidth = String(strokeWidth)
    layer.style.strokeDasharray = dasharray
    layer.style.opacity = '1'
    // Neutralise any GSAP transform/filter inherited from the glyph's style
    // attribute — the halo is only ever built while its glyph is at rest.
    layer.style.transform = 'none'
    layer.style.filter = blurPx ? `blur(${blurPx}px)` : 'none'
    return layer
  }

  const glow = makeLayer(HALO_GLOW_STROKE_WIDTH, HALO_GLOW_BLUR_PX)
  const crisp = makeLayer(HALO_CRISP_STROKE_WIDTH, 0)
  templatePath.after(glow)
  glow.after(crisp)

  const animations = [glow.animate(keyframes, timing), crisp.animate(keyframes, timing)]
  return () => {
    animations.forEach((animation) => animation.cancel())
    glow.remove()
    crisp.remove()
  }
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

export function IntroWordmark({ className }: { className?: string }) {
  const rootRef = useRef<HTMLDivElement>(null)
  const halosRef = useRef(new Map<SVGPathElement, () => void>())

  useGSAP(
    () => {
      const root = rootRef.current
      if (!root) return

      // Clear stale halo clones (HMR / StrictMode re-run).
      root.querySelectorAll('[data-halo]').forEach((n) => n.remove())
      halosRef.current.clear()

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
        // Art changed shape — show ES statically rather than misfire.
        gsap.set([...frances, ...accent], { opacity: 1 })
        gsap.set([...port, ...ingles], { opacity: 0 })
        return
      }

      const fLine1 = frances.slice(0, 9) // "DIASPORAS"
      const fStem = frances.slice(9, 19) // "patrimonia"
      const fLes = frances.slice(19) // "les"
      const iLine1 = ingles.slice(0, 8) // "HERITAGE"
      const iLine2 = ingles.slice(8) // "DIASPORAS" (English)
      const inglesGroup = root.querySelector<SVGGElement>('#ingles')!

      const setHalo = (paths: SVGPathElement[], on: boolean) => {
        const halos = halosRef.current
        for (const p of paths) {
          if (on && !halos.has(p)) halos.set(p, buildHalo(p))
          if (!on && halos.has(p)) {
            halos.get(p)!()
            halos.delete(p)
          }
        }
      }

      // Dim every glyph's fill (halo clones are added later, unaffected).
      gsap.set([...frances, ...accent, ...port, ...ingles], { fillOpacity: FILL_OPACITY })

      // One-time transform so #ingles' two-line lockup sits at #frances' size
      // and position (the art draws it on a different grid): match total
      // height, centre on centre.
      const fBox = unionBBox(frances)
      const iBox = unionBBox(ingles)
      const scale = iBox.h > 0 ? fBox.h / iBox.h : 1
      inglesGroup.setAttribute(
        'transform',
        `translate(${fBox.cx} ${fBox.cy}) scale(${scale}) translate(${-iBox.cx} ${-iBox.cy})`,
      )

      // Initial state: Spanish visible, the rest hidden.
      gsap.set([...frances, ...accent], { opacity: 1, scale: 1, filter: 'blur(0px)' })
      gsap.set([...port, ...ingles], { opacity: 0, scale: 1, filter: 'blur(0px)' })
      setHalo([...frances, ...accent], true)

      const out = { opacity: 0, scale: 0.55, filter: 'blur(2px)', duration: DISSOLVE }
      const inFrom = { opacity: 0, scale: 0.55, filter: 'blur(3px)' }
      const inTo = { opacity: 1, scale: 1, filter: 'blur(0px)', duration: DRAWON }

      const tl = gsap.timeline({ repeat: -1, defaults: { ease: 'power2.inOut' } })

      // PHASE 0 — hold ES
      tl.to({}, { duration: HOLD })

      // PHASE 1 — ES → FR: the accent dissolves
      tl.addLabel('p1')
        .call(() => setHalo(accent, false))
        .to(accent, { ...out }, 'p1')
        .to({}, { duration: HOLD })

      // PHASE 2 — FR → PT
      tl.addLabel('p2')
        .call(() => setHalo(fLes, false))
        .to(fLes, { ...out, stagger: STAGGER }, 'p2')
        .fromTo(accent, { ...inFrom }, { ...inTo }, 'p2+=0.15')
        .call(() => setHalo(accent, true))
        .fromTo(port[0], { ...inFrom }, { ...inTo }, 'p2+=' + (DISSOLVE + 2 * STAGGER))
        .call(() => setHalo([port[0]], true))
        .fromTo(port[1], { ...inFrom }, { ...inTo }, '>')
        .call(() => setHalo([port[1]], true))
        .to({}, { duration: HOLD })

      // PHASE 3 — PT → EN, line by line
      tl.addLabel('p3')
        .call(() => setHalo(fLine1, false))
        .to(fLine1, { ...out, scale: 0.6, stagger: STAGGER }, 'p3')
        .fromTo(iLine1, { ...inFrom, scale: 0.6 }, { ...inTo, stagger: STAGGER }, 'p3+=0.2')
        .call(() => setHalo(iLine1, true))
        .addLabel('p3b')
        .call(() => setHalo([...fStem, ...accent, ...port], false), undefined, 'p3b')
        .to([...fStem, ...accent, ...port], { ...out, scale: 0.6, stagger: STAGGER }, 'p3b')
        .fromTo(iLine2, { ...inFrom, scale: 0.6 }, { ...inTo, stagger: STAGGER }, 'p3b+=0.2')
        .call(() => setHalo(iLine2, true))
        .to({}, { duration: HOLD })

      // PHASE 4 — EN → ES, then the timeline repeats
      tl.addLabel('p4')
        .call(() => setHalo(ingles, false))
        .to(ingles, { ...out, scale: 0.6, stagger: STAGGER / 2 }, 'p4')
        .set([...frances, ...accent], { opacity: 0, scale: 0.6, filter: 'blur(3px)' }, 'p4')
        .set(port, { opacity: 0, scale: 1, filter: 'blur(0px)' }, 'p4')
        .to(
          [...frances, ...accent],
          { opacity: 1, scale: 1, filter: 'blur(0px)', duration: DRAWON, stagger: STAGGER / 3 },
          'p4+=0.25',
        )
        .call(() => setHalo([...frances, ...accent], true))

      return () => {
        halosRef.current.forEach((teardown) => teardown())
        halosRef.current.clear()
      }
    },
    { scope: rootRef },
  )

  return (
    <div ref={rootRef} className={className}>
      <Logo className="h-auto w-full" />
    </div>
  )
}
