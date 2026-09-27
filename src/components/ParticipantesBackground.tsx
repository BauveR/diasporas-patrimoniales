import { useRef, useMemo, useState, useEffect } from 'react'
import { Canvas, useFrame, extend, type ThreeElement } from '@react-three/fiber'
import { Effects } from '@react-three/drei'
import { UnrealBloomPass } from 'three-stdlib'
import * as THREE from 'three'

// Reemplaza el fondo anterior (puntos flotando en canvas 2D) por un enjambre
// WebGL — mismo lugar, mismo rol (detrás de la grilla de Participantes),
// pero un efecto bastante más protagonista, a pedido. Basado en un snippet
// de una herramienta de live-coding (particles.casberry.in): acá se porta a
// React Three Fiber, mismo patrón que ya usa el swarm del hero
// (PointsToShapes.tsx — Canvas + InstancedMesh + Effects/unrealBloomPass),
// en vez del Three.js imperativo original, y se corrigen 2 bugs reales que
// traía:
// - El material no tenía `vertexColors: true`. Sin eso,
//   InstancedMesh.setColorAt() no tiene nada contra lo que multiplicar y la
//   escena renderiza blanco liso — el gradiente de color que calcula el
//   loop de abajo nunca se veía. Mismo fix que ya documenta el geometry de
//   PointsToShapes.tsx: un atributo de color por vértice neutro (blanco).
// - `dispose()` no cancelaba el loop de `requestAnimationFrame` — quedaba
//   corriendo para siempre incluso desmontado, intentando dibujar sobre
//   geometría ya liberada. R3F resuelve esto solo (el propio <Canvas>
//   cancela su loop al desmontar), así que ya no hace falta un dispose()
//   manual.
extend({ UnrealBloomPass })

declare module '@react-three/fiber' {
  interface ThreeElements {
    unrealBloomPass: ThreeElement<typeof UnrealBloomPass>
  }
}

// El snippet original pedía 20 000 partículas — el propio swarm del hero
// (protagonista de toda la página, con el mismo bloom) usa ~1270
// (PointsToShapes.tsx, COUNT). Esta sección no es el hero, así que se
// mantiene en ese mismo orden de magnitud en vez de 15x más: son 20 000
// matrices de instancia recalculadas a mano (seno/coseno/raíz, sin shader
// de cómputo) cada frame, un costo de CPU real en un teléfono. Subido de
// 1800 a 2600 tras el primer pase — con el SCALE/cámara/niebla originales
// la mayoría caía fuera de cuadro o completamente tapada por la niebla, así
// que "se veían pocas" no era realmente por el conteo.
const COUNT = 2600

// Valores efectivos del snippet original: traía un panel de controles en
// vivo (addControl(id, label, min, max, default)) que en este sitio no
// existe — cada llamada resolvía contra un objeto PARAMS fijo si la clave
// estaba presente ahí (y las 7 lo estaban), así que el "default" de cada
// llamada nunca se usaba en la práctica. Estos eran esos valores ya
// resueltos. SCALE se recorta de 196.2 a 130: a fov 60 y cámara a z=100, el
// semiancho visible en el plano de las partículas es de ~58 unidades —
// con SCALE 196 casi toda la "tela" caía fuera del cuadro sin importar
// cuántas partículas hubiera. FOV sube a 85 (ver <Canvas> más abajo) en vez
// de alejar la cámara, para que las partículas visibles no encojan por
// distancia.
const SCALE = 130
const FREQ = 6
const AMP = 20
const SPEED = 0.76
const WELLS = 0.76
const PULL = 20
const TWIST = 0

// Los 2 colores pedidos, en vez del degradé HSL arcoíris del snippet
// original — mismo esquema (color de acento + un rojo institucional en el
// 12% de las partículas) que ya usaba la versión anterior de este mismo
// fondo (canvas 2D, ACCENT_ORANGE/BRAND_RED/ACCENT_RATIO), así que el
// cambio de tecnología no le cambia la paleta a la sección.
const COLOR_A = new THREE.Color('#e99741')
const COLOR_B = new THREE.Color('#9a2923')
const COLOR_B_RATIO = 0.12

function Swarm() {
  const meshRef = useRef<THREE.InstancedMesh>(null!)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const target = useMemo(() => new THREE.Vector3(), [])

  const [positions] = useState(() => {
    const arr: THREE.Vector3[] = []
    for (let i = 0; i < COUNT; i++) {
      arr.push(new THREE.Vector3(
        (Math.random() - 0.5) * 100,
        (Math.random() - 0.5) * 100,
        (Math.random() - 0.5) * 100,
      ))
    }
    return arr
  })

  const material = useMemo(
    () => new THREE.MeshBasicMaterial({ color: 0xffffff, vertexColors: true }),
    [],
  )
  const geometry = useMemo(() => {
    // Esfera, no tetraedro (el snippet original): ninguna instancia rota —
    // `dummy` acá abajo solo toca `.position`, nunca `.rotation` — así que
    // un tetraedro se ve como un triángulo desde un ángulo fijo en vez de
    // una forma reconocible desde cualquier lado. Una esfera se ve redonda
    // sin importar la orientación, sin necesidad de billboarding.
    const geo = new THREE.SphereGeometry(0.25, 8, 8)
    const white = new Float32Array(geo.attributes.position.count * 3).fill(1)
    geo.setAttribute('color', new THREE.BufferAttribute(white, 3))
    return geo
  }, [])

  // El color de cada partícula es fijo (COLOR_A la mayoría, COLOR_B en el
  // 12%) — se resuelve una sola vez acá, no en el loop de useFrame de abajo:
  // antes se recalculaba un HSL por partícula en cada frame sin necesidad
  // (el color nunca dependía de nada que cambiara cuadro a cuadro más que
  // el tiempo, y ya no hace falta ni eso), así que sacarlo del loop también
  // reduce el trabajo de CPU por frame.
  useEffect(() => {
    if (!meshRef.current) return
    for (let i = 0; i < COUNT; i++) {
      meshRef.current.setColorAt(i, Math.random() < COLOR_B_RATIO ? COLOR_B : COLOR_A)
    }
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true
  }, [])

  // Tela de espacio-tiempo deformándose bajo 2 pozos de gravedad que orbitan
  // — cada partícula tiene una posición fija en la "tela" (u, v, un hash
  // pseudoaleatorio de su índice) y el pozo dobla esa tela en Z según qué
  // tan cerca esté. Portado 1:1 desde el snippet original, solo con
  // this.positions/this.dummy/this.mesh reemplazados por los refs de arriba.
  useFrame((state) => {
    if (!meshRef.current) return
    const t = state.clock.getElapsedTime() * SPEED

    for (let i = 0; i < COUNT; i++) {
      const u = (Math.sin(i * 12.9898) * 43758.5453) % 1.0
      const v = (Math.sin(i * 78.233) * 12345.6789) % 1.0

      const x = (u * 2.0 - 1.0) * SCALE
      const y = (v * 2.0 - 1.0) * SCALE

      const wave = Math.sin(x * 0.02 * FREQ + t) + Math.sin(y * 0.02 * FREQ - t * 0.8)
      let z = wave * AMP

      const w1x = Math.sin(t * 0.3) * SCALE * 0.4
      const w1y = Math.cos(t * 0.2) * SCALE * 0.4
      const w2x = Math.sin(t * 0.5 + 2.0) * SCALE * 0.3
      const w2y = Math.cos(t * 0.4 + 1.0) * SCALE * 0.3

      const dx1 = x - w1x
      const dy1 = y - w1y
      const d1 = Math.sqrt(dx1 * dx1 + dy1 * dy1 + 4.0)

      const dx2 = x - w2x
      const dy2 = y - w2y
      const d2 = Math.sqrt(dx2 * dx2 + dy2 * dy2 + 4.0)

      const bend1 = -PULL / d1
      const bend2 = -PULL / d2
      z += (bend1 + bend2) * (WELLS > 1.0 ? 1.0 : WELLS * 0.5)

      const ang = TWIST * (bend1 - bend2)
      const cosA = Math.cos(ang)
      const sinA = Math.sin(ang)
      const tx = x * cosA - y * sinA
      const ty = x * sinA + y * cosA

      target.set(tx, ty, z)

      positions[i].lerp(target, 0.1)
      dummy.position.copy(positions[i])
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    }
    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return <instancedMesh ref={meshRef} args={[geometry, material, COUNT]} />
}

export function ParticipantesBackground() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  // Una vez `true`, se queda así para siempre — controla si el <Canvas>
  // llega a montarse. Antes se montaba (y creaba su contexto WebGL) apenas
  // cargaba la página, aunque el usuario siguiera mirando el hero arriba
  // del todo; ahora espera a que la sección esté por entrar en pantalla de
  // verdad. `isVisible` (abajo) sigue controlando el frameloop una vez ya
  // montado, para pausar/reanudar sin volver a crear el contexto cada vez.
  const [hasBeenVisible, setHasBeenVisible] = useState(false)
  // Mismo criterio que la versión anterior de este fondo: sin animar si el
  // sistema pide menos movimiento — acá eso significa congelar el
  // frameloop de R3F en vez de parar un requestAnimationFrame manual.
  const [reducedMotion, setReducedMotion] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    // threshold 0 + freeze total del frameloop (no solo dejar de dibujar)
    // cuando la sección sale de pantalla — mismo motivo que documenta
    // PointsToShapes.tsx: sin esto la carga de GPU/CPU sigue mientras se
    // scrollea el resto de la página, y se nota como un tirón al volver.
    // rootMargin adelanta el disparo ~150px antes de que la sección entre
    // de verdad, para que el montaje inicial del Canvas no se note como un
    // pop-in a mitad de scroll.
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting)
        if (entry.isIntersecting) setHasBeenVisible(true)
      },
      { threshold: 0, rootMargin: '150px 0px' },
    )
    observer.observe(el)

    const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mql.addEventListener('change', handler)

    return () => {
      observer.disconnect()
      mql.removeEventListener('change', handler)
    }
  }, [])

  return (
    <div ref={containerRef} aria-hidden="true" className="pointer-events-none absolute inset-0">
      {hasBeenVisible && (
      <Canvas
        // fov 85, no 60: a distancia fija (z=100) un fov más ancho muestra
        // más del ancho de la "tela" sin achicar las partículas alejando la
        // cámara. Con SCALE 130 y fov 60 casi toda quedaba fuera de cuadro.
        camera={{ fov: 85, position: [0, 0, 100], near: 0.1, far: 2000 }}
        frameloop={isVisible && !reducedMotion ? 'always' : 'never'}
        // R3F cubre 2x por defecto; igual que el fog/bloom del hero, se
        // acota un poco más porque esto corre detrás de contenido real, no
        // es la única cosa en pantalla.
        dpr={[1, 1.5]}
      >
        {/* Densidad bajada de 0.01 a 0.0035: la niebla es exponencial en la
            distancia real a la cámara, no en x/y — con SCALE 196 (antes) las
            partículas a los costados quedaban a >200 unidades de distancia
            real pese a estar "cerca" en el plano XY, y a densidad 0.01 eso
            las apagaba casi por completo. Con menos densidad la profundidad
            sigue notándose (las más lejanas se atenúan) sin comerse la
            mayoría del campo. */}
        <fogExp2 attach="fog" args={[0x000000, 0.0035]} />
        <Swarm />
        {/* `unrealBloomPass` como hijo directo de `Effects`, no envuelto en
            un componente propio — ver el comentario largo sobre esto mismo
            en PointsToShapes.tsx: `Effects` (drei) clona sus children
            directos para inyectarles `attach="passes-N"`, y ese prop se
            pierde si el pass no es un hijo literal. */}
        <Effects disableGamma>
          <unrealBloomPass args={[new THREE.Vector2(512, 512), 1.8, 0.4, 0]} />
        </Effects>
      </Canvas>
      )}
    </div>
  )
}
