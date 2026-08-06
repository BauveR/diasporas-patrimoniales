import { sampleAlphaPoints, pointsToWorldPositions } from './canvasAlphaSampling'

/**
 * Rasterizes `lines` onto an offscreen 2D canvas and samples the painted
 * pixels into a flat [x, y, z, x, y, z, ...] Float32Array of world-space
 * positions, centered on the origin. Meant to run once (e.g. inside a
 * useMemo with empty deps), never per-frame — text-to-particle mapping is
 * too expensive to redo every frame at particle-swarm counts.
 */
export function generateTextPositions(lines: string[], count: number, worldWidth: number): Float32Array {
  const canvasWidth = 1024
  const canvasHeight = 512
  const canvas = document.createElement('canvas')
  canvas.width = canvasWidth
  canvas.height = canvasHeight
  const ctx = canvas.getContext('2d')
  const positions = new Float32Array(count * 3)
  if (!ctx) return positions

  // Leave the background transparent (alpha 0) instead of filling it black —
  // painting an opaque background would give every pixel alpha 255, and the
  // alpha > 128 sampling below would then match the whole canvas rectangle
  // instead of just the glyph shapes.
  ctx.fillStyle = '#fff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  const lineHeight = canvasHeight / (lines.length + 1)
  let fontSize = Math.floor(lineHeight * 0.72)
  ctx.font = `bold ${fontSize}px sans-serif`

  const padding = canvasWidth * 0.08
  const maxLineWidth = Math.max(...lines.map((line) => ctx.measureText(line).width))
  if (maxLineWidth > canvasWidth - padding) {
    fontSize = Math.floor(fontSize * ((canvasWidth - padding) / maxLineWidth))
    ctx.font = `bold ${fontSize}px sans-serif`
  }

  lines.forEach((line, i) => {
    const y = lineHeight * (i + 1)
    ctx.fillText(line, canvasWidth / 2, y)
  })

  const points = sampleAlphaPoints(ctx, canvasWidth, canvasHeight, 2, 128)
  return pointsToWorldPositions(points, count, canvasWidth, canvasHeight, worldWidth, 4)
}
