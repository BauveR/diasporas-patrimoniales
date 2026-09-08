import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import Logo from '../../assets/diasporas nimation-01.svg?react'

// /intro's wordmark — forked from HeroWordmark so a different language-
// transition animation can be developed here without touching the Home hero.
// For now it behaves like HeroWordmark (Spanish only on /intro today): the
// per-language layer groups, the active-set-per-language selection and the
// traveling "halo" are all identical; only the way glyphs enter/leave on a
// language change is expected to diverge, and that lives in the language
// effect below.
//
// Source art ("diasporas nimation-01.svg") is a single artboard holding every
// language variant as a named layer group, all in the same coordinate space:
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
// `buildHalo` inserts its glow/crisp clones as <path>s right inside the same
// group and tags them `data-halo`; every glyph query here is
// `:not([data-halo])` so those clones never fold back into the glyph lists.
//
// (Layer ids survive the build because vite.config.ts turns off SVGO's
// `cleanupIds` for `?react` imports. Halo constants are still those tuned
// against the previous, larger export; re-tuning is a later pass.)
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

export function IntroWordmark({ className }: { className?: string }) {
  const rootRef = useRef<HTMLDivElement>(null)
  const { i18n } = useTranslation()
  const lang = toLang(i18n.language)

  // Halo teardown fns keyed by the glyph <path> each one decorates. Kept in a
  // ref so it survives renders and language changes — the language effect
  // diffs against it and leaves a still-active letter's halo untouched.
  const halosRef = useRef(new Map<SVGPathElement, () => void>())

  // Mount once: dim every glyph's fill and give it an opacity transition for
  // the crossfade. Halos are torn down here on unmount.
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
  // out, then diff the halo set. This is the seam where /intro's own
  // transition animation will replace the plain crossfade.
  useEffect(() => {
    const root = rootRef.current
    if (!root) return

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
