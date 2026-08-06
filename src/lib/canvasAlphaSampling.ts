export type SamplePoint = [number, number]

/** Scans a canvas on a step grid and returns the (x,y) of every pixel whose alpha exceeds `threshold`. */
export function sampleAlphaPoints(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  step: number,
  threshold: number,
): SamplePoint[] {
  const { data } = ctx.getImageData(0, 0, width, height)
  const points: SamplePoint[] = []
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const alpha = data[(y * width + x) * 4 + 3]
      if (alpha > threshold) points.push([x, y])
    }
  }
  return points
}

/**
 * Maps canvas-space sample points into a flat [x, y, z, ...] Float32Array of
 * world-space positions centered on the origin. If `count` exceeds the
 * number of sampled points, extra particles reuse existing points with a
 * small random jitter instead of stacking exactly on top of each other.
 */
export function pointsToWorldPositions(
  points: SamplePoint[],
  count: number,
  canvasWidth: number,
  canvasHeight: number,
  worldWidth: number,
  jitterPx: number,
): Float32Array {
  const positions = new Float32Array(count * 3)
  if (points.length === 0) return positions

  // When there are more sampled points than particles (a large filled shape
  // sampled for a small `count`), picking points[0..count-1] straight off
  // the scan would only cover the first few scanlines — a thin sliver at the
  // top of the shape, not the whole fill. Shuffle so a small `count` still
  // spreads evenly across the entire silhouette.
  const pool = points.length > count ? shuffled(points) : points

  const scale = worldWidth / canvasWidth
  const depth = worldWidth * 0.02

  for (let i = 0; i < count; i++) {
    let px: number
    let py: number
    if (i < pool.length) {
      ;[px, py] = pool[i]
    } else {
      const [bx, by] = pool[i % pool.length]
      px = bx + (Math.random() - 0.5) * jitterPx
      py = by + (Math.random() - 0.5) * jitterPx
    }

    positions[i * 3] = (px - canvasWidth / 2) * scale
    positions[i * 3 + 1] = -(py - canvasHeight / 2) * scale
    positions[i * 3 + 2] = (Math.random() - 0.5) * depth
  }

  return positions
}

function shuffled(points: SamplePoint[]): SamplePoint[] {
  const arr = points.slice()
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}
