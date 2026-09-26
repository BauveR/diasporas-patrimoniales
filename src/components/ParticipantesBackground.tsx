import { useEffect, useRef } from 'react'

// Fondo liviano de puntos flotando, sobre canvas 2D (sin WebGL, sin
// dependencias nuevas) — pensado para vivir detrás de la grilla de
// Participantes como un detalle sutil, no como protagonista: opacidad baja,
// deriva lenta. Mismo criterio de performance que el enjambre de partículas
// del hero (PointsToShapes.tsx): el loop de animación se detiene por
// completo (no solo deja de dibujar) cuando la sección sale de pantalla, y
// respeta prefers-reduced-motion dibujando un único frame estático en vez
// de animar.
const PARTICLE_COUNT = 900
// px por frame a ~60fps — deliberadamente muy lento, es un fondo, no debe
// competir por atención con las tarjetas de encima.
const SPEED = 0.15
const ACCENT_ORANGE = '233, 151, 65' // #e99741
const BRAND_RED = '155, 41, 35' // #9b2923, el mismo rojo teja del navbar
// Fracción de puntos que usan el rojo institucional en vez del naranja de
// acento — un segundo color puntual, no una lluvia pareja de los dos.
const ACCENT_RATIO = 0.12

// 4 tamaños fijos (no un radio continuo al azar) para que se note la
// variedad como algo deliberado — más chicos que grandes, como si los
// grandes estuvieran "más cerca": da una sensación de profundidad sin
// necesitar perspectiva real. Los pesos suman 1 (cada uno es la probabilidad
// de que un punto dado caiga en ese tamaño).
const SIZE_TIERS = [
  { radius: 1.2, weight: 0.5 },
  { radius: 2.5, weight: 0.3 },
  { radius: 4.5, weight: 0.13 },
  { radius: 7, weight: 0.07 },
]

function pickSizeTier(): { radius: number; weight: number } {
  const roll = Math.random()
  let acc = 0
  for (const tier of SIZE_TIERS) {
    acc += tier.weight
    if (roll <= acc) return tier
  }
  return SIZE_TIERS[SIZE_TIERS.length - 1]
}

type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  opacity: number
  accent: boolean
}

function createParticles(width: number, height: number): Particle[] {
  const particles: Particle[] = []
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const angle = Math.random() * Math.PI * 2
    const speed = SPEED * (0.5 + Math.random())
    const { radius } = pickSizeTier()
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius,
      // Antes 0.12–0.30 (bastante transparentes) — ahora sensiblemente más
      // opacos, a pedido: el fondo pasó a negro, así que hay más margen de
      // contraste antes de competir con la grilla de encima.
      opacity: 0.28 + Math.random() * 0.32,
      accent: Math.random() < ACCENT_RATIO,
    })
  }
  return particles
}

export function ParticipantesBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const parent = canvas?.parentElement
    const ctx = canvas?.getContext('2d')
    if (!canvas || !parent || !ctx) return

    // Capado a 2x: en una pantalla 3x/4x no aporta nitidez perceptible acá
    // (son puntos borrosos de pocos px) y sí cuadruplica los píxeles a
    // limpiar/redibujar en cada frame.
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let width = 0
    let height = 0
    let particles: Particle[] = []

    function resize() {
      width = parent!.clientWidth
      height = parent!.clientHeight
      canvas!.width = width * dpr
      canvas!.height = height * dpr
      canvas!.style.width = `${width}px`
      canvas!.style.height = `${height}px`
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
      particles = createParticles(width, height)
    }
    resize()

    function draw() {
      ctx!.clearRect(0, 0, width, height)
      for (const p of particles) {
        ctx!.beginPath()
        ctx!.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx!.fillStyle = `rgba(${p.accent ? BRAND_RED : ACCENT_ORANGE}, ${p.opacity})`
        ctx!.fill()
      }
    }

    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    let reducedMotion = reducedMotionQuery.matches
    let isVisible = false
    let frameId: number | null = null
    let running = false

    function loop() {
      if (reducedMotion) {
        draw()
        running = false
        frameId = null
        return
      }
      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        // Envuelve en los bordes en vez de rebotar — más simple, y a esta
        // velocidad/opacidad el "salto" al otro lado no se nota.
        if (p.x < -10) p.x = width + 10
        else if (p.x > width + 10) p.x = -10
        if (p.y < -10) p.y = height + 10
        else if (p.y > height + 10) p.y = -10
      }
      draw()
      frameId = requestAnimationFrame(loop)
    }

    function startLoop() {
      if (running) return
      running = true
      frameId = requestAnimationFrame(loop)
    }

    function stopLoop() {
      running = false
      if (frameId !== null) cancelAnimationFrame(frameId)
      frameId = null
    }

    draw() // primer frame inmediato, sin esperar al observer de visibilidad

    const resizeObserver = new ResizeObserver(() => {
      resize()
      draw()
    })
    resizeObserver.observe(parent)

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting
        if (isVisible && !reducedMotion) startLoop()
        else stopLoop()
      },
      { threshold: 0 },
    )
    intersectionObserver.observe(canvas)

    const handleMotionChange = (e: MediaQueryListEvent) => {
      reducedMotion = e.matches
      if (reducedMotion) stopLoop()
      draw()
      if (!reducedMotion && isVisible) startLoop()
    }
    reducedMotionQuery.addEventListener('change', handleMotionChange)

    return () => {
      stopLoop()
      resizeObserver.disconnect()
      intersectionObserver.disconnect()
      reducedMotionQuery.removeEventListener('change', handleMotionChange)
    }
  }, [])

  return <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0" />
}
