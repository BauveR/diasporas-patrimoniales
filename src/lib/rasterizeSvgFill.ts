import { parseSvgPaths } from './parseSvgPaths'

export interface RasterizedSvg {
  ctx: CanvasRenderingContext2D
  canvasWidth: number
  canvasHeight: number
}

/**
 * Fills every <path> of an SVG onto an offscreen canvas sized to match the
 * source viewBox's aspect ratio — respecting nested subpaths as holes, same
 * as the browser would render them. Shared rasterization step behind both
 * generateSvgFillPositions (sampling positions from the fill) and
 * createShapeMask (testing whether a point falls inside the fill).
 */
export function rasterizeSvgFill(svgRaw: string, canvasWidth = 1024): RasterizedSvg | null {
  const { ds, viewBoxWidth, viewBoxHeight } = parseSvgPaths(svgRaw)
  if (ds.length === 0) return null

  const canvasHeight = Math.round(canvasWidth * (viewBoxHeight / viewBoxWidth))
  const canvas = document.createElement('canvas')
  canvas.width = canvasWidth
  canvas.height = canvasHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  ctx.scale(canvasWidth / viewBoxWidth, canvasHeight / viewBoxHeight)
  ctx.fillStyle = '#fff'
  for (const d of ds) ctx.fill(new Path2D(d))

  return { ctx, canvasWidth, canvasHeight }
}
