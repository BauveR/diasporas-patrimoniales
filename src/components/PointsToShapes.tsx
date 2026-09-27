import { useRef, useMemo, useState, useEffect, lazy, Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import { Canvas, useFrame, extend, type ThreeElement } from '@react-three/fiber'
import { Effects } from '@react-three/drei'
import { UnrealBloomPass } from 'three-stdlib'
import * as THREE from 'three'
import shapesSvgRaw from '../assets/orbit diasporas patrimoniales-03.svg?raw'
import { generateSvgFillPositions } from '../lib/generateSvgFillPositions'
import { createShapeMask } from '../lib/createShapeMask'
import { DEFAULT_LOCALE } from '../i18n/config'
import { getLocaleFromPathname } from '../i18n/routing'
import { FORM_START, FORM_DURATION } from '../lib/heroTiming'
import { HERO_TUNING_DEFAULTS, HERO_ORB_BASE_BY_HEIGHT, interpolateOrbByHeight } from '../lib/heroTuning'
import { useBreakpoint, type BreakpointBucket } from '../hooks/useBreakpoint'
import { HeroWordmark } from './HeroWordmark'
import { GrainientBackground } from './GrainientBackground'
import { SlideInText } from './SlideInText'
import logoGobCan from '../assets/Logo_GobCan_claim_blanco_mod1-01.png'
import logoCabildoTenerife from '../assets/cabildo-de-tenerife [Converted]-01.png'
import logoTEA from '../assets/tenerife-espacio-de-las-artes [Converted]-01.png'
import logoMuna from '../assets/15-Logo-MUNA-Museos-de-Tenerife-Naturaleza-y-Arqueologia-750x750.png'
import logoPatrimonioCultural from '../assets/patrimonio cultural de canarias.png'

// Animated gradient colors for the hero background — brought over from the
// Conjuntos Históricos project's Hero (Grainient), retuned to this site's
// own palette. The shader blends two accent corners (GRADIENT_ACCENT/
// GRADIENT_THIRD) against a shared color that dominates the rest of the
// frame — that role goes to black.
const GRADIENT_ACCENT = '#9b2923'
const GRADIENT_DOMINANT = '#000000'
const GRADIENT_THIRD = '#000000'

// `import.meta.env.DEV` is a Vite build-time constant: in a production
// build this whole ternary collapses to `null` and the `import()` call is
// never reached, so it's never executed — the browser never fetches
// HeroTuningPanel's chunk (or the `leva` dependency inside it). A plain
// `if (DEV) import(...)` guard alone doesn't achieve this: Rollup decides
// what to bundle from the static module graph before a minifier's dead-code
// elimination ever runs, so `leva` previously shipped in production despite
// being reachable only through a dev-only branch. A real `import()` code-
// split point, only ever invoked on this branch, is what actually keeps it
// out.
const HeroTuningPanel = import.meta.env.DEV ? lazy(() => import('./HeroTuningPanel')) : null

// Holds the headline's letter-by-letter reveal off until the particle shape
// is almost fully formed, so the two "big reveal" animations don't visually
// compete at the same time — the text starts right as the shape's motion is
// settling down instead of while it's still actively assembling.
const HEADLINE_START_DELAY = FORM_START + FORM_DURATION - 0.4

extend({ UnrealBloomPass })

declare module '@react-three/fiber' {
  interface ThreeElements {
    unrealBloomPass: ThreeElement<typeof UnrealBloomPass>
  }
}

// Same swirl feel as HyperluminousSwarm — this screen reuses that motion,
// just with a different particle count and a different formation target.
const PARAMS = {
  scale: 110,
  speed: 1.35,
  twist: 8,
  glow: 3.5,
  brightness: 1.12,
  chaos: 0.95,
  layers: 4.2,
  pulse: 1.75,
  gravity: 1.65,
}
const PI2 = 6.283185307179586
const GOLDEN_ANGLE = 2.399963229728653

// BASE_POINTS was originally derived from counting <path> elements in a
// reference SVG of scattered points — only the count mattered, never that
// SVG's actual layout, so it's kept as a literal now that the file's gone.
// Adjust EXTRA_POINTS on top of it if the swarm reads as too sparse or too
// dense once rendered.
const BASE_POINTS = 535
const EXTRA_POINTS = 100
const COUNT = (BASE_POINTS + EXTRA_POINTS) * 2


// World-space width the shape SVG is scaled to — shared between
// generateSvgFillPositions (initial formation targets) and createShapeMask
// (the ongoing wander bounds check), so both agree on the same mapping.
const SHAPE_WORLD_WIDTH = 62

// Shifts the formed shape up/down on screen without touching the wander/mask
// math (which stays in the SVG's own coordinate space) — applied only where
// the wander target becomes the render target, below. 0 = vertically
// centered; positive moves it up, negative moves it down.
const SHAPE_Y_OFFSET = 10

// Once formed, particles keep wandering inside the shape instead of freezing:
// each one hops WANDER_STEP world units in a random direction whenever it
// arrives near its current wander target, but only if the whole hop stays
// inside the shape mask — otherwise it just tries a new direction next frame.
// Kept small relative to SHAPE_WORLD_WIDTH: the SVG's rings are thin bands
// with gaps between them, so an oversized step risks a valid-looking
// endpoint that's actually in a different ring than it started in.
const WANDER_STEP = 1.5
const WANDER_ARRIVE_DIST = 0.4

// The shape mask only exists in X/Y — it can't tell a hop's Z step is
// "inside" or "outside" anything, so without a limit each accepted hop's
// random Z nudge accumulates as an unbounded random walk. Clamp it to the
// same depth range generateSvgFillPositions used for the initial formation,
// so particles keep the shape's flat-ish volume instead of gradually
// drifting off the ring plane over time.
const WANDER_Z_LIMIT = (SHAPE_WORLD_WIDTH * 0.02) / 2

// Fraction of the base geometry size (IcosahedronGeometry radius 0.25) a
// particle eases down to once fully formed — full size while swirling.
const FORMED_SCALE = 0.9

// Particles are a single fixed color for their whole lifetime — swirling or
// formed, it never changes, so there's no per-frame interpolation to do.
const COLOR_PARTICLE = new THREE.Color(0xffffff)

// The wordmark/text column only shows from `lg` up — these are the buckets
// (see useBreakpoint) where that desktop layout, rather than the stacked
// mobile/tablet one, is what's on screen.
const LARGE_BUCKETS = new Set<BreakpointBucket>(['lg', 'xl', '2xl'])

// A rotated phone (e.g. ~844x390) reports the same `md` bucket by width as
// a portrait tablet (~768x1024) — useBreakpoint only looks at width, so it
// can't tell the two apart, but they need very different orb framing (a
// short-and-wide viewport vs a tall-and-narrow one). `orientation` (a CSS
// media feature, not a raw width/height compare) matches the pattern
// useBreakpoint/useIsDesktop already use elsewhere in this codebase.
function useIsLandscape(): boolean {
  const [isLandscape, setIsLandscape] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(orientation: landscape)').matches,
  )
  useEffect(() => {
    const mql = window.matchMedia('(orientation: landscape)')
    const handler = (e: MediaQueryListEvent) => setIsLandscape(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])
  return isLandscape
}

// An orthographic camera's `zoom` maps 1 world unit to exactly `zoom` CSS
// pixels — unlike R3F's default `zoom: 1` (1 world unit = 1 raw pixel, which
// rendered SHAPE_WORLD_WIDTH's 62 units as a ~62px speck), zoom here is
// derived from the live viewport height so the shape's on-screen size tracks
// viewport height directly, the same way the rest of the page scales via CSS
// `vh`/`clamp()`.
//
// PERSPECTIVE_VISIBLE_WORLD_HEIGHT reproduces the vertical world-space extent
// the old perspective camera (fov 60, distance 100: 2*100*tan(30°)) showed at
// any canvas height — using it as the zoom baseline (shapeGrowth = 1)
// reproduces the shape's original on-screen size exactly; shapeGrowth (from
// the `tuning` state below, live-editable via HeroTuningPanel in dev) divides
// it down to grow the shape past that baseline.
const PERSPECTIVE_VISIBLE_WORLD_HEIGHT = 2 * 100 * Math.tan((60 / 2) * (Math.PI / 180))

// Reference viewport height (px) the +/-30% zoom clamp below is centered on.
const REFERENCE_VIEWPORT_HEIGHT_PX = 900

// On mobile, scrolling collapses/expands the browser's own address bar,
// which changes `window.innerHeight` (and fires `resize`) even though
// nothing about the actual device or window changed — reading that value
// live is what made the orb visibly "zoom" while scrolling on iPad/mobile.
// A real resize or device rotation always changes `innerWidth` too (or
// moves `innerHeight` by far more than this); a pure, small height-only
// change is the address bar animating, not a real viewport change — kept
// below and ignored by useSettledViewportHeight instead of chased.
const HEIGHT_CHANGE_IGNORE_THRESHOLD_PX = 100

// Single shared source for "the viewport height the orb's camera should
// frame against" — filters out the mobile-address-bar noise described
// above so both computeViewportZoom and CameraRig's frustum agree on the
// same settled value, instead of each reading window.innerHeight on its
// own (CameraRig used to do that directly, every frame, with no filtering
// at all — the main source of the scroll-zoom bug).
function useSettledViewportHeight(): number {
  const widthRef = useRef(typeof window !== 'undefined' ? window.innerWidth : 0)
  const [height, setHeight] = useState(() => (typeof window !== 'undefined' ? window.innerHeight : 0))
  useEffect(() => {
    const handler = () => {
      const width = window.innerWidth
      const newHeight = window.innerHeight
      const widthChanged = width !== widthRef.current
      widthRef.current = width
      setHeight(prev => (!widthChanged && Math.abs(newHeight - prev) < HEIGHT_CHANGE_IGNORE_THRESHOLD_PX ? prev : newHeight))
    }
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return height
}

// Without a ceiling, zoom scales linearly forever with the settled viewport
// height — fine near REFERENCE_VIEWPORT_HEIGHT_PX, but on a tall/large
// monitor (or a maximized window on a big display) it keeps growing well
// past where the shape still reads as proportionate. Clamped to +/-30% of
// the reference zoom so very tall or very short viewports can't run away in
// either direction; this is exactly the "large screens" case the switch to
// an orthographic camera was meant to fix.
function computeViewportZoom(shapeGrowth: number, viewportHeight: number) {
  const referenceWorldHeight = PERSPECTIVE_VISIBLE_WORLD_HEIGHT / shapeGrowth
  const referenceZoom = REFERENCE_VIEWPORT_HEIGHT_PX / referenceWorldHeight
  if (!viewportHeight) return referenceZoom
  const raw = viewportHeight / referenceWorldHeight
  return Math.min(referenceZoom * 1.3, Math.max(referenceZoom * 0.7, raw))
}

// Recomputes whenever `shapeGrowth` changes (live edits from the dev-only
// tuning panel, or the base-bucket height interpolation below) or the
// settled viewport height changes (a real resize, not mobile address-bar
// noise — see useSettledViewportHeight).
function useZoom(shapeGrowth: number, viewportHeight: number): number {
  return useMemo(() => computeViewportZoom(shapeGrowth, viewportHeight), [shapeGrowth, viewportHeight])
}

// `cameraX`/`cameraY` flip instantly whenever the active bucket (see
// useBreakpoint) changes — not just on an actual window resize, but on
// anything that changes the layout viewport width, including a scrollbar
// appearing once the page finishes laying out (common right around the
// FORM_START–FORM_DURATION window, as sections below the hero mount in).
// R3F re-applies the `camera` prop's position as a hard set whenever that
// object's identity changes, so without this, a breakpoint flip mid-
// formation reads as the whole swarm snapping sideways. Gliding
// position.x toward the target every frame turns that hard cut into a
// pan, regardless of what triggers the flip.
// `zoom` lives in the *projection* matrix, which Three.js caches and never
// recomputes on its own — a plain `camera.zoom = ...` write is invisible
// until updateProjectionMatrix() runs, and R3F's own <Canvas camera={{zoom}}>
// prop only ever writes the field (applyProps' generic "just overwrite the
// value" branch), never that follow-up call.
//
// R3F *does* call updateProjectionMatrix() on its own, but only from
// updateCamera(camera, size) — triggered whenever the <Canvas> DOM element's
// own rendered size changes, using that element's actual width/height to set
// left/right/top/bottom. On mobile, this canvas fills the whole hero
// `<section>` (`absolute inset-0`, see the wrapping div's comment) so that
// GrainientBackground — a full-canvas shader quad that ignores the camera
// entirely — keeps covering the section even as it grows past one screen to
// fit the stacked content below. But that same growth was also feeding into
// *this* camera's frustum, since R3F derives it from the canvas element's
// height: taller canvas -> taller frustum -> the swarm's vertical center
// (anchored to the canvas's own midpoint) drifts down the page in lockstep
// with whatever content pushed the section taller, instead of staying put.
//
// `camera.manual = true` (checked by R3F's updateCamera, see its source)
// opts this camera out of that entirely — CameraRig takes over the frustum
// below, computing left/right/top/bottom directly in *world units* rather
// than leaning on Three.js's own `camera.zoom` field to scale a raw-pixel
// span down. That's a deliberate departure from an earlier version of this
// fix, which set raw top/bottom asymmetrically (to anchor the top edge, see
// below) and then let `zoom` scale the span: OrthographicCamera.
// updateProjectionMatrix() re-centers the *effective* frustum around
// `(rawTop + rawBottom) / 2` on every call, without ever dividing that
// center by zoom — only the span (`(rawTop - rawBottom) / zoom`) shrinks.
// With an asymmetric raw split, that center sits far from zero, so every
// change to `zoom` (the HeroTuningPanel scale slider) relocated the visible
// window to a different, essentially arbitrary point instead of just
// resizing it around the swarm — reading as the shape jumping around and
// "growing disproportionately" rather than scaling smoothly in place.
// Folding the desired pixels-per-world-unit into how left/right/top/bottom
// are computed ourselves — and leaving `camera.zoom` fixed at 1, so Three.js
// never touches them again after this — sidesteps that re-centering
// entirely: what's set here is exactly the frustum used, no hidden step in
// between.
//
// left/right/top-minus-bottom still track the canvas's own actual per-frame
// size (`state.size`, the same possibly-grown height as everything above),
// on purpose: pixels-per-world-unit only stays equal on both axes — i.e.
// nothing looks stretched — when each axis's total span matches that axis's
// own real canvas dimension (divided by the desired scale) exactly, the
// same invariant R3F's own (now bypassed) handling relies on.
//
// The "don't drift down the page" fix is in *how the vertical span is
// split*: `top` is pinned to a fixed reference (half the real viewport
// height, scaled the same way, not the canvas's own — possibly taller —
// height), so it always lands the same distance below the canvas's top edge
// (itself pinned to the section's top). `bottom` absorbs 100% of any extra
// height instead, extending further down as the canvas grows past one
// screen. That reference only changes on a real window resize or a `zoom`
// change, never on section growth by itself, so the world point that maps
// to "just below the canvas's top edge" — where the swarm is framed — stays
// put regardless of how much extra mobile content height gets added below
// it.
//
// All of this (plus `manual` itself) is reapplied every frame here, in the
// same useFrame as the position glide, rather than in a mount/dependency-
// driven effect: R3F recreates the underlying THREE.Camera object outright
// whenever the `<Canvas camera={{...}}>` config object it's given fails a
// shallow-equality check against the previous one (see applyProps' camera-
// creation branch) — since that config is a fresh object/array literal
// every render, this can happen more than once across a single mount,
// discarding whatever an effect had set on the old instance. A stale or
// transiently-zero `state.size` at the moment such an effect fires can then
// leave the frustum degenerate (0-by-0) with nothing left to trigger a
// retry. Recomputing unconditionally every frame — cheap next to the
// particle simulation already running here — means whichever camera
// instance is current always gets a correct frustum within one frame, no
// matter how or when it was (re)created.
function CameraRig({
  targetX,
  targetY,
  zoom,
  viewportHeight,
}: {
  targetX: number
  targetY: number
  // "Pixels per world unit" the orb should render at — smoothed below via
  // `currentZoom`, the same way targetX/targetY already are, so a bucket
  // flip (desktop: a resize/scrollbar crossing a breakpoint) transitions
  // the shape's size instead of popping to it instantly. Before this, only
  // the camera's position was ever smoothed — zoom was applied as a hard,
  // immediate value every frame.
  zoom: number
  // The settled viewport height from useViewportZoom/useSettledViewportHeight
  // (filtered to ignore mobile address-bar noise) — passed in instead of
  // reading window.innerHeight directly here, which is what let that noise
  // reach the frustum on every single frame regardless of any filtering
  // upstream.
  viewportHeight: number
}) {
  const currentZoom = useRef(zoom)
  useFrame((state, delta) => {
    // state.camera is typed as the Camera union R3F ships (Perspective |
    // Orthographic, plus its own `manual` convention) — left/right/top/
    // bottom only exist on the orthographic side. Safe to assert: this rig
    // only ever mounts under the `<Canvas orthographic>` below.
    const camera = state.camera as THREE.OrthographicCamera & { manual?: boolean }
    const clampedDelta = Math.min(delta, 1 / 20)
    const smoothing = 1 - Math.pow(0.9, clampedDelta * 60)
    camera.position.x += (targetX - camera.position.x) * smoothing
    camera.position.y += (targetY - camera.position.y) * smoothing
    camera.manual = true
    // Fixed at 1 so Three.js's own zoom-driven re-centering (see above)
    // never runs — `zoom` (the prop, "pixels per world unit") is folded
    // directly into the world-unit spans below instead.
    camera.zoom = 1
    currentZoom.current += (zoom - currentZoom.current) * smoothing
    const z = currentZoom.current
    const halfWidth = state.size.width / (2 * z)
    camera.left = -halfWidth
    camera.right = halfWidth
    const referenceTop = viewportHeight / (2 * z)
    camera.top = referenceTop
    camera.bottom = referenceTop - state.size.height / z
    camera.updateProjectionMatrix()
  })
  return null
}

export function ParticleSwarm() {
  const meshRef = useRef<THREE.InstancedMesh>(null!)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const target = useMemo(() => new THREE.Vector3(), [])
  const shapePos = useMemo(() => new THREE.Vector3(), [])

  const shapeTargets = useMemo(
    () => generateSvgFillPositions(shapesSvgRaw, COUNT, SHAPE_WORLD_WIDTH),
    [],
  )
  const shapeMask = useMemo(() => createShapeMask(shapesSvgRaw, SHAPE_WORLD_WIDTH), [])

  // Each particle's current "roam point" inside the shape. Starts at its
  // assigned formation position and, once formed, wanders from there —
  // never regenerated, so the swirl-to-shape transition and the wander
  // phase share one continuous target instead of a jump between two arrays.
  const [wanderTargets] = useState(() => {
    const arr: THREE.Vector3[] = []
    for (let i = 0; i < COUNT; i++) {
      arr.push(new THREE.Vector3(shapeTargets[i * 3], shapeTargets[i * 3 + 1], shapeTargets[i * 3 + 2]))
    }
    return arr
  })

  const [positions] = useState(() => {
    const pos: THREE.Vector3[] = []
    for (let i = 0; i < COUNT; i++) {
      pos.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 100,
          (Math.random() - 0.5) * 100,
          (Math.random() - 0.5) * 100,
        ),
      )
    }
    return pos
  })

  // Full size while free-swirling; eases down to 50% only once a particle is
  // fully formed (blend reaches 1) — a separate, later transition from the
  // position move above, not tied to it. Reuses the same frame-rate-
  // independent `smoothing` factor as the position lerp below so it doesn't
  // need its own tuning constant. A ref, not useState: mutated by direct
  // index writes every frame (typed array slots aren't objects with their
  // own mutating methods the way positions[i].lerp(...) is), which is
  // exactly what refs — not state — are for.
  const scales = useRef<Float32Array>(null!)
  if (scales.current === null) scales.current = new Float32Array(COUNT).fill(1)

  // Seconds of formation progress accumulated so far, advanced at most
  // `clampedDelta` per rendered frame (see below) instead of being read
  // straight off the wall clock — a ref because it persists across frames
  // without triggering re-renders, same reasoning as `scales` above.
  const formElapsed = useRef(0)

  const material = useMemo(
    () => new THREE.MeshBasicMaterial({ color: 0xffffff, vertexColors: true }),
    [],
  )
  const geometry = useMemo(() => {
    const geo = new THREE.IcosahedronGeometry(0.25, 1)
    // InstancedMesh.setColorAt() makes the shader multiply the per-instance
    // color against the geometry's own per-vertex `color` attribute. Without
    // one, that attribute is left unbound and WebGL reads it as (0,0,0),
    // zeroing every instance to black. A neutral white attribute makes that
    // multiplication a no-op so only instanceColor drives the final color.
    const white = new Float32Array(geo.attributes.position.count * 3).fill(1)
    geo.setAttribute('color', new THREE.BufferAttribute(white, 3))
    return geo
  }, [])

  useFrame((state, delta) => {
    if (!meshRef.current) return
    const time = state.clock.getElapsedTime()
    const { scale, speed, twist, glow, chaos, layers, pulse, gravity } = PARAMS

    // Both the swirl→shape blend and the position smoothing below are
    // rate-limited by the same clamped delta instead of sampling the wall
    // clock directly — a stall (GC pause, tab backgrounded, main thread busy
    // loading the rest of the page) then just pauses the animation instead
    // of forcing it to catch up to wherever raw elapsed time says it should
    // be. Reading blend straight off `time` (the original approach) meant a
    // single long stall inside the FORM_DURATION window could jump blend by
    // however much wall-clock time had passed — e.g. a 600ms stall during a
    // 2.3s transition advances it by a quarter in one frame — which is what
    // read as the swarm freezing and then jumping straight to the formed
    // shape. Accumulating progress by clampedDelta instead makes the
    // transition itself immune to stalls, not just the position lerp.
    const clampedDelta = Math.min(delta, 1 / 20)
    if (time >= FORM_START) {
      formElapsed.current = Math.min(formElapsed.current + clampedDelta, FORM_DURATION)
    }
    const rawBlend = formElapsed.current / FORM_DURATION
    const blend = rawBlend * rawBlend * (3 - 2 * rawBlend)

    // Frame-rate-independent smoothing: a fixed lerp(target, 0.1) converges
    // once per rendered frame, so on a slow frame rate it converges far
    // slower in wall-clock time than the blend timing above assumes.
    const smoothing = 1 - Math.pow(0.9, clampedDelta * 60)

    const t = time * speed

    for (let i = 0; i < COUNT; i++) {
      const u = i / COUNT

      const id = i + 1
      const layerId = (id % 7) + 1
      const ringId = (id % 13) + 1

      const v = u * PI2
      const a = v * twist + t * 0.7 + layerId * 0.37
      const b = v * (0.5 + 0.15 * layers) - t * 0.45 + ringId * 0.21

      const s1 = Math.sin(a)
      const c1 = Math.cos(a)
      const c2 = Math.cos(b)
      const s2 = Math.sin(b)

      const fib = GOLDEN_ANGLE * id
      const hx = Math.cos(fib) * Math.sqrt(1.0 - Math.pow(1.0 - 2.0 * u, 2.0))
      const hy = 1.0 - 2.0 * u
      const hz = Math.sin(fib) * Math.sqrt(1.0 - Math.pow(1.0 - 2.0 * u, 2.0))

      const shellSpin = 0.65 + 0.25 * Math.cos(u * PI2 * 5.0 - t * 0.9)
      const wave = Math.sin(u * PI2 * 16.0 + t * pulse) * 0.5 + Math.cos(u * PI2 * 9.0 - t * 1.2) * 0.5

      const ringRadius = scale * (0.22 + 0.12 * shellSpin + 0.06 * wave)
      const tubeRadius = scale * (0.04 + 0.02 * glow + 0.03 * Math.abs(Math.sin(v * 3.0 + t)))

      const torusX = (ringRadius + tubeRadius * c2) * c1
      const torusY = tubeRadius * s2
      const torusZ = (ringRadius + tubeRadius * c2) * s1

      const helixAngle = v * twist + t * 1.1
      const helixRadius = scale * (0.18 + 0.07 * Math.sin(v * 6.0 + t * 0.5))
      const helixX = Math.cos(helixAngle) * helixRadius
      const helixY = (u - 0.5) * scale * 1.5
      const helixZ = Math.sin(helixAngle) * helixRadius

      const lattice = scale * 0.18
      const gx = ((i % 5) - 2) * lattice
      const gy = (((i / 5) | 0) % 5 - 2) * lattice * 0.8
      const gz = (((i / 25) | 0) % 5 - 2) * lattice

      const morphA = 0.5 + 0.5 * Math.sin(t * 0.55 + u * PI2 * 2.0)
      const morphB = 0.5 + 0.5 * Math.cos(t * 0.33 + u * PI2 * 3.0)
      const morphC = 0.5 + 0.5 * Math.sin(t * 0.77 + u * PI2 * 5.0)

      let x = hx * scale * 0.28 + torusX * morphA + helixX * morphB + gx * morphC * 0.35
      let y = hy * scale * 0.33 + torusY * morphB + helixY * morphC * 0.45 + gy * morphA * 0.32
      let z = hz * scale * 0.28 + torusZ * morphC + helixZ * morphA + gz * morphB * 0.35

      const swirl = 1.0 + chaos * 0.12 * Math.sin(v * 12.0 + t * 2.2)
      const vortex = 1.0 / (0.22 + Math.abs(y) * gravity * 0.08)
      const ripple = Math.sin((x + z) * 0.018 + t * 1.6) + Math.cos((x - z) * 0.02 - t * 1.1)
      const pulseField = Math.sin((x * x + y * y + z * z) * 0.0007 - t * pulse)

      x = x * swirl + Math.cos(v * 4.0 + t * 0.8) * glow * 1.2 + ripple * chaos * 0.9
      y = y * (1.0 + 0.06 * pulseField) + Math.sin(v * 3.0 - t * 1.3) * glow * 0.8
      z = z * swirl + Math.sin(v * 5.0 + t * 0.6) * glow * 1.1 - ripple * chaos * 0.7

      x += (torusX * 0.18 + helixX * 0.15) * vortex
      y += (torusY * 0.16 + helixY * 0.12) * vortex
      z += (torusZ * 0.18 + helixZ * 0.15) * vortex

      x += Math.sin(fib * 0.07 + t) * scale * 0.02
      y += Math.cos(fib * 0.05 - t * 0.7) * scale * 0.02
      z += Math.sin(fib * 0.09 + t * 0.5) * scale * 0.02

      target.set(x, y, z)

      if (blend > 0) {
        const wt = wanderTargets[i]

        // At blend=1 this sets target to exactly shapePos, discarding the
        // swirl math above entirely — the particle only ever chases its
        // wander target once formed, it doesn't keep orbiting the swirl
        // shape too. Computed up front so the arrival check below compares
        // against the same offset point the particle is actually chasing —
        // comparing against raw `wt` (pre-offset) meant positions[i] could
        // never get within WANDER_ARRIVE_DIST of it, so it never "arrived"
        // and the wander hop below never fired.
        shapePos.set(wt.x, wt.y + SHAPE_Y_OFFSET, wt.z)

        if (blend >= 1) {
          // Fully formed: hop to a new nearby point once we've arrived at
          // the current one. Checking the whole segment (not just the
          // candidate endpoint) is what actually keeps the wander bounded —
          // the SVG's rings are thin bands with gaps between them, so a hop
          // that only validates its destination could land cleanly inside a
          // *different* ring, tunnelling straight across the gap.
          if (positions[i].distanceTo(shapePos) < WANDER_ARRIVE_DIST) {
            const angle = Math.random() * PI2
            const dist = WANDER_STEP * (0.3 + 0.7 * Math.random())
            const candidateX = wt.x + Math.cos(angle) * dist
            const candidateY = wt.y + Math.sin(angle) * dist
            if (shapeMask.isSegmentInside(wt.x, wt.y, candidateX, candidateY)) {
              const nextZ = wt.z + (Math.random() - 0.5) * 1.5
              const clampedZ = Math.max(-WANDER_Z_LIMIT, Math.min(WANDER_Z_LIMIT, nextZ))
              wt.set(candidateX, candidateY, clampedZ)
              shapePos.set(candidateX, candidateY + SHAPE_Y_OFFSET, clampedZ)
            }
          }
        }

        target.lerp(shapePos, blend)
      }

      const targetScale = blend >= 1 ? FORMED_SCALE : 1
      scales.current[i] += (targetScale - scales.current[i]) * smoothing

      positions[i].lerp(target, smoothing)
      dummy.position.copy(positions[i])
      dummy.scale.setScalar(scales.current[i])
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
      meshRef.current.setColorAt(i, COLOR_PARTICLE)
    }
    meshRef.current.instanceMatrix.needsUpdate = true
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true
  })

  return <instancedMesh ref={meshRef} args={[geometry, material, COUNT]} />
}

// Number of real frames to render, hidden, before revealing the canvas.
// `gl.compile()` only warms shaders for materials already attached to the
// scene graph — it can't reach the bloom pass's internal shaders (blur,
// threshold, composite), since those render via their own manual `gl.render`
// calls outside the normal scene traversal. Letting a few real frames
// actually execute is the only way to force every shader in the pipeline
// (background + particles + all of bloom) through its one-time GPU compile,
// which is what was causing the visible hitch no matter which piece's mount
// we delayed — delaying one piece just moved the hitch to whenever *it*
// first rendered instead of removing it.
const WARMUP_FRAMES = 3

export function WarmupGate({ onReady }: { onReady: () => void }) {
  const framesRendered = useRef(0)
  const firedRef = useRef(false)

  useFrame(() => {
    if (firedRef.current) return
    framesRendered.current += 1
    if (framesRendered.current >= WARMUP_FRAMES) {
      firedRef.current = true
      onReady()
    }
  })

  return null
}

export default function PointsToShapes() {
  const { t } = useTranslation()
  const location = useLocation()
  const locale = getLocaleFromPathname(location.pathname)
  const sedesHref = locale === DEFAULT_LOCALE ? '#sedes' : `/${locale}#sedes`
  const programaHref = locale === DEFAULT_LOCALE ? '#programa' : `/${locale}#programa`
  const bucket = useBreakpoint()
  const isLargeScreen = LARGE_BUCKETS.has(bucket)
  const isLandscape = useIsLandscape()
  // See useIsLandscape above — a landscape phone at the `md` bucket needs
  // orbMdLandscape's tuning instead of orb.md, which is dialed in for a
  // portrait tablet's very different aspect ratio. Same split one bucket
  // up: orb.lg is tuned for a landscape tablet/narrow laptop (confirmed
  // live), so a large iPad in *portrait* at that same width needs its own
  // override instead — orbLgPortrait.
  const isMdLandscapePhone = bucket === 'md' && isLandscape
  const isLgPortraitTablet = bucket === 'lg' && !isLandscape
  // Needed before shiftX/shiftY/scale are picked below (the `base` bucket
  // interpolates against it), not just for zoom — see useZoom further down.
  const viewportHeight = useSettledViewportHeight()
  // Defaults own this in production (HeroTuningPanel never mounts there);
  // in development, HeroTuningPanel reports live slider edits back here.
  const [tuning, setTuning] = useState(HERO_TUNING_DEFAULTS)
  const { heroOverlayShiftPx, railMaxWidthRem, orb, orbMdLandscape, orbLgPortrait } = tuning
  // `base` spans real phones from ~500px to ~950px tall with no natural
  // step in between (confirmed live: one fixed value overlapped the
  // wordmark on some real devices and not others, all inside the same
  // <640px-wide bucket) — interpolated by height instead of a single fixed
  // value. See HERO_ORB_BASE_BY_HEIGHT's comment in heroTuning.ts for the
  // calibration points and how to add more.
  const { shiftX: cameraX, shiftY: cameraY, scale: shapeGrowth } = isMdLandscapePhone
    ? orbMdLandscape
    : isLgPortraitTablet
      ? orbLgPortrait
      : bucket === 'base'
        ? interpolateOrbByHeight(HERO_ORB_BASE_BY_HEIGHT, viewportHeight)
        : orb[bucket]
  const zoom = useZoom(shapeGrowth, viewportHeight)
  const sectionRef = useRef<HTMLElement>(null)
  const [isVisible, setIsVisible] = useState(true)
  const [canvasReady, setCanvasReady] = useState(false)

  // First-paint hitch fix: background, particles, and bloom all mount
  // together like normal, but the canvas stays invisible (opacity 0, the
  // section's flat CSS fallback color showing through underneath) until
  // WarmupGate confirms a few real frames have actually rendered — which is
  // what forces every shader in the pipeline through its one-time GPU
  // compile. Only then does the canvas fade in, already warm and already
  // mid-animation. Delaying any one piece's *mount* (tried earlier) only
  // relocated the hitch to whenever that piece first rendered instead of
  // removing it; rendering everything for real, just hidden, is what
  // actually eliminates it.

  // The particle swirl, bloom pass, and gradient shader all run their own
  // rAF loop regardless of scroll position — R3F's default `frameloop`
  // keeps rendering every frame even while this section is scrolled far out
  // of view. Left unpaused, that constant GPU/main-thread load is exactly
  // what was making the page stutter right as this section scrolled back
  // into view (the compositor had a backlog of a heavy canvas to catch up
  // on). Freezing the loop via `frameloop="never"` while off-screen removes
  // that load entirely — nothing to catch up on when it reappears.
  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  // `cameraX`/`cameraY` above come straight from `orb[bucket]` — one
  // independent {shiftX, shiftY, scale} per breakpoint (base/sm/md/lg/xl/
  // 2xl, see useBreakpoint and HeroTuningPanel), live-tunable in dev instead
  // of a hardcoded center with no knob. Done via camera position, not a CSS
  // transform on the canvas: translating the canvas element would reveal a
  // sliver of the section's raw CSS background on the opposite edge, which
  // doesn't quite match the bloom pass's post-processed render of the "same"
  // color — invisible before because the canvas always covered the section
  // edge-to-edge. Panning the camera instead keeps the canvas full-bleed, so
  // no gap is ever exposed. `rotation: [0, 0, 0]` stops R3F's default auto-
  // `lookAt(0,0,0)` for an off-axis camera, which would otherwise rotate to
  // face the origin and skew the shape instead of giving a clean parallel
  // shift. Fixed world-unit constants (not divided by zoom): the shape
  // itself is fixed in world units, so this pans onto screen by the same
  // zoom factor the shape scales by, staying in proportion to it at every
  // viewport height.

  return (
    // A hero section, not a fixed-position overlay: `position: fixed; inset: 0`
    // sizes against the live *visual* viewport, which on scroll (mobile
    // address-bar collapse/expand, in particular) changes height mid-gesture.
    // R3F's <Canvas> watches its container's size and updates the camera's
    // aspect ratio whenever it changes, so that dynamic resize reads as the
    // scene zooming in and out while scrolling. A normal section with a
    // stable height only resizes on an actual window resize, and scrolls
    // away with the page like any other section — same approach the
    // reference site (casberry.in) uses for its hero canvas.
    <section
      ref={sectionRef}
      // `min-h-[100svh] lg:h-[100svh]`: below `lg`, content stacks in normal
      // flow (see the mobile/tablet block near the end of this section) and
      // needs however much height it actually takes — `min-h` is a floor,
      // not a ceiling, so a short viewport still gets a full-bleed hero but
      // taller content isn't clipped. At `lg` and up the overlay goes back
      // to `position: absolute`, which needs the section's own height fixed
      // again (an absolutely positioned child contributes nothing to its
      // parent's auto height).
      className="min-h-[100svh] lg:h-[100svh]"
      style={{
        position: 'relative',
        background: GRADIENT_DOMINANT,
      }}
    >
      {/* Canvas wrapped in its own `absolute inset-0` div rather than relying
          on R3F's default 100%/100% sizing directly against the section: the
          section's height is no longer unconditionally fixed (see above), so
          the canvas needs an explicit positioned box to fill regardless of
          what determines the section's actual height at a given breakpoint —
          the mobile stacked content below, or the fixed `lg:h-[100svh]`. It
          deliberately covers the *whole* (possibly-grown) section rather
          than just one screen: GrainientBackground is a full-canvas shader
          quad that ignores the camera and paints across however big this
          box is, so capping it to one screen would leave a bare gap of the
          section's own flat background color below it on tall mobile
          layouts. The swarm's own camera is kept from drifting with this
          box's height a different way — see CameraRig's `camera.manual`
          effect above, which frames it from the actual viewport size
          instead of this element's. */}
      <div className="absolute inset-0">
      <Canvas
        orthographic
        // CameraRig (below) fully owns position, zoom-equivalent scale, and
        // the orthographic frustum from the first frame on, recomputing all
        // of them unconditionally every frame — so this only needs to mark
        // the camera `manual` (opting out of R3F's own size-driven
        // updateCamera, see CameraRig's comment) before that first frame
        // runs. Passing `zoom`/`position`/`rotation` here too (an earlier
        // version of this) was actively harmful: this object is a fresh
        // literal every render, and R3F recreates the underlying THREE.
        // Camera outright whenever it fails a shallow-equality check against
        // the previous one — which `zoom` (changing on every scale-slider
        // tick while dragging) made happen constantly, snapping position
        // back to whatever it was frozen at on mount each time and fighting
        // CameraRig's own smoothing for it. A plain `{ manual: true }` never
        // changes shape, so it never triggers that.
        camera={{ manual: true }}
        frameloop={isVisible ? 'always' : 'never'}
        style={{ opacity: canvasReady ? 1 : 0, transition: 'opacity 0.5s ease' }}
        // R3F's default caps device pixel ratio at 2 — full native resolution
        // on any Retina/HiDPI screen. GrainientBackground's fragment shader
        // (domain-warped noise, evaluated per pixel, every frame) then runs
        // on 4x the pixels it needs to. Capping at 1.5 cuts that back
        // noticeably while still looking sharp for a soft gradient.
        dpr={[1, 1.5]}
      >
        <CameraRig targetX={cameraX} targetY={cameraY} zoom={zoom} viewportHeight={viewportHeight} />
        {/* contrast=1 / saturation=1 are the identity values for these two
            shader passes ((c-0.5)*contrast+0.5 and mix(luma,c,saturation)) —
            0 would collapse everything to flat gray / grayscale instead.
            Identity keeps each requested hex color true wherever it's not
            blending into a neighbor. */}
        <GrainientBackground
          color1={GRADIENT_ACCENT}
          color2={GRADIENT_DOMINANT}
          color3={GRADIENT_THIRD}
          contrast={1}
          saturation={1}
        />
        <ParticleSwarm />
        {!canvasReady && <WarmupGate onReady={() => setCanvasReady(true)} />}
        {/* No OrbitControls: this is a passive hero background embedded in a
            normal scrolling page, not an interactive viewer. OrbitControls
            attaches a wheel listener to the canvas with enableZoom on by
            default — it was swallowing the page's scroll wheel input and
            dollying the 3D camera instead, which read as the whole scene
            zooming in/out while scrolling. */}
        {/* `unrealBloomPass` must be a literal direct child of `Effects`, not
            wrapped in a component: `Effects` (drei) walks its raw `children`
            with React.Children.forEach and clones each one to inject
            `attach="passes-N"` — the prop that actually registers a pass on
            the EffectComposer. Wrapping this in e.g. `<Bloom />` puts that
            `attach` prop on the wrapper element instead of on the pass
            itself, so the pass mounts into the scene but never attaches to
            the composer — it silently stops contributing to the render
            (tried this once; the glow disappeared entirely).
            The `512x512` construction size below only sets the *initial*
            render-target sizes: Effects' own resize effect calls
            `composer.setSize(size.width, size.height)` on every real canvas
            resize, which EffectComposer forwards to every attached pass
            (UnrealBloomPass.setSize ignores the constructor's `resolution`
            and just halves whatever width/height it's given for its mip
            chain) — so this already tracks the canvas's actual, current
            aspect ratio correctly without any help from this constructor
            argument. */}
        <Effects disableGamma>
          <unrealBloomPass args={[new THREE.Vector2(512, 512), 1.1, 0.4, 0.35]} />
        </Effects>
      </Canvas>
      </div>

      {/* Content overlay on top of the full-bleed Canvas — desktop/large-
          screen version. Conditionally rendered (not just CSS-hidden) on
          `isLargeScreen`, mutually exclusive with the mobile/tablet block
          further down: both versions mounting at once would double up
          HeroWordmark's halo DOM cloning/animation work and every
          SlideInText/framer-motion instance for content only one of them
          ever shows. The particle shape's on-screen footprint (fixed in 3D
          world units, so it covers proportionally more of a narrower canvas)
          only fits alongside this layout from `lg` up — hence gating on the
          same breakpoint (`isLargeScreen`, derived from useBreakpoint via
          LARGE_BUCKETS) that already drives the camera pan. */}
      {isLargeScreen && (
      <div className="pointer-events-none absolute inset-0 z-10 flex items-center">
        {/* `railMaxWidthRem` starts at 80rem — the same content rail
            Footer.tsx uses (`mx-auto max-w-7xl ... px-6 sm:px-8 lg:px-10`),
            here as a live-tunable value instead of a fixed Tailwind class
            since it kept being the actual limit hit while tuning the shift
            below. On very wide screens this caps how far right (and thus how
            far from center) the text column can drift, instead of chasing
            the physical screen edge the way `inset-0` + padding alone would.
            Padding matches this site's existing gutter scale otherwise (see
            ActividadesSection/Navbar).
            `justify-end` pins the content block to this rail's right edge,
            leaving the left area free for the orbit shape, which lands there
            via the camera pan (orb[bucket].shiftX, from `tuning` state)
            rather than a layout track — heroOverlayShiftPx nudges this whole
            overlay to approximate the same leftward shift in CSS pixels,
            unrelated to the scaling change below. */}
        <div
          className="mx-auto flex w-full justify-end px-10 xl:px-14"
          style={{ maxWidth: `${railMaxWidthRem}rem`, transform: `translateX(-${heroOverlayShiftPx}px)` }}
        >
          {/* Wordmark + text column live under one shared width instead of
              each carrying its own hand-tuned size (the wordmark was a flat
              `w-[48rem]`, independent of the text column next to it) — this
              `clamp()` is the single knob that scales the whole block
              together as the viewport changes, with the two children split
              by percentage of it. */}
          {/* `grid grid-cols-[64fr_36fr]`, not `flex` + `w-[64%]`/`w-[36%]`:
              with flex, percentage widths are computed against the full
              container width, but `gap` is added *on top* of that — 64% +
              36% + gap overflows by exactly the gap amount. Flex resolves
              that by shrinking whichever item doesn't have `shrink-0`, so
              the text column was silently narrower than its stated 36% (by
              the gap width) — which combined with "SIMPOSIO INTERNACIONAL"
              forced to one line via `whitespace-nowrap` (since removed
              below) risked real overflow near the low end of `lg`, ~1024px,
              where the gap eats a larger fraction of a narrower row. `fr`
              tracks in Grid divide the space *remaining after* gaps are
              subtracted, so 64fr/36fr always add up to exactly the
              container width regardless of gap size — a real fix for the
              first issue, but not a substitute for letting long strings wrap
              instead of forcing a single line. */}
          <div className="grid grid-cols-[64fr_36fr] items-start gap-8 xl:gap-12" style={{ width: 'clamp(40rem, 62vw, 68rem)' }}>
            {/* Headline now lives under the wordmark instead of in the text
                column to its right — it used to run there via SlideInText,
                but reads as a caption to the mark itself, not as an intro to
                the description block. `gap-6` (wider than the `gap-4` used
                elsewhere in this row) is deliberate breathing room between
                the mark and its caption.
                Row alignment is `items-start`, not `items-center`: both this
                column and the text column next to it need to start at the
                exact same height regardless of how tall either one grows —
                centering each independently (the previous approach) shifted
                a column's *top* every time content was added to it, which is
                what made the SVG and the text column drift out of vertical
                sync. Top-anchoring both means growth only ever extends a
                column downward. */}
            <div className="mt-8 flex min-w-0 flex-col gap-6">
              <HeroWordmark className="h-auto w-full lg:mt-50" />
              <SlideInText
                text={t('hero.headline')}
                delayStep={0.15}
                startDelay={HEADLINE_START_DELAY}
                className="font-mattone mt-10 text-sm leading-snug font-normal text-white uppercase md:text-base"
              />

              {/* Colaboradores/patrocinadores — una sola fila horizontal, ya
                  en blanco/claro en el propio archivo, así que se apoyan
                  directamente sobre el fondo oscuro sin tratamiento extra.
                  En `lg` la columna es más angosta que en xl/2xl (ver
                  `clamp()` de más arriba) y los tamaños originales no entran
                  en una sola línea ahí — `lg:` los achica y pasa a
                  `flex-nowrap`/`justify-start` solo en ese bucket. `gap-1`
                  (en vez de `gap-2`) libera los px que el `lg:ml-3` de TEA
                  usa para separar el par TEA/MUNA del par GobCan/Cabildo —
                  calculado al límite del ancho disponible en el peor caso de
                  `lg` (1024px, ~389px de columna): ~383px necesarios, ~6px
                  de margen — no da para separarlos más sin envolver en el
                  extremo angosto del bucket. `xl` hereda esos mismos
                  tamaños/gap de `lg` por cascada (sin `xl:` no había nada
                  que los distinguiera) — con más columna disponible ahí
                  (~477px en el peor caso de `xl`, 1280px) entran +20% más
                  grandes y con más separación (`gap-3`): ~467px necesarios,
                  ~10px de margen, medido en vivo. */}
              <div className="flex w-full flex-wrap items-center justify-between gap-6 lg:flex-nowrap lg:justify-start lg:gap-1 xl:gap-3">
                <img src={logoGobCan} alt="Gobierno de Canarias" width={556} height={322} className="h-21.75 w-auto object-contain lg:h-16 xl:h-[4.8rem]" />
                <img src={logoCabildoTenerife} alt="Cabildo de Tenerife" width={170} height={206} className="h-17.25 w-auto object-contain lg:h-12 xl:h-[3.6rem]" />
                <img src={logoTEA} alt="Tenerife Espacio de las Artes" width={473} height={237} className="h-16 w-auto object-contain lg:h-11 lg:ml-3 xl:h-[3.3rem] xl:ml-0" />
                <img src={logoMuna} alt="MUNA — Museo de la Naturaleza y el Hombre" width={640} height={169} className="h-10 w-auto object-contain lg:h-8 xl:h-[2.4rem]" />
              </div>
            </div>

            <div className="pointer-events-auto mt-14 flex min-w-0 flex-col items-start gap-5 text-white">
              <div>
                <p className="font-mattone text-base leading-snug font-bold tracking-widest text-white uppercase md:text-lg">
                  {t('hero.simposio')}
                </p>
                <p className="text-base leading-snug font-bold tracking-widest text-white uppercase md:text-lg">
                  {t('hero.dateLine')}
                  <br />
                  {t('hero.location')}
                </p>
                <img
                  src={logoPatrimonioCultural}
                  alt="Patrimonio Cultural de Canarias"
                  width={700}
                  height={350}
                  className="mt-4 h-[3.9rem] w-auto object-contain"
                />
                <p className="mt-4 text-sm leading-relaxed text-white/80 md:text-base">
                  {t('hero.description')}
                </p>
              </div>
              {/* `xl:` padding/tracking/gap más chicos: en el peor caso de
                  `xl` (1280px) la columna de texto mide ~268px y los dos
                  botones con su tamaño normal (135px + 208px + gap-4)
                  necesitaban 359px — se envolvían en dos líneas. Medido en
                  vivo. */}
              <div className="flex flex-wrap items-center gap-4 xl:gap-2">
                <a
                  href={sedesHref}
                  className="w-fit rounded-full px-6 py-2.5 font-mattone text-xs font-bold tracking-widest text-white uppercase transition-opacity hover:opacity-80 xl:px-2.5 xl:py-2 xl:text-[10px] xl:tracking-normal"
                  style={{ backgroundColor: '#f04f23' }}
                >
                  {t('hero.cta')}
                </a>
                <a
                  href={programaHref}
                  className="w-fit rounded-full border border-white/60 px-6 py-2.5 font-mattone text-xs font-bold tracking-widest text-white uppercase transition-colors hover:border-white hover:bg-white/10 xl:px-2.5 xl:py-2 xl:text-[10px] xl:tracking-normal"
                >
                  {t('hero.programCta')}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Mobile/tablet version, below `lg` — stacked instead of the
          desktop's side-by-side split, since there's no room to run the
          particle shape and this much text next to each other under
          ~1024px. Normal document flow (not `position: absolute`), which is
          what lets the section grow past `100svh` if this content needs
          more room than one screen (see the section's `min-h-[100svh]`
          above) — the canvas still shows full-bleed behind it via its own
          `absolute inset-0` wrapper, so it's not competing for layout space,
          only for visual space, which is fine since text sits on top with
          `relative z-10`. Same i18n content/order as the desktop version,
          just centered and without the `whitespace-nowrap` risk the desktop
          fix above removed — wrapping is always safe here since nothing
          shares a row with it. */}
      {!isLargeScreen && (
      <div className="relative z-10 flex flex-col items-center gap-10 px-6 py-20 text-center text-white sm:gap-12 sm:px-10 sm:py-24">
        <HeroWordmark className="mt-56 h-auto w-56 sm:mt-72 sm:w-[23.4rem] md:mt-88" />
        <SlideInText
          text={t('hero.headline')}
          delayStep={0.15}
          startDelay={HEADLINE_START_DELAY}
          className="font-mattone text-sm leading-snug font-normal uppercase sm:text-base"
        />
        <div className="-mt-6">
          <p className="font-mattone text-base leading-snug font-bold tracking-widest whitespace-nowrap uppercase sm:text-lg">
            {t('hero.simposio')}
          </p>
          <p className="text-base leading-snug font-bold tracking-widest uppercase sm:text-lg">
            {t('hero.dateLine')}
            <br />
            {t('hero.location')}
          </p>
          <img
            src={logoPatrimonioCultural}
            alt="Patrimonio Cultural de Canarias"
            width={700}
            height={350}
            className="mx-auto mt-3 h-[3.15rem] w-auto object-contain"
          />
          <p className="mt-4 text-sm leading-relaxed text-white/80 sm:text-base">
            {t('hero.description')}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <a
            href={sedesHref}
            className="w-fit rounded-full px-6 py-2.5 font-mattone text-xs font-bold tracking-widest text-white uppercase transition-opacity hover:opacity-80"
            style={{ backgroundColor: '#f04f23' }}
          >
            {t('hero.cta')}
          </a>
          <a
            href={programaHref}
            className="w-fit rounded-full border border-white/60 px-6 py-2.5 font-mattone text-xs font-bold tracking-widest text-white uppercase transition-colors hover:border-white hover:bg-white/10"
          >
            {t('hero.programCta')}
          </a>
        </div>

        {/* Colaboradores/patrocinadores — una sola fila horizontal sin wrap;
            tamaños reducidos por debajo de `sm` (y `gap-2`, no `gap-6`) son
            lo que hace que las 4 quepan en una línea. Ajustado para caber
            con margen desde 375px (los cuatro tamaños + gaps ~318px contra
            ~327px disponibles) — un teléfono de exactamente 320px (ya raro
            en 2026) puede alcanzar a envolver. `sm` propiamente tiene mucho
            más ancho disponible (~620px libres), así que ahí los tamaños son
            +20% respecto a los originales en vez de solo volver a ellos. */}
        <div className="flex flex-nowrap items-center justify-center gap-2 sm:gap-6">
          <img src={logoGobCan} alt="Gobierno de Canarias" width={556} height={322} className="h-12 w-auto object-contain sm:h-[4.2rem]" />
          <img src={logoCabildoTenerife} alt="Cabildo de Tenerife" width={170} height={206} className="h-10 w-auto object-contain sm:h-[3.3rem]" />
          <img src={logoTEA} alt="Tenerife Espacio de las Artes" width={473} height={237} className="h-9 w-auto object-contain sm:h-12" />
          <img src={logoMuna} alt="MUNA — Museo de la Naturaleza y el Hombre" width={640} height={169} className="h-7 w-auto object-contain sm:h-[2.1rem]" />
        </div>
      </div>
      )}

      {HeroTuningPanel && (
        <Suspense fallback={null}>
          <HeroTuningPanel
            onChange={setTuning}
            bucket={bucket}
            isMdLandscapePhone={isMdLandscapePhone}
            isLgPortraitTablet={isLgPortraitTablet}
          />
        </Suspense>
      )}
    </section>
  )
}
