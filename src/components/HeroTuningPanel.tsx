import { useEffect, useMemo, useState } from 'react'
import { Leva, button, useControls } from 'leva'
import { HERO_TUNING_DEFAULTS, type HeroDesktopOffsets, type HeroOrbTuning, type HeroTuning } from '../lib/heroTuning'
import type { BreakpointBucket } from '../hooks/useBreakpoint'

// One leva folder per breakpoint bucket — same three sliders each time, only
// the defaults (and the folder label) change. Always called in the same
// fixed order below (never conditionally), so this stays rules-of-hooks safe
// despite being a helper wrapping useControls.
function useOrbBucketControls(label: string, defaults: HeroOrbTuning): HeroOrbTuning {
  return useControls(label, {
    // Wide enough to reach past a fully-grown mobile section's height, not
    // just one screen's worth: CameraRig now anchors the frustum's top to a
    // fixed viewport-height reference instead of the (possibly much taller,
    // content-dependent) canvas's own midpoint, so shiftY may need to travel
    // considerably further than "one screen" to bring the swarm back into
    // view on a tall stacked-content layout.
    shiftX: { value: defaults.shiftX, min: -300, max: 300, step: 1 },
    shiftY: { value: defaults.shiftY, min: -300, max: 300, step: 1 },
    scale: { value: defaults.scale, min: 0.1, max: 5, step: 0.05 },
  })
}

// Mismo patrón que useOrbBucketControls: una carpeta por bucket desktop con
// X/Y (px) para cada bloque del hero. Solo la carpeta del bucket activo
// tiene efecto en pantalla (ver el indicador abajo a la derecha).
function useDesktopBucketControls(label: string, defaults: HeroDesktopOffsets): HeroDesktopOffsets {
  const range = { min: -400, max: 400, step: 1 }
  return useControls(label, {
    wordmarkX: { value: defaults.wordmarkX, ...range, label: 'Wordmark X' },
    wordmarkY: { value: defaults.wordmarkY, ...range, label: 'Wordmark Y' },
    titularX: { value: defaults.titularX, ...range, label: 'Titular X' },
    titularY: { value: defaults.titularY, ...range, label: 'Titular Y' },
    logosX: { value: defaults.logosX, ...range, label: 'Logos X' },
    logosY: { value: defaults.logosY, ...range, label: 'Logos Y' },
    textosX: { value: defaults.textosX, ...range, label: 'Textos lat. X' },
    textosY: { value: defaults.textosY, ...range, label: 'Textos lat. Y' },
    botonesX: { value: defaults.botonesX, ...range, label: 'Botones X' },
    botonesY: { value: defaults.botonesY, ...range, label: 'Botones Y' },
  }, { collapsed: true })
}

function useViewportSize() {
  const [size, setSize] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }))
  useEffect(() => {
    const handler = () => setSize({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return size
}

// Only ever mounted via a dynamic `import()` gated on `import.meta.env.DEV`
// (see PointsToShapes.tsx) — never a static import — so this file and the
// `leva` package it pulls in live in their own chunk and are never fetched
// in production. Reports live slider values up to the parent instead of
// owning them, since the parent (not this dev-only panel) is what needs
// them for every render, including production ones where this never mounts.
export default function HeroTuningPanel({
  onChange,
  bucket,
  isMdLandscapePhone,
  isSmLandscapePhone,
  isLgPortraitTablet,
}: {
  onChange: (tuning: HeroTuning) => void
  bucket: BreakpointBucket
  isMdLandscapePhone: boolean
  isSmLandscapePhone: boolean
  isLgPortraitTablet: boolean
}) {
  const layout = useControls('Hero — layout', {
    heroOverlayShiftPx: { value: HERO_TUNING_DEFAULTS.heroOverlayShiftPx, min: 0, max: 350, step: 1 },
    railMaxWidthRem: { value: HERO_TUNING_DEFAULTS.railMaxWidthRem, min: 60, max: 160, step: 1 },
  })

  const lg = useOrbBucketControls('Orb — lg (1024)', HERO_TUNING_DEFAULTS.orb.lg)
  const xl = useOrbBucketControls('Orb — xl (1280)', HERO_TUNING_DEFAULTS.orb.xl)
  const xxl = useOrbBucketControls('Orb — 2xl (1536)', HERO_TUNING_DEFAULTS.orb['2xl'])
  // Only takes effect at the `lg` bucket while the viewport is portrait (a
  // large iPad, not a landscape tablet/narrow laptop) — see the
  // orbLgPortrait comment in heroTuning.ts.
  const lgPortrait = useOrbBucketControls('Orb — lg portrait (tablet)', HERO_TUNING_DEFAULTS.orbLgPortrait)

  // Calibración de todo lo que está por debajo de `lg` (base, sm, md — vertical
  // u horizontal): con "Usar estos valores" activo, reemplaza la tabla por
  // alto (o el valor fijo de sm horizontal) en la medida actual. Una sola
  // carpeta para todos: las tablas viven en heroTuning.ts.
  const orbBaseOverride = useControls('Orb — móvil/tablet (medida actual)', {
    enabled: { value: HERO_TUNING_DEFAULTS.orbBaseOverride.enabled, label: 'Usar estos valores' },
    shiftX: { value: HERO_TUNING_DEFAULTS.orbBaseOverride.shiftX, min: -300, max: 300, step: 1 },
    shiftY: { value: HERO_TUNING_DEFAULTS.orbBaseOverride.shiftY, min: -300, max: 300, step: 1 },
    scale: { value: HERO_TUNING_DEFAULTS.orbBaseOverride.scale, min: 0.1, max: 5, step: 0.05 },
  })

  // Por defecto lg y xl (orb + bloques) y el orb de 2xl salen de tablas
  // por medida (heroTuning.ts) y sus carpetas no tienen efecto; activar esto
  // vuelve a usar los sliders para calibrar una medida nueva.
  const { desktopManual } = useControls('Desktop — modo', {
    desktopManual: { value: HERO_TUNING_DEFAULTS.desktopManual, label: 'Usar sliders lg/xl/2xl' },
  })

  const desktopLg = useDesktopBucketControls('Desktop — lg (1024)', HERO_TUNING_DEFAULTS.desktop.lg)
  const desktopXl = useDesktopBucketControls('Desktop — xl (1280)', HERO_TUNING_DEFAULTS.desktop.xl)
  const desktop2xl = useDesktopBucketControls('Desktop — 2xl (1536)', HERO_TUNING_DEFAULTS.desktop['2xl'])

  // No "Orb — base" folder anymore: PointsToShapes interpolates that
  // bucket's shiftX/shiftY/scale by height instead of reading orb.base at
  // all (see HERO_ORB_BASE_BY_HEIGHT in heroTuning.ts, edited directly —
  // not panel-tunable) — this default is kept only so `orb` still
  // structurally satisfies Record<BreakpointBucket, ...>, it has no effect
  // on what actually renders.
  const orb = useMemo<Record<BreakpointBucket, HeroOrbTuning>>(
    () => ({ base: HERO_TUNING_DEFAULTS.orb.base, sm: HERO_TUNING_DEFAULTS.orb.sm, md: HERO_TUNING_DEFAULTS.orb.md, lg, xl, '2xl': xxl }),
    [lg, xl, xxl],
  )
  const tuning = useMemo<HeroTuning>(
    () => ({
      ...layout,
      orb,
      orbSmLandscape: HERO_TUNING_DEFAULTS.orbSmLandscape,
      orbLgPortrait: lgPortrait,
      desktop: { lg: desktopLg, xl: desktopXl, '2xl': desktop2xl },
      orbBaseOverride,
      desktopManual,
    }),
    [layout, orb, lgPortrait, desktopLg, desktopXl, desktop2xl, orbBaseOverride, desktopManual],
  )

  // "Copiar valores": deja en el portapapeles (y en la consola) el objeto
  // completo, listo para pegarlo en HERO_TUNING_DEFAULTS (heroTuning.ts).
  // `[tuning]` como deps: leva regenera el botón con los valores actuales.
  useControls({
    'Copiar valores': button(() => {
      const json = JSON.stringify(tuning, null, 2)
      console.log('[HeroTuning]\n' + json)
      void navigator.clipboard?.writeText(json)
    }),
  }, [tuning])
  const viewport = useViewportSize()

  useEffect(() => {
    onChange(tuning)
  }, [tuning, onChange])

  return (
    <>
      {/* Every "Orb — <bucket>" folder above is always visible at once,
          regardless of the real viewport — only the one matching the
          CURRENT bucket actually affects anything on screen (see
          PointsToShapes/useBreakpoint). Without this readout it's easy to
          drag a folder's sliders while the browser is still narrower/wider
          than that bucket's range and see no effect, and wrongly read that
          as the controls being broken (happened tuning `sm`). */}
      <div className="pointer-events-none fixed right-4 bottom-4 z-[10000] rounded-md bg-black/80 px-3 py-1.5 font-mono text-xs text-white">
        {viewport.w}×{viewport.h} · Bucket activo: <strong>{BUCKET_LABELS[bucket]}</strong>
        {isMdLandscapePhone && <> — <strong>md landscape (phone)</strong> activo</>}
        {isSmLandscapePhone && <> — <strong>sm landscape (phone)</strong> activo</>}
        {(bucket === 'lg' || bucket === 'xl' || bucket === '2xl') && (desktopManual
          ? <> — <strong>sliders manuales</strong></>
          : <> — {bucket === 'xl' ? 'tabla por alto' : bucket === '2xl' ? 'orb por ancho' : isLgPortraitTablet ? 'valores fijos' : 'tabla por ancho'}, ver heroTuning.ts</>)}
        {isLgPortraitTablet && <> — <strong>lg portrait (tablet)</strong> activo</>}
        {(bucket === 'base' || bucket === 'sm' || bucket === 'md') && (orbBaseOverride.enabled
          ? <> — <strong>valores manuales</strong> (Orb — móvil/tablet)</>
          : isSmLandscapePhone
            ? <> — valor fijo, ver heroTuning.ts</>
            : <> — interpolado por alto, ver heroTuning.ts</>)}
      </div>
      <Leva collapsed titleBar={{ title: 'Hero tuning' }} />
    </>
  )
}

const BUCKET_LABELS: Record<BreakpointBucket, string> = {
  base: 'base (<640)',
  sm: 'sm (640)',
  md: 'md (768)',
  lg: 'lg (1024)',
  xl: 'xl (1280)',
  '2xl': '2xl (1536)',
}
