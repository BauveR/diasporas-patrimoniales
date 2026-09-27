import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import Logo from '../assets/diasporas nimation-01.svg?react'

// Per-language hero wordmark with the traveling "halo": a bright dash that
// runs around each letter's own perimeter, looping forever, made of two
// layers sharing one dasharray/dashoffset animation — a wide blurred "glow"
// underneath and a thin crisp line on top.
//
// Source art ("diasporas nimation-01.svg", 2026-09-08) is a single artboard
// holding every language variant as a named layer group, all in the same
// coordinate space so the glyphs that don't change sit at identical
// positions from one language to the next:
//
//   #frances    "DIASPORAS" + "patrimoniales", no accent — the base.
//               22 paths: 9 on line 1, then 13 on line 2, in document order.
//   #espanol    just the acute accent over the first "A" (1 path).
//   #portugues  the "-is" ending that stands in for "-les" (2 paths: i, s).
//   #ingles     "HERITAGE" / "DIASPORAS" — its own separate layout (17 paths).
//
// Composition per language:
//   fr = #frances
//   es = #frances + #espanol
//   pt = #frances minus its last 3 paths (l·e·s of "patrimoniales") + #espanol
//        + #portugues
//   en = #ingles only
//
// Everything is kept in one mounted SVG (rather than swapping whole files) so
// that a language change only toggles the glyphs that actually differ and
// only rebuilds the halo for those. The shared letters keep the exact same
// running animation, uninterrupted, straight through the transition.
//
// `buildHalo` inserts its glow/crisp clones as <path>s right inside the same
// group and tags them `data-halo`; every glyph query here is
// `:not([data-halo])` so those clones never fold back into the glyph lists.
// Without that, re-running the query on each switch made `slice(-3)` stop
// meaning "l·e·s" (it became "s" + its two halo clones) and let halos stack
// up clone-on-clone, looking different after every switch.
//
// (Layer ids survive the build because vite.config.ts turns off SVGO's
// `cleanupIds` for `?react` imports. The "les" run isn't its own group in the
// art, so it's taken as the last three paths of #frances by document order.
// Halo constants are still those tuned against the previous, larger export;
// re-tuning is a later pass.)
const FILL_OPACITY = 0.4
const HALO_COLOR = '#fff'
const HALO_COVERAGE = 0.6
const HALO_CRISP_STROKE_WIDTH = 0.6
const HALO_GLOW_STROKE_WIDTH = 1
const HALO_GLOW_BLUR_PX = 0.8
const HALO_LOOP_MS = 13000
const GLYPH_FADE_MS = 350

type Lang = 'es' | 'fr' | 'pt' | 'en'

// i18n hands us plain codes ('es'|'en'|'fr'|'pt'), but tolerate region tags
// ('es-ES') too, and fall back to the default locale for anything else.
function toLang(raw: string | undefined): Lang {
  const base = (raw ?? 'es').toLowerCase().split('-')[0]
  return base === 'fr' || base === 'pt' || base === 'en' ? base : 'es'
}

// Builds the glow+crisp halo pair from `templatePath` (cloned with fill:none)
// and inserts both right after it, glow-then-crisp. Returns a teardown that
// cancels the two animations and removes the two clones.
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
    layer.style.transition = 'none'
    if (blurPx) layer.style.filter = `blur(${blurPx}px)`
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

export function HeroWordmark({ className }: { className?: string }) {
  const rootRef = useRef<HTMLDivElement>(null)
  const { i18n } = useTranslation()
  const lang = toLang(i18n.language)

  // Halo teardown fns keyed by the glyph <path> each one decorates. Kept in a
  // ref so it survives renders and language changes — the language effect
  // diffs against it and leaves a still-active letter's halo untouched.
  const halosRef = useRef(new Map<SVGPathElement, () => void>())

  // Mount once: dim every glyph's fill and give it an opacity transition for
  // the crossfade. Halos are torn down here on unmount — the language effect
  // below has no cleanup of its own on purpose (see there).
  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    root
      .querySelectorAll<SVGPathElement>('.cls-1:not([data-halo])')
      .forEach((path) => {
        path.style.fillOpacity = String(FILL_OPACITY)
        path.style.transition = `opacity ${GLYPH_FADE_MS}ms ease`
      })

    const halos = halosRef.current
    return () => {
      halos.forEach((teardown) => teardown())
      halos.clear()
    }
  }, [])

  // On language change: pick the active glyph set, crossfade everything else
  // out, then diff the halo set — tear down halos for glyphs leaving, build
  // them for glyphs entering, and never touch the ones that stay. Leaving the
  // stayers alone is what keeps the halo running unbroken across the switch,
  // so there's no full-rebuild cleanup here on purpose.
  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    // `:not([data-halo])` keeps the halo clones buildHalo() inserts into these
    // same groups out of the glyph lists.
    const pathsOf = (id: string) =>
      Array.from(root.querySelectorAll<SVGPathElement>(`#${id} path:not([data-halo])`))

    const frances = pathsOf('frances') // [0..8] line 1, [9..21] line 2
    const francesLes = frances.slice(-3) // l · e · s of "patrimoniales"
    const accent = pathsOf('espanol')
    const portugalTail = pathsOf('portugues')
    const ingles = pathsOf('ingles')

    const activeByLang: Record<Lang, SVGPathElement[]> = {
      fr: frances,
      es: [...frances, ...accent],
      pt: [...frances.filter((path) => !francesLes.includes(path)), ...accent, ...portugalTail],
      en: ingles,
    }
    const active = activeByLang[lang]
    const activeSet = new Set(active)

    // Every glyph is shown iff it's in the active set; the opacity transition
    // set at mount turns each toggle into a crossfade.
    for (const path of [...frances, ...accent, ...portugalTail, ...ingles]) {
      path.style.opacity = activeSet.has(path) ? '1' : '0'
    }

    const halos = halosRef.current
    halos.forEach((teardown, path) => {
      if (!activeSet.has(path)) {
        teardown()
        halos.delete(path)
      }
    })
    for (const path of active) {
      if (!halos.has(path)) halos.set(path, buildHalo(path))
    }
  }, [lang])

  return (
    <div ref={rootRef} className={className}>
      <Logo className="h-auto w-full" />
    </div>
  )
}
