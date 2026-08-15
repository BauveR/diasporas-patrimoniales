import { useEffect, useRef } from 'react'
import Logo from '../assets/diasporas patrimoniales-03.svg?react'
import { FORM_START, FORM_DURATION } from '../lib/heroTiming'

// Lines 1–2 ("DIÁSPORAS" / "PATRIMONIALES", white): a dim static fill with a
// bright traveling stroke "halo" — HALO_COVERAGE of each letter's own
// perimeter lit at once, looping forever.
const FILL_OPACITY = 0.4
const HALO_COLOR = '#fff'
const HALO_COVERAGE = 0.4
const HALO_STROKE_WIDTH = 1.5
const HALO_BLUR_PX = 3
const HALO_LOOP_MS = 9000

// Line 3 ("SIMPOSIO INTERNACIONAL", orange): stays hidden until the
// particles finish forming the shape — reuses PointsToShapes' own timing
// instead of an independent guess, so the two can't drift out of sync.
const LINE3_DELAY_MS = (FORM_START + FORM_DURATION) * 1000
const LINE3_FADE_MS = 600

export function HeroWordmark({ className }: { className?: string }) {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const animations: Animation[] = []

    // stroke-dasharray/stroke-dashoffset need each path's own total length —
    // letters have very different perimeters ("O" vs "I") — which only
    // exists once the path is actually in the DOM, hence doing this here
    // rather than as static SVG/CSS.
    root.querySelectorAll<SVGPathElement>('.cls-1').forEach((path) => {
      const length = path.getTotalLength()
      path.style.fillOpacity = String(FILL_OPACITY)
      path.style.stroke = HALO_COLOR
      path.style.strokeWidth = String(HALO_STROKE_WIDTH)
      path.style.strokeDasharray = `${length * HALO_COVERAGE} ${length * (1 - HALO_COVERAGE)}`
      animations.push(
        path.animate(
          [{ strokeDashoffset: 0 }, { strokeDashoffset: -length }],
          { duration: HALO_LOOP_MS, iterations: Infinity, easing: 'linear' },
        ),
      )
    })

    const line3 = root.querySelector<SVGTextElement>('.cls-2')
    if (line3) {
      line3.style.opacity = '0'
      animations.push(
        line3.animate(
          [{ opacity: 0 }, { opacity: 1 }],
          { duration: LINE3_FADE_MS, delay: LINE3_DELAY_MS, easing: 'ease', fill: 'forwards' },
        ),
      )
    }

    // StrictMode double-invokes effects in dev — without cancelling, the
    // second run would stack a second set of infinite dashoffset animations
    // on top of the first.
    return () => {
      animations.forEach((animation) => animation.cancel())
    }
  }, [])

  return (
    <div ref={rootRef} className={className}>
      <Logo className="h-auto w-full" />
    </div>
  )
}
