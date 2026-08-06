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

const PARAMS = { radius: 120, spin: 2.5, warp: 1.2, thickness: 10 }
const COUNT = 20000
const GOLDEN_ANGLE = 2.399963229728653

const TEXT_LINES = ['DIÁSPORAS', 'PATRIMONIALES']
const FORM_START = 4.0
const FORM_DURATION = 3.5

function ParticleSwarm() {
  const meshRef = useRef<THREE.InstancedMesh>(null!)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const target = useMemo(() => new THREE.Vector3(), [])
  const textPos = useMemo(() => new THREE.Vector3(), [])
  const color = useMemo(() => new THREE.Color(), [])

  const textTargets = useMemo(() => generateTextPositions(TEXT_LINES, COUNT, 140), [])

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

  useFrame((state) => {
    if (!meshRef.current) return
    const time = state.clock.getElapsedTime()
    const { radius, spin, warp, thickness } = PARAMS

    const rawBlend = Math.min(Math.max((time - FORM_START) / FORM_DURATION, 0), 1)
    const blend = rawBlend * rawBlend * (3 - 2 * rawBlend)

    for (let i = 0; i < COUNT; i++) {
      const u = (i + 0.5) / COUNT
      const r = radius * (0.08 + 0.92 * Math.sqrt(u))
      const a = GOLDEN_ANGLE * i + time * spin

      const pull = 1.0 / (1.0 + 0.025 * r)
      const bend = warp * pull * 2.0

      const ca = Math.cos(a + bend)
      const sa = Math.sin(a + bend)

      const x = r * ca
      const y = thickness * pull * Math.sin(a * 4.0 + time * 1.5)
      const z = r * sa

      target.set(x, y, z)

      if (blend > 0) {
        textPos.set(textTargets[i * 3], textTargets[i * 3 + 1], textTargets[i * 3 + 2])
        target.lerp(textPos, blend)
      }

      const glow = 1.0 - pull
      const hue = 0.08 + 0.12 * glow
      const sat = 0.9 - 0.5 * pull
      const light = 0.02 + 0.72 * glow * glow
      color.setHSL(hue, sat, light)

      positions[i].lerp(target, 0.1)
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

export default function AccretionBlackHole() {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000' }}>
      <Canvas camera={{ position: [0, 0, 100], fov: 60 }}>
        <fog attach="fog" args={['#000000', 0.01]} />
        <ParticleSwarm />
        <OrbitControls autoRotate />
        <Effects disableGamma>
          <unrealBloomPass args={[new THREE.Vector2(512, 512), 1.8, 0.4, 0]} />
        </Effects>
      </Canvas>
    </div>
  )
}
