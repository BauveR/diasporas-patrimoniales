import { useEffect, useRef } from 'react'
import Logo from '../assets/diasporas patrimoniales-03.svg?react'
import { FORM_START, FORM_DURATION } from '../lib/heroTiming'

// Lines 1–2 ("DIÁSPORAS" / "PATRIMONIALES", white): a dim static fill with a
// bright traveling stroke "halo" — HALO_COVERAGE of each letter's own
// perimeter lit at once, looping forever. The halo itself is two layers
// sharing the exact same dasharray/dashoffset animation so they travel in
// lockstep: a wider blurred "glow" underneath, and a thin crisp line on top.
//
// Both halo layers always need to live on their own stroke-only (fill:none)
// elements: a blur filter softens everything an element renders, so
// blurring a path that also carries the dim fill would soften the whole
// letterform, not just the traveling highlight. DIÁSPORAS ships pre-split
// into `.c` (fill only) and `.e` (stroke only) — the halo layers clone from
// `.e`. PATRIMONIALES (`.d`) carries fill and stroke on the same paths, so
// its halo layers clone from `.d` instead, after neutralizing `.d`'s own
// stroke so it doesn't also render a third, unstyled outline underneath.
const FILL_OPACITY = 0.4
const HALO_COLOR = '#fff'
const HALO_COVERAGE = 0.6
const HALO_CRISP_STROKE_WIDTH = 0.6
const HALO_GLOW_STROKE_WIDTH = 1
const HALO_GLOW_BLUR_PX = 0.8
const HALO_LOOP_MS = 13000

// Line 3 ("SIMPOSIO INTERNACIONAL", orange, <g id="line3">): stays hidden
// until the particles finish forming the shape — reuses PointsToShapes' own
// timing instead of an independent guess, so the two can't drift out of
// sync. It arrived as pre-outlined paths now (not a <text>+scale() transform
// like before), so only opacity is touched here — nothing that could
// distort those letterforms' proportions.
const LINE3_DELAY_MS = (FORM_START + FORM_DURATION) * 1000
const LINE3_FADE_MS = 600

// Builds the glow+crisp halo pair from `templatePath` (already fill:none,
// stroke:none — either the real .e path or a stroke-only .d clone) and
// inserts both right after it, in glow-then-crisp paint order.
function createHaloLayers(templatePath: SVGPathElement, animations: Animation[], clones: SVGPathElement[]) {
  const length = templatePath.getTotalLength()
  const dasharray = `${length * HALO_COVERAGE} ${length * (1 - HALO_COVERAGE)}`
  const keyframes = [{ strokeDashoffset: 0 }, { strokeDashoffset: -length }]
  const timing = { duration: HALO_LOOP_MS, iterations: Infinity, easing: 'linear' } as const

  const glow = templatePath.cloneNode(false) as SVGPathElement
  glow.removeAttribute('class')
  glow.style.fill = 'none'
  glow.style.stroke = HALO_COLOR
  glow.style.strokeWidth = String(HALO_GLOW_STROKE_WIDTH)
  glow.style.strokeDasharray = dasharray
  glow.style.filter = `blur(${HALO_GLOW_BLUR_PX}px)`
  templatePath.after(glow)
  clones.push(glow)
  animations.push(glow.animate(keyframes, timing))

  const crisp = templatePath.cloneNode(false) as SVGPathElement
  crisp.removeAttribute('class')
  crisp.style.fill = 'none'
  crisp.style.stroke = HALO_COLOR
  crisp.style.strokeWidth = String(HALO_CRISP_STROKE_WIDTH)
  crisp.style.strokeDasharray = dasharray
  glow.after(crisp)
  clones.push(crisp)
  animations.push(crisp.animate(keyframes, timing))
}

export function HeroWordmark({ className }: { className?: string }) {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const animations: Animation[] = []
    const clones: SVGPathElement[] = []

    // DIÁSPORAS: fill (.c) dimmed; halo layers cloned from the pre-built
    // stroke-only layer (.e), which is then hidden so it doesn't also show
    // through as a plain, unstyled orange outline underneath the clones.
    root.querySelectorAll<SVGPathElement>('.c').forEach((path) => {
      path.style.fillOpacity = String(FILL_OPACITY)
    })
    root.querySelectorAll<SVGPathElement>('.e').forEach((path) => {
      path.style.stroke = 'none'
      createHaloLayers(path, animations, clones)
    })

    // PATRIMONIALES: fill and stroke share the same paths (.d). Dim the
    // fill and strip the default stroke on the original, then clone the
    // glow+crisp halo layers from it.
    root.querySelectorAll<SVGPathElement>('.d').forEach((path) => {
      path.style.fillOpacity = String(FILL_OPACITY)
      path.style.stroke = 'none'
      createHaloLayers(path, animations, clones)
    })

    const line3 = root.querySelector<SVGGElement>('#line3')
    if (line3) {
      line3.style.opacity = '0'
      animations.push(
        line3.animate(
          [{ opacity: 0 }, { opacity: 1 }],
          { duration: LINE3_FADE_MS, delay: LINE3_DELAY_MS, easing: 'ease', fill: 'forwards' },
        ),
      )
    }

    // StrictMode double-invokes effects in dev — without cancelling
    // animations and removing cloned overlays, the second run would stack a
    // second set of infinite dashoffset animations and duplicate halo
    // layers on top of the first.
    return () => {
      animations.forEach((animation) => animation.cancel())
      clones.forEach((clone) => clone.remove())
    }
  }, [])

  return (
    <div ref={rootRef} className={className}>
      <Logo className="h-auto w-full" />
    </div>
  )
}
