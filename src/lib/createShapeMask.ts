import { rasterizeSvgFill } from './rasterizeSvgFill'

export interface ShapeMask {
  isInside(worldX: number, worldY: number): boolean
  /**
   * True only if every point along the straight line from (x0,y0) to
   * (x1,y1) is inside the shape — not just the two endpoints. A wander hop
   * that starts and ends inside two different filled rings, but crosses the
   * unfilled gap between them, would pass an endpoint-only test; this is
   * what actually keeps a hop from tunnelling across that gap.
   */
  isSegmentInside(x0: number, y0: number, x1: number, y1: number, steps?: number): boolean
}

/**
 * Builds a point-in-shape test from an SVG's filled paths, using the same
 * world-space mapping (worldWidth-scaled, centered on the origin) as
 * generateSvgFillPositions — pass it the same `worldWidth` so the two line
 * up. Used to keep particles wandering freely without ever stepping outside
 * the shape's silhouette once they've formed it.
 */
export function createShapeMask(svgRaw: string, worldWidth: number): ShapeMask {
  const rasterized = rasterizeSvgFill(svgRaw)
  if (!rasterized) return { isInside: () => false, isSegmentInside: () => false }
  const { ctx, canvasWidth, canvasHeight } = rasterized
  const { data } = ctx.getImageData(0, 0, canvasWidth, canvasHeight)
  const scale = worldWidth / canvasWidth

  function isInside(worldX: number, worldY: number): boolean {
    const px = Math.round(worldX / scale + canvasWidth / 2)
    const py = Math.round(-worldY / scale + canvasHeight / 2)
    if (px < 0 || px >= canvasWidth || py < 0 || py >= canvasHeight) return false
    return data[(py * canvasWidth + px) * 4 + 3] > 128
  }

  function isSegmentInside(x0: number, y0: number, x1: number, y1: number, steps = 12): boolean {
    for (let i = 0; i <= steps; i++) {
      const f = i / steps
      if (!isInside(x0 + (x1 - x0) * f, y0 + (y1 - y0) * f)) return false
    }
    return true
  }

  return { isInside, isSegmentInside }
}
