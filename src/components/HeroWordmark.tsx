import { useEffect, useRef } from 'react'
import Logo from '../assets/diasporas patrimoniales-canarias-01-01-01.svg?react'

// Both lines ("DIÁSPORAS" / "PATRIMONIALES CANARIAS", white): a dim static
// fill with a bright traveling stroke "halo" — HALO_COVERAGE of each
// letter's own perimeter lit at once, looping forever. The halo itself is
// two layers sharing the exact same dasharray/dashoffset animation so they
// travel in lockstep: a wider blurred "glow" underneath, and a thin crisp
// line on top.
//
// This export (2026-09-07, "diasporas patrimoniales-canarias-01-01-01.svg")
// dropped the separate stroke-only letter layer earlier exports had — that
// layer existed only as Illustrator's `Outline Stroke` output, which is what
// was deforming the S letters (offsetting a stroke into filled geometry
// breaks down on tight curve reversals; see prior discussion). With no
// stroke class left in the file's `<style>` block at all (every path is
// `.b { fill: #fff }`), every letter on both lines now gets uniform
// treatment: dim the fill, then clone the same path for the halo — there's
// no separate template to neutralize a stroke on, since none exists.
// (This file's class names are assigned per-export by Illustrator and
// aren't stable across swaps — re-derive the mapping from each new file's
// own `<style>` block rather than assuming a class name carries over.)
//
// `.b` still duplicates the DIÁSPORAS fill layer as two identical, fully
// overlapping copies (same as prior exports). Left alone, dimming both would
// compound into ~64% effective opacity instead of the intended
// FILL_OPACITY — and cloning a halo from both would double up the traveling
// highlight too — so the dedup below keeps only the first copy of each
// duplicated path and hides the rest.
const FILL_OPACITY = 0.4
const HALO_COLOR = '#fff'
const HALO_COVERAGE = 0.6
const HALO_CRISP_STROKE_WIDTH = 0.6
const HALO_GLOW_STROKE_WIDTH = 1
const HALO_GLOW_BLUR_PX = 0.8
const HALO_LOOP_MS = 13000

// Builds the glow+crisp halo pair from `templatePath` (any letter's fill
// path — cloned with `fill: none` regardless of the source's own styling)
// and inserts both right after it, in glow-then-crisp paint order.
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

    // Every letter on both lines is a plain fill-only `.b` path now — dim
    // it and clone a halo from it, uniformly. `.b` ships DIÁSPORAS's fill
    // layer as two fully identical, overlapping copies (see the top-of-file
    // comment) — skip the second occurrence of each duplicated path so
    // dimming and the halo clone aren't both doubled on the same letters.
    const seenFillPaths = new Set<string>()
    root.querySelectorAll<SVGPathElement>('.b').forEach((path) => {
      const d = path.getAttribute('d')
      if (d && seenFillPaths.has(d)) {
        path.style.display = 'none'
        return
      }
      if (d) seenFillPaths.add(d)
      path.style.fillOpacity = String(FILL_OPACITY)
      createHaloLayers(path, animations, clones)
    })

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
