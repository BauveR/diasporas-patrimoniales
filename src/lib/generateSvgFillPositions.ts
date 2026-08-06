import { rasterizeSvgFill } from './rasterizeSvgFill'
import { sampleAlphaPoints, pointsToWorldPositions } from './canvasAlphaSampling'

/**
 * Rasterizes the filled <path> shapes of an SVG and samples the painted
 * interior into `count` world-space positions, centered on the origin. Same
 * technique as generateTextPositions, but filling arbitrary vector shapes
 * instead of text glyphs. All shapes are sampled together into one combined
 * mask, so overlapping/nested shapes read as a single merged silhouette
 * rather than being kept separate.
 */
export function generateSvgFillPositions(svgRaw: string, count: number, worldWidth: number): Float32Array {
  const positions = new Float32Array(count * 3)
  const rasterized = rasterizeSvgFill(svgRaw)
  if (!rasterized) return positions
  const { ctx, canvasWidth, canvasHeight } = rasterized

  const points = sampleAlphaPoints(ctx, canvasWidth, canvasHeight, 2, 128)
  return pointsToWorldPositions(points, count, canvasWidth, canvasHeight, worldWidth, 4)
}
