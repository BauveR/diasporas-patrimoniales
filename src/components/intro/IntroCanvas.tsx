import { useEffect, useState } from 'react'
import { Canvas, extend, type ThreeElement } from '@react-three/fiber'
import { Effects } from '@react-three/drei'
import { UnrealBloomPass } from 'three-stdlib'
import * as THREE from 'three'
import { GrainientBackground } from '../GrainientBackground'
import { WarmupGate } from '../PointsToShapes'
import { IntroParticleSwarm } from './IntroParticleSwarm'

// The /intro page's full-bleed background: the same grainient shader + bloom
// the Home hero uses (WarmupGate is imported from PointsToShapes — reused
// as-is), minus the Home-only camera pan (CameraRig), overlay split,
// tuning-panel wiring and off-screen frameloop freeze. On /intro the canvas is
// the whole page, so it's always visible and the camera sits centered.
// The particle swarm itself is IntroParticleSwarm — a fork of
// PointsToShapes' ParticleSwarm (same shape/params) that loops its
// form/float/un-form cycle to match `cycleDuration` instead of forming once
// and staying formed forever.
const GRADIENT_ACCENT = '#9b2923'
const GRADIENT_DOMINANT = '#000000'
const GRADIENT_THIRD = '#000000'

// Reproduces the vertical world-space extent the old perspective camera
// (fov 60, distance 100) showed, used as the orthographic zoom baseline.
const PERSPECTIVE_VISIBLE_WORLD_HEIGHT = 2 * 100 * Math.tan((60 / 2) * (Math.PI / 180))
const REFERENCE_VIEWPORT_HEIGHT_PX = 900

// Shifts the particle shape left on screen by panning the camera right along
// +x (world units — same axis Home's CameraRig uses, where 62 pushes it fully
// into the left half). Static here, no pan animation: /intro has no
// breakpoint flip to glide between. Raise to move the shape further left, 0 to
// re-center.
const CAMERA_SHIFT_X = 48

// Grows the particle shape past its baseline on-screen size (same knob as
// Home's `shapeGrowth`: it divides the reference world height, so a bigger
// number = bigger shape). 1 = baseline, 1.1 = +10%.
const SHAPE_GROWTH = 1.1

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
function computeZoom() {
  const referenceWorldHeight = PERSPECTIVE_VISIBLE_WORLD_HEIGHT / SHAPE_GROWTH
  const referenceZoom = REFERENCE_VIEWPORT_HEIGHT_PX / referenceWorldHeight
  if (typeof window === 'undefined') return referenceZoom
  const raw = window.innerHeight / referenceWorldHeight
  return Math.min(referenceZoom * 1.3, Math.max(referenceZoom * 0.7, raw))
}

function useIntroZoom() {
  const [zoom, setZoom] = useState(computeZoom)
  useEffect(() => {
    const handler = () => setZoom(computeZoom())
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return zoom
}

export function IntroCanvas({ cycleDuration }: { cycleDuration?: number }) {
  const zoom = useIntroZoom()
  const [ready, setReady] = useState(false)

  return (
    <div className="absolute inset-0">
      <Canvas
        orthographic
        camera={{ zoom, position: [CAMERA_SHIFT_X, 0, 100], rotation: [0, 0, 0] }}
        style={{ opacity: ready ? 1 : 0, transition: 'opacity 0.5s ease' }}
        dpr={[1, 1.5]}
      >
        <GrainientBackground
          color1={GRADIENT_ACCENT}
          color2={GRADIENT_DOMINANT}
          color3={GRADIENT_THIRD}
          contrast={1}
          saturation={1}
        />
        <IntroParticleSwarm cycleDuration={cycleDuration} />
        {!ready && <WarmupGate onReady={() => setReady(true)} />}
        <Effects disableGamma>
          <unrealBloomPass args={[new THREE.Vector2(512, 512), 1.1, 0.4, 0.35]} />
        </Effects>
      </Canvas>
    </div>
  )
}
