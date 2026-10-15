import { useEffect, useState } from 'react'
import { Canvas, extend, useThree, type ThreeElement } from '@react-three/fiber'
import { Effects } from '@react-three/drei'
import { UnrealBloomPass } from 'three-stdlib'
import * as THREE from 'three'
import { GrainientBackground } from '../GrainientBackground'
import { WarmupGate } from '../PointsToShapes'
import { IntroParticleSwarm } from './IntroParticleSwarm'
import { INTRO_LAYOUT_DEFAULTS, ORB_TUNING_DEFAULTS, type IntroLayout, type OrbTuning } from '../../lib/introTuning'

// The /intro page's full-bleed background: the same grainient shader + bloom
// the Home hero uses (WarmupGate is imported from PointsToShapes — reused
// as-is), minus the Home-only camera pan (CameraRig), overlay split,
// tuning-panel wiring and off-screen frameloop freeze. On /intro the canvas is
// the whole page, so it's always visible and the camera sits centered.
// The particle swarm itself is IntroParticleSwarm — a fork of
// PointsToShapes' ParticleSwarm (same shape/params) that loops its
// form/float/un-form cycle on its own clock (`orbTuning`, see
// lib/introTuning.ts) instead of forming once and staying formed forever.
const GRADIENT_ACCENT = '#9b2923'
const GRADIENT_DOMINANT = '#000000'
const GRADIENT_THIRD = '#000000'

// Reproduces the vertical world-space extent the old perspective camera
// (fov 60, distance 100) showed, used as the orthographic zoom baseline.
const PERSPECTIVE_VISIBLE_WORLD_HEIGHT = 2 * 100 * Math.tan((60 / 2) * (Math.PI / 180))
const REFERENCE_VIEWPORT_HEIGHT_PX = 900

// Posición y tamaño del orb: vienen de `layout` (IntroLayout en
// lib/introTuning.ts, ajustable desde el panel en desarrollo). La forma se
// mueve desplazando la cámara en sentido contrario (orbX −48 = cámara a
// +48, la forma a la izquierda); `orbTamano` divide la altura de mundo de
// referencia, igual que el `shapeGrowth` del Home: más grande = forma más
// grande.

extend({ UnrealBloomPass })

declare module '@react-three/fiber' {
  interface ThreeElements {
    unrealBloomPass: ThreeElement<typeof UnrealBloomPass>
  }
}

// Orthographic `zoom` (1 world unit = `zoom` CSS px) that tracks viewport
// height, clamped to ±30% of the reference so very tall/short viewports don't
// run away. Copied from PointsToShapes' useViewportZoom with shapeGrowth fixed
// at 1 (the Home default) — kept local so PointsToShapes stays a
// components-only module for Fast Refresh.
function computeZoom(growth: number, viewportHeight: number) {
  const referenceWorldHeight = PERSPECTIVE_VISIBLE_WORLD_HEIGHT / growth
  const referenceZoom = REFERENCE_VIEWPORT_HEIGHT_PX / referenceWorldHeight
  if (!viewportHeight) return referenceZoom
  const raw = viewportHeight / referenceWorldHeight
  return Math.min(referenceZoom * 1.3, Math.max(referenceZoom * 0.7, raw))
}

function useIntroZoom(growth: number) {
  const [height, setHeight] = useState(() => (typeof window === 'undefined' ? 0 : window.innerHeight))
  useEffect(() => {
    const handler = () => setHeight(window.innerHeight)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return computeZoom(growth, height)
}

// R3F solo aplica la prop `camera` del <Canvas> al crearla; para que los
// cambios de posición/tamaño (resize o panel) lleguen a la cámara ya creada
// se aplican aquí.
function CameraSync({ x, y, zoom }: { x: number; y: number; zoom: number }) {
  const get = useThree((state) => state.get)
  useEffect(() => {
    const { camera } = get()
    camera.position.x = x
    camera.position.y = y
    camera.zoom = zoom
    camera.updateProjectionMatrix()
  }, [get, x, y, zoom])
  return null
}

export function IntroCanvas({
  orbTuning = ORB_TUNING_DEFAULTS,
  layout = INTRO_LAYOUT_DEFAULTS,
}: {
  orbTuning?: OrbTuning
  layout?: IntroLayout
}) {
  const zoom = useIntroZoom(layout.orbTamano)
  const cameraX = -layout.orbX
  const cameraY = -layout.orbY
  const [ready, setReady] = useState(false)
  // El canvas en sí (y por lo tanto el fondo, GrainientBackground) se monta
  // siempre de una — solo IntroParticleSwarm (el orb) espera `appearDelay`
  // antes de montarse. Antes se retrasaba el <Canvas> entero, lo que también
  // ocultaba el fondo pausado durante esos segundos; el fondo tiene que
  // verse siempre, y solo el orb necesita su propio arranque retrasado.
  // phaseElapsed en IntroParticleSwarm sigue arrancando limpio en cero: es
  // un ref que se inicializa al montar ESE componente, no al montar el
  // canvas, así que da igual que el reloj global de R3F ya venga corriendo.
  const [orbAppeared, setOrbAppeared] = useState(false)
  useEffect(() => {
    const timer = setTimeout(() => setOrbAppeared(true), orbTuning.appearDelay * 1000)
    return () => clearTimeout(timer)
  }, [orbTuning.appearDelay])

  return (
    <div className="absolute inset-0">
      <Canvas
        orthographic
        camera={{ zoom, position: [cameraX, cameraY, 100], rotation: [0, 0, 0] }}
        // TEMPORAL — sin transición: salto instantáneo en vez de fade, para
        // que no haya ningún efecto de aparición mientras se replantea la
        // orquestación. El `ready`-gate (WarmupGate) se mantiene igual,
        // evita el flash de shaders sin compilar.
        style={{ opacity: ready ? 1 : 0 }}
        dpr={[1, 1.5]}
      >
        <GrainientBackground
          color1={GRADIENT_ACCENT}
          color2={GRADIENT_DOMINANT}
          color3={GRADIENT_THIRD}
          contrast={1}
          saturation={1}
          timeSpeed={0} // TEMPORAL — fondo pausado, sacar para reactivar el movimiento
        />
        <CameraSync x={cameraX} y={cameraY} zoom={zoom} />
        {orbAppeared && <IntroParticleSwarm orbTuning={orbTuning} />}
        {!ready && <WarmupGate onReady={() => setReady(true)} />}
        <Effects disableGamma>
          <unrealBloomPass args={[new THREE.Vector2(512, 512), 1.1, 0.4, 0.35]} />
        </Effects>
      </Canvas>
    </div>
  )
}
