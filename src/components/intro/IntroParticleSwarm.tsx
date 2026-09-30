import { useRef, useMemo, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import shapesSvgRaw from '../../assets/orbit diasporas patrimoniales-03.svg?raw'
import { generateSvgFillPositions } from '../../lib/generateSvgFillPositions'
import { createShapeMask } from '../../lib/createShapeMask'
import {
  ORB_TUNING_DEFAULTS,
  getIntroSuperCycle,
  INTRO_ORB_DISAPPEAR_SECONDS,
  type OrbTuning,
} from '../../lib/introTuning'

// A fork of PointsToShapes' ParticleSwarm — same shape, same swirl math,
// copied rather than shared so /intro can make it loop on its own clock
// without touching Home's hero (which forms once and stays formed forever).
// The one real difference: `orbTuning` (formStart/formDuration/floatDuration,
// see lib/introTuning.ts) is how long the swarm stays formed and floating —
// it forms, floats for `floatDuration`, then un-forms back into the free
// swirl and re-forms, instead of settling into the shape a single time at
// page load and staying that way forever. Independent from the wordmark's
// own language-swap timeline — the two used to be coupled (this floated for
// exactly one ES→FR→PT→EN→ES lap), now they run on separate clocks.
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

const BASE_POINTS = 535
const EXTRA_POINTS = 100
const COUNT = (BASE_POINTS + EXTRA_POINTS) * 2

const SHAPE_WORLD_WIDTH = 62
const SHAPE_Y_OFFSET = 10

const WANDER_STEP = 1.5
const WANDER_ARRIVE_DIST = 0.4
const WANDER_Z_LIMIT = (SHAPE_WORLD_WIDTH * 0.02) / 2

const FORMED_SCALE = 0.9
const COLOR_PARTICLE = new THREE.Color(0xffffff)

export function IntroParticleSwarm({ orbTuning = ORB_TUNING_DEFAULTS }: { orbTuning?: OrbTuning }) {
  const meshRef = useRef<THREE.InstancedMesh>(null!)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const target = useMemo(() => new THREE.Vector3(), [])
  const shapePos = useMemo(() => new THREE.Vector3(), [])

  const shapeTargets = useMemo(
    () => generateSvgFillPositions(shapesSvgRaw, COUNT, SHAPE_WORLD_WIDTH),
    [],
  )
  const shapeMask = useMemo(() => createShapeMask(shapesSvgRaw, SHAPE_WORLD_WIDTH), [])

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

  const scales = useRef<Float32Array>(null!)
  if (scales.current === null) scales.current = new Float32Array(COUNT).fill(1)

  // Seconds into the current form/float/un-form cycle, wrapped to
  // `cycleDuration` below instead of climbing forever — that's the whole
  // difference from PointsToShapes' version. Advanced by clamped delta, not
  // read off the wall clock, for the same stall-immunity reason as there.
  const phaseElapsed = useRef(0)

  const material = useMemo(
    // depthWrite: false — sin esto, las instancias semitransparentes siguen
    // escribiendo profundidad, y con tantas partículas superpuestas eso se
    // ve como parpadeo/artefactos raros apenas opacity empieza a bajar de 1.
    () => new THREE.MeshBasicMaterial({
      color: 0xffffff,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
    }),
    [],
  )
  const geometry = useMemo(() => {
    const geo = new THREE.IcosahedronGeometry(0.25, 1)
    const white = new Float32Array(geo.attributes.position.count * 3).fill(1)
    geo.setAttribute('color', new THREE.BufferAttribute(white, 3))
    return geo
  }, [])

  // Mutates `material` in place each frame (opacity fade below) — the
  // standard R3F pattern, see the comment at that line.
  // eslint-disable-next-line react-hooks/immutability
  useFrame((state, delta) => {
    if (!meshRef.current) return
    const time = state.clock.getElapsedTime()
    const { scale, speed, twist, glow, chaos, layers, pulse, gravity } = PARAMS
    const { formStart, formDuration, floatDuration } = orbTuning

    const clampedDelta = Math.min(delta, 1 / 20)

    // The swarm floats formed for the entire `floatDuration` — forming and
    // un-forming are extra time on top of that, not carved out of it. Full
    // particle loop: formStart (swirl) + formDuration (forming) +
    // floatDuration (floating) + formDuration (un-forming, same speed as
    // forming).
    const formEnd = formStart + formDuration
    const floatEnd = formEnd + floatDuration
    const totalCycle = floatEnd + formDuration
    phaseElapsed.current = (phaseElapsed.current + clampedDelta) % totalCycle
    const p = phaseElapsed.current
    let rawBlend: number
    if (p < formStart) {
      rawBlend = 0 // free swirl
    } else if (p < formEnd) {
      rawBlend = (p - formStart) / formDuration // forming
    } else if (p < floatEnd) {
      rawBlend = 1 // formed, floating/wandering — lasts the full floatDuration
    } else {
      rawBlend = 1 - (p - floatEnd) / formDuration // un-forming, back to swirl
    }
    const blend = rawBlend * rawBlend * (3 - 2 * rawBlend)

    // Últimos INTRO_ORB_DISAPPEAR_SECONDS del superciclo: el material se
    // desvanece a 0 (lineal) — al envolver de nuevo a 0, vuelve a opacity 1
    // de un corte (mismo criterio que la aparición inicial: sin fade al
    // aparecer, solo al desaparecer).
    // `state.clock` (no un ref acumulado desde el montaje de ESTE
    // componente) — arranca cuando monta el <Canvas> (IntroCanvas.tsx, sin
    // delay), el mismo instante t=0 que usan las animaciones CSS del
    // wordmark/badge/franjas (IntroCycleFade, siempre montados desde el
    // load). Usar un acumulador propio acá los desincronizaba por
    // exactamente `appearDelay` segundos — el desfase que hacía que el
    // final se empalmara con el inicio del siguiente ciclo.
    const superCycle = getIntroSuperCycle(orbTuning)
    const superElapsed = time % superCycle
    // Hueco de `appearDelay` segundos DESPUÉS de que el superciclo se
    // reinicia, antes de que vuelva a aparecer — sin esto, opacity llegaba a
    // 0 justo en el instante en que el ciclo corto (phaseElapsed) también
    // arrancaba de nuevo, así que se veía re-aparecer casi de inmediato, sin
    // ningún hueco real en blanco. Reutiliza el mismo valor que ya usa para
    // su primera aparición (mount delay en IntroCanvas.tsx) — en el primer
    // ciclo este hueco ya queda cubierto por el propio delay de montaje.
    let opacity: number
    if (superElapsed < orbTuning.appearDelay) {
      opacity = 0
    } else {
      const timeIntoDisappear = superElapsed - (superCycle - INTRO_ORB_DISAPPEAR_SECONDS)
      opacity = timeIntoDisappear > 0 ? Math.max(0, 1 - timeIntoDisappear / INTRO_ORB_DISAPPEAR_SECONDS) : 1
    }
    // `material` is a useMemo'd Three.js object, not a ref — same pattern as
    // GrainientBackground.tsx's uniform mutations, which need the same
    // disable: mutating it in place each frame is the standard R3F way to
    // drive a material from a value computed in useFrame.
    // eslint-disable-next-line react-hooks/immutability
    material.opacity = opacity

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
        shapePos.set(wt.x, wt.y + SHAPE_Y_OFFSET, wt.z)

        if (blend >= 1) {
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
