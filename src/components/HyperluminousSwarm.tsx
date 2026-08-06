import { useRef, useMemo, useState } from 'react'
import { Canvas, useFrame, extend, type ThreeElement } from '@react-three/fiber'
import { OrbitControls, Effects } from '@react-three/drei'
import { UnrealBloomPass } from 'three-stdlib'
import * as THREE from 'three'
import { generateTextPositions } from '../lib/generateTextPositions'

extend({ UnrealBloomPass })

declare module '@react-three/fiber' {
  interface ThreeElements {
    unrealBloomPass: ThreeElement<typeof UnrealBloomPass>
  }
}

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
const COUNT = 20000
const PI2 = 6.283185307179586
const GOLDEN_ANGLE = 2.399963229728653

const TEXT_LINES = ['D']
const FORM_START = 4.0
const FORM_DURATION = 3.5

function ParticleSwarm() {
  const meshRef = useRef<THREE.InstancedMesh>(null!)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const target = useMemo(() => new THREE.Vector3(), [])
  const textPos = useMemo(() => new THREE.Vector3(), [])
  const color = useMemo(() => new THREE.Color(), [])

  const textTargets = useMemo(() => generateTextPositions(TEXT_LINES, COUNT, 260), [])

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
    const { scale, speed, twist, glow, brightness, chaos, layers, pulse, gravity } = PARAMS

    const rawBlend = Math.min(Math.max((time - FORM_START) / FORM_DURATION, 0), 1)
    const blend = rawBlend * rawBlend * (3 - 2 * rawBlend)

    // This swarm's per-particle math is heavy (torus/helix/lattice morphs,
    // dozens of trig calls) enough to noticeably drop frame rate at 20k
    // instances. A fixed lerp(target, 0.1) converges once per *frame*, so on
    // a slow frame rate it converges far slower in wall-clock time — the
    // text phase would still be mid-transition long after `blend` reaches 1.
    // Scale the factor by delta so convergence speed is frame-rate independent.
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
      const bloomPulse = 1.0 + 0.2 * Math.sin(t * pulse + u * PI2 * 3.0)

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
        textPos.set(textTargets[i * 3], textTargets[i * 3 + 1], textTargets[i * 3 + 2])
        target.lerp(textPos, blend)
      }

      const energy = 0.5 + 0.5 * Math.sin(v * 4.0 + t * 0.7) + 0.25 * Math.cos((x + y + z) * 0.01 - t)
      const hueRaw =
        0.56 +
        0.13 * Math.sin(u * PI2 * 2.0 + t * 0.25) +
        0.08 * Math.sin(v * 6.0 + pulseField) +
        0.05 * energy
      const hue = hueRaw - Math.floor(hueRaw)
      const satRaw = 0.72 + 0.18 * Math.cos(v * 5.0 - t * 0.8) + 0.08 * Math.sin(u * PI2 * 11.0 + t * 1.3)
      const sat = satRaw < 0 ? 0 : satRaw > 1 ? 1 : satRaw
      const litBase =
        0.62 +
        0.18 * Math.exp(-Math.abs(y) * 0.015) +
        0.1 * Math.sin((x * x + z * z) * 0.00035 + t * 2.0) +
        0.1 * bloomPulse
      const litRaw = litBase * brightness + glow * 0.035
      // litBase*brightness alone regularly exceeds 1.0, which pins most
      // particles at pure white (HSL lightness=1 erases hue/sat entirely)
      // and, combined with the bloom pass, washes the whole swarm into a
      // single overexposed blob. Scale into headroom below 1 so color and
      // shape stay legible.
      const lit = (litRaw < 0 ? 0 : litRaw > 1 ? 1 : litRaw) * 0.55

      color.setHSL(hue, sat, lit)

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

export default function HyperluminousSwarm() {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000' }}>
      <Canvas camera={{ position: [0, 0, 100], fov: 60 }}>
        <fog attach="fog" args={['#000000', 0.01]} />
        <ParticleSwarm />
        <OrbitControls autoRotate />
        <Effects disableGamma>
          <unrealBloomPass args={[new THREE.Vector2(512, 512), 1.1, 0.4, 0.15]} />
        </Effects>
      </Canvas>
    </div>
  )
}
