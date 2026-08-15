import { useRef, useMemo, useState, useEffect } from 'react'
import { Canvas, useFrame, useThree, extend, type ThreeElement } from '@react-three/fiber'
import { Effects } from '@react-three/drei'
import { UnrealBloomPass } from 'three-stdlib'
import * as THREE from 'three'
import shapesSvgRaw from '../assets/logo diasporas patrimoniales-03.svg?raw'
import { generateSvgFillPositions } from '../lib/generateSvgFillPositions'
import { createShapeMask } from '../lib/createShapeMask'
import { FORM_START, FORM_DURATION } from '../lib/heroTiming'
import { HeroWordmark } from './HeroWordmark'

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
const SHAPE_WORLD_WIDTH = 55

// Shifts the formed shape up/down on screen without touching the wander/mask
// math (which stays in the SVG's own coordinate space) — applied only where
// the wander target becomes the render target, below. 0 = vertically
// centered; positive moves it up, negative moves it down.
const SHAPE_Y_OFFSET = 0

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

// Particles are a single fixed color for their whole lifetime — swirling or
// formed, it never changes, so there's no per-frame interpolation to do.
const COLOR_PARTICLE = new THREE.Color(0xf04f23)

// Matches Tailwind's `lg` breakpoint — the wordmark column below only shows
// from `lg` up, so the camera only needs to shift left to make room for it
// there too.
const LARGE_SCREEN_QUERY = '(min-width: 1024px)'
// The two knobs for "shift the whole hero composition left," tuned together:
// CAMERA_SHIFT_X moves the WebGL content (world units, panned via the
// camera — see the `cameraX` comment below for why), HERO_SHIFT_REM moves
// the DOM overlay (the wordmark grid) by the same visual amount in CSS
// terms. They're independent numbers, not derived from one another — the
// conversion between "world units" and "rem on screen" depends on the live
// canvas size (FOV/distance/aspect), which isn't worth tracking just to
// unify two constants that only get eyeballed against a screenshot anyway.
const CAMERA_SHIFT_X = 35
const HERO_SHIFT_REM = 4

function useIsLargeScreen() {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(LARGE_SCREEN_QUERY).matches,
  )
  useEffect(() => {
    const mq = window.matchMedia(LARGE_SCREEN_QUERY)
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return matches
}

// The bloom pass's EffectComposer doesn't preserve alpha through its final
// render, so a transparent <Canvas> over a CSS background just shows solid
// black. Setting the scene's own background color sidesteps that entirely —
// it's part of the render, not DOM compositing.
function SceneBackground({ color }: { color: string }) {
  const { scene } = useThree()
  useEffect(() => {
    // Mutating the Three.js scene imperatively is the standard R3F pattern
    // for this — `scene` is a Three.js object handle, not React state; the
    // lint rule can't tell the two apart.
    // eslint-disable-next-line react-hooks/immutability
    scene.background = new THREE.Color(color)
    return () => {
      scene.background = null
    }
  }, [scene, color])

  return null
}

function ParticleSwarm() {
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

    const rawBlend = Math.min(Math.max((time - FORM_START) / FORM_DURATION, 0), 1)
    const blend = rawBlend * rawBlend * (3 - 2 * rawBlend)

    // Frame-rate-independent smoothing: a fixed lerp(target, 0.1) converges
    // once per rendered frame, so on a slow frame rate it converges far
    // slower in wall-clock time than the blend timing above assumes.
    const smoothing = 1 - Math.pow(0.9, delta * 60)

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

      const targetScale = blend >= 1 ? 0.5 : 1
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

export default function PointsToShapes() {
  const isLargeScreen = useIsLargeScreen()
  // Shifted left only from `lg` up, matching the wordmark column below that
  // only appears at that breakpoint — on mobile/tablet the particle shape is
  // the only content, so it stays centered there. Done via camera position,
  // not a CSS transform on the canvas: translating the canvas element would
  // reveal a sliver of the section's raw CSS background on the opposite
  // edge, which doesn't quite match the bloom pass's post-processed render
  // of the "same" color — invisible before because the canvas always
  // covered the section edge-to-edge. Panning the camera instead keeps the
  // canvas full-bleed, so no gap is ever exposed. `rotation: [0, 0, 0]`
  // stops R3F's default auto-`lookAt(0,0,0)` for an off-axis camera, which
  // would otherwise rotate to face the origin and skew the shape instead of
  // giving a clean parallel shift.
  const cameraX = isLargeScreen ? CAMERA_SHIFT_X : 0

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
      style={{
        position: 'relative',
        height: '100svh',
        background: '#36200f',
      }}
    >
      <Canvas camera={{ position: [cameraX, 0, 100], rotation: [0, 0, 0], fov: 60 }}>
        <SceneBackground color="#36200f" />
        <fog attach="fog" args={['#000000', 0.01]} />
        <ParticleSwarm />
        {/* No OrbitControls: this is a passive hero background embedded in a
            normal scrolling page, not an interactive viewer. OrbitControls
            attaches a wheel listener to the canvas with enableZoom on by
            default — it was swallowing the page's scroll wheel input and
            dollying the 3D camera instead, which read as the whole scene
            zooming in/out while scrolling. */}
        <Effects disableGamma>
          <unrealBloomPass args={[new THREE.Vector2(512, 512), 1.1, 0.4, 0.35]} />
        </Effects>
      </Canvas>

      {/* Wordmark column, positioned via CSS Grid rather than flexbox with an
          empty spacer div. Flexbox has no native "start in position N"
          placement — that's why the earlier version needed a hollow spacer
          child just to push the logo rightward; Grid places an item into an
          explicit column directly, no filler element required. Only enabled
          from `lg` up: below that, the particle shape's on-screen footprint
          (fixed in 3D world units, so it covers proportionally more of a
          narrower canvas) collided with the wordmark, since neither respects
          the other's actual rendered bounds — a dedicated stacked
          mobile/tablet treatment is the deferred "adjust responsive screens
          later" pass. Padding matches this site's existing gutter scale
          (px-6/8/10, see ActividadesSection/Navbar) rather than a one-off
          hero-specific value. */}
      <div
        className="pointer-events-none absolute inset-0 z-10 hidden lg:grid lg:grid-cols-2 lg:items-center lg:px-10 xl:px-14"
        style={{ transform: `translateX(-${HERO_SHIFT_REM}rem)` }}
      >
        <HeroWordmark className="col-start-2 h-auto w-lg justify-self-start" />
      </div>
    </section>
  )
}
