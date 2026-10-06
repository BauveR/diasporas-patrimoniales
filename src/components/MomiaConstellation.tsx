import { useEffect, useRef } from 'react'
import momia from '../assets/momia-puntos.json'

// Constelación de la momia (src/assets/momia simple-20.svg) dibujada en un
// canvas 2D, con parte de los puntos destellando como estrellas (cambian de
// brillo y tamaño; nada se desplaza). El SVG original pesa 809 KB y trae
// ~5.700 elementos: Illustrator duplicó casi cada punto (círculo + path
// encima) y convirtió cada línea en un rectángulo o polígono relleno.
// momia-puntos.json es la versión optimizada (~18 KB gzip): 2.563 puntos +
// 11 anclas invisibles y 1.154 líneas (el eje central de cada
// rectángulo/polígono) guardadas como pares de índices de punto.
//
// Formato: `p` = [x, y, radio, color] por punto, aplanado (color 0 naranja,
// 1 rojo, 2 ancla invisible); `l` = [i, j] por línea, aplanado; `w`/`h` =
// tamaño del dibujo en unidades del SVG. El SVG actual es de un solo color
// (todo 0); el rojo queda soportado por si una versión futura lo trae.

// Fracción de puntos que destellan (elegidos al azar en cada montaje).
const TWINKLE_RATIO = 0.45
// Velocidad angular (rad/s) del ciclo de cada punto: ~3,5 a ~10 s por ciclo.
const MIN_SPEED = 0.6
const MAX_SPEED = 1.8
// Brillo mínimo de un punto que destella (el máximo es 1).
const MIN_ALPHA_LOW = 0.15
const MIN_ALPHA_HIGH = 0.45
// Cuánto crece el radio en el pico del destello (0,8 = un 80% más grande).
const PEAK_GROWTH = 0.8
// Brillo de los puntos que no destellan y de las líneas.
const STATIC_ALPHA = 0.9
const LINE_ALPHA = 0.5
// Niveles de brillo con los que se agrupan los puntos para dibujar: un
// fill() por nivel en vez de uno por punto.
const ALPHA_LEVELS = 12
// El destello es lento (ciclos de 3,5-10 s): a 30 fps no se nota diferencia
// con 60 y cuesta la mitad de CPU.
const FRAME_INTERVAL_MS = 1000 / 30

const ORANGE = '#f28941'
const RED = '#ef4e23'
// Grosor de las líneas en el SVG (~0,32 unidades del dibujo).
const LINE_WIDTH = 0.32

const { w: WIDTH, h: HEIGHT, p: RAW_POINTS, l: LINES } = momia as { w: number; h: number; p: number[]; l: number[] }
const COUNT = RAW_POINTS.length / 4

type Twinkle = { speed: number; phase: number; minAlpha: number }

const rand = (min: number, max: number) => min + Math.random() * (max - min)

function randomTwinkles(): (Twinkle | null)[] {
  return Array.from({ length: COUNT }, (_, i) => (RAW_POINTS[i * 4 + 3] !== 2 && Math.random() < TWINKLE_RATIO
    ? { speed: rand(MIN_SPEED, MAX_SPEED), phase: Math.random() * Math.PI * 2, minAlpha: rand(MIN_ALPHA_LOW, MIN_ALPHA_HIGH) }
    : null))
}

export function MomiaConstellation({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const twinkles = randomTwinkles()
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    // Con movimiento reducido no destella nada: todo va a la capa fija.
    const isTwinkling = (i: number) => !reducedMotion && twinkles[i] !== null
    // Capa fija (líneas + puntos que no destellan), pintada una sola vez por
    // tamaño en un canvas aparte; cada fotograma solo la copia y dibuja
    // encima los puntos que destellan.
    const staticLayer = document.createElement('canvas')
    const staticCtx = staticLayer.getContext('2d')
    let scale = 1
    let raf = 0
    let lastFrame = 0
    let visible = false

    const fillPoints = (target: CanvasRenderingContext2D, t: number, twinkling: boolean) => {
      // Agrupados por color y nivel de brillo, un Path2D por grupo.
      for (const [color, fill] of [[0, ORANGE], [1, RED]] as const) {
        const paths = Array.from({ length: ALPHA_LEVELS }, () => new Path2D())
        for (let i = 0; i < COUNT; i++) {
          if (RAW_POINTS[i * 4 + 3] !== color || isTwinkling(i) !== twinkling) continue
          const x = RAW_POINTS[i * 4], y = RAW_POINTS[i * 4 + 1]
          let r = RAW_POINTS[i * 4 + 2]
          let alpha = STATIC_ALPHA
          const tw = twinkles[i]
          if (twinkling && tw) {
            // 0..1, con forma de pico: la mayor parte del ciclo tenue y un
            // destello breve arriba (b³), como una estrella que titila.
            const b = ((Math.sin(t * tw.speed + tw.phase) + 1) / 2) ** 3
            alpha = tw.minAlpha + (1 - tw.minAlpha) * b
            r *= 1 + PEAK_GROWTH * b
          }
          const path = paths[Math.round(alpha * (ALPHA_LEVELS - 1))]
          path.moveTo(x + r, y)
          path.arc(x, y, r, 0, Math.PI * 2)
        }
        target.fillStyle = fill
        for (let level = 1; level < ALPHA_LEVELS; level++) {
          target.globalAlpha = level / (ALPHA_LEVELS - 1)
          target.fill(paths[level])
        }
      }
      target.globalAlpha = 1
    }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const cssWidth = canvas.clientWidth
      canvas.width = staticLayer.width = Math.round(cssWidth * dpr)
      canvas.height = staticLayer.height = Math.round(cssWidth * (HEIGHT / WIDTH) * dpr)
      scale = canvas.width / WIDTH
      if (!staticCtx) return
      staticCtx.setTransform(scale, 0, 0, scale, 0, 0)
      staticCtx.clearRect(0, 0, WIDTH, HEIGHT)
      // Líneas: fijas, como en el SVG.
      staticCtx.globalAlpha = LINE_ALPHA
      staticCtx.beginPath()
      for (let k = 0; k < LINES.length; k += 2) {
        const a = LINES[k] * 4, b = LINES[k + 1] * 4
        staticCtx.moveTo(RAW_POINTS[a], RAW_POINTS[a + 1])
        staticCtx.lineTo(RAW_POINTS[b], RAW_POINTS[b + 1])
      }
      staticCtx.strokeStyle = ORANGE
      // Nunca más fino que ~0,5px de pantalla, o desaparece en móvil.
      staticCtx.lineWidth = Math.max(LINE_WIDTH, 0.5 / scale)
      staticCtx.stroke()
      fillPoints(staticCtx, 0, false)
    }

    const draw = (t: number) => {
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(staticLayer, 0, 0)
      ctx.setTransform(scale, 0, 0, scale, 0, 0)
      fillPoints(ctx, t, true)
    }

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop)
      // -4 ms de tolerancia: rAF no llega exacto cada 16,7 ms y sin margen a
      // veces saltaría dos fotogramas seguidos (20 fps en vez de 30).
      if (now - lastFrame < FRAME_INTERVAL_MS - 4) return
      lastFrame = now
      draw(now / 1000)
    }
    const start = () => {
      if (reducedMotion) { draw(0); return }
      if (!raf) raf = requestAnimationFrame(loop)
    }
    const stop = () => {
      cancelAnimationFrame(raf)
      raf = 0
    }

    // Solo anima mientras está en pantalla, igual que los fondos WebGL.
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (visible) start()
      else stop()
    })
    io.observe(canvas)
    const ro = new ResizeObserver(() => {
      resize()
      if (reducedMotion || !visible) draw(performance.now() / 1000)
    })
    ro.observe(canvas)

    return () => {
      stop()
      io.disconnect()
      ro.disconnect()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={className}
      style={{ width: '100%', aspectRatio: `${WIDTH} / ${HEIGHT}` }}
    />
  )
}
