import { useRef, useMemo, useState } from 'react'
import { Canvas, useFrame, extend, type ThreeElement } from '@react-three/fiber'
import { OrbitControls, Effects } from '@react-three/drei'
import { UnrealBloomPass } from 'three-stdlib'
import * as THREE from 'three'
import pointsSvgRaw from '../assets/diasporas patrimoniales-02.svg?raw'
import shapesSvgRaw from '../assets/diasporas patrimoniales-03.svg?raw'
import { parseSvgPaths } from '../lib/parseSvgPaths'
import { generateSvgFillPositions } from '../lib/generateSvgFillPositions'
import { createShapeMask } from '../lib/createShapeMask'

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

// The particle count comes from however many points the source SVG has, not
// a fixed number — trim this (e.g. `ds.length / 2`) if the swarm reads as
// too dense once rendered.
const COUNT = parseSvgPaths(pointsSvgRaw).ds.length

const FORM_START = 4.0
const FORM_DURATION = 3.5

// World-space width the shape SVG is scaled to — shared between
// generateSvgFillPositions (initial formation targets) and createShapeMask
// (the ongoing wander bounds check), so both agree on the same mapping.
const SHAPE_WORLD_WIDTH = 50

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

// Particles start as a blue/orange mix and fade to white as they settle —
// driven by the same `blend` that morphs the swirl into the shape, so color
// and position land together.
const COLOR_BLUE = new THREE.Color(0x3b82f6)
const COLOR_ORANGE = new THREE.Color(0xf97316)
const COLOR_WHITE = new THREE.Color(0xffffff)

function ParticleSwarm() {
  const meshRef = useRef<THREE.InstancedMesh>(null!)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const target = useMemo(() => new THREE.Vector3(), [])
  const shapePos = useMemo(() => new THREE.Vector3(), [])
  const color = useMemo(() => new THREE.Color(), [])

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

  // Each particle keeps one fixed blue-or-orange base color for its whole
  // lifetime (assigned randomly, not by index, so the swirl doesn't read as
  // two visibly separate halves).
  const [baseColors] = useState(() => {
    const arr: THREE.Color[] = []
    for (let i = 0; i < COUNT; i++) {
      arr.push((Math.random() < 0.5 ? COLOR_BLUE : COLOR_ORANGE).clone())
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

        if (blend >= 1) {
          // Fully formed: hop to a new nearby point once we've arrived at
          // the current one. Checking the whole segment (not just the
          // candidate endpoint) is what actually keeps the wander bounded —
          // the SVG's rings are thin bands with gaps between them, so a hop
          // that only validates its destination could land cleanly inside a
          // *different* ring, tunnelling straight across the gap.
          if (positions[i].distanceTo(wt) < WANDER_ARRIVE_DIST) {
            const angle = Math.random() * PI2
            const dist = WANDER_STEP * (0.3 + 0.7 * Math.random())
            const candidateX = wt.x + Math.cos(angle) * dist
            const candidateY = wt.y + Math.sin(angle) * dist
            if (shapeMask.isSegmentInside(wt.x, wt.y, candidateX, candidateY)) {
              const nextZ = wt.z + (Math.random() - 0.5) * 1.5
              const clampedZ = Math.max(-WANDER_Z_LIMIT, Math.min(WANDER_Z_LIMIT, nextZ))
              wt.set(candidateX, candidateY, clampedZ)
            }
          }
        }

        // At blend=1 this sets target to exactly wt, discarding the swirl
        // math above entirely — the particle only ever chases its wander
        // target once formed, it doesn't keep orbiting the swirl shape too.
        shapePos.copy(wt)
        target.lerp(shapePos, blend)
      }

      color.copy(baseColors[i]).lerp(COLOR_WHITE, blend)

      positions[i].lerp(target, smoothing)
      dummy.position.copy(positions[i])
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
      meshRef.current.setColorAt(i, color)
    }
    meshRef.current.instanceMatrix.needsUpdate = true
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true
  })

  return <instancedMesh ref={meshRef} args={[geometry, material, COUNT]} />
}

export default function PointsToShapes() {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000' }}>
      <Canvas camera={{ position: [0, 0, 100], fov: 60 }}>
        <fog attach="fog" args={['#000000', 0.01]} />
        <ParticleSwarm />
        {/* No autoRotate: once particles settle into the SVG shapes they
            should read exactly as the flat SVG does, not stop at whatever
            angle autoRotate happened to be at. Manual orbit still works. */}
        <OrbitControls autoRotate={false} />
        <Effects disableGamma>
          <unrealBloomPass args={[new THREE.Vector2(512, 512), 1.1, 0.4, 0.15]} />
        </Effects>
      </Canvas>
    </div>
  )
}
