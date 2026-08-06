export interface ParsedSvgPaths {
  /** The `d` attribute of every <path> in the SVG, in document order. */
  ds: string[]
  viewBoxWidth: number
  viewBoxHeight: number
}

/** Parses an SVG source string into its <path> `d` strings and viewBox size. */
export function parseSvgPaths(svgRaw: string): ParsedSvgPaths {
  const doc = new DOMParser().parseFromString(svgRaw, 'image/svg+xml')
  const svgEl = doc.querySelector('svg')
  const viewBoxAttr = svgEl?.getAttribute('viewBox')?.trim().split(/\s+/).map(Number)
  const [, , viewBoxWidth, viewBoxHeight] =
    viewBoxAttr && viewBoxAttr.length === 4 ? viewBoxAttr : [0, 0, 1280, 1024]

  const ds = Array.from(doc.querySelectorAll('path'))
    .map((path) => path.getAttribute('d'))
    .filter((d): d is string => !!d)

  return { ds, viewBoxWidth, viewBoxHeight }
}
