// Mirrors Tailwind's default breakpoint scale (the project doesn't override
// it in @theme) — one source of truth for the media-query strings used by
// matchMedia() in JS, instead of each hook hardcoding its own
// '(min-width: NNNpx)' literal that has to be kept in sync by hand with the
// Tailwind prefix it's meant to match.
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const

export type Breakpoint = keyof typeof BREAKPOINTS

export function mq(breakpoint: Breakpoint): string {
  return `(min-width: ${BREAKPOINTS[breakpoint]}px)`
}
