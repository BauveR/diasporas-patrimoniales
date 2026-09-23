import { useState, useEffect } from 'react'
import { BREAKPOINTS, mq, type Breakpoint } from '../lib/breakpoints'

export type BreakpointBucket = 'base' | Breakpoint

// Largest-first: the viewport's current bucket is whichever named breakpoint
// it satisfies with the biggest min-width, matching how a single Tailwind
// class resolves at any given width (never two at once). `base` covers
// anything below `sm` (< 640px), same as an unprefixed Tailwind utility.
const ORDER: Breakpoint[] = (Object.keys(BREAKPOINTS) as Breakpoint[]).sort(
  (a, b) => BREAKPOINTS[b] - BREAKPOINTS[a],
)

function computeBucket(): BreakpointBucket {
  if (typeof window === 'undefined') return 'base'
  for (const bp of ORDER) {
    if (window.matchMedia(mq(bp)).matches) return bp
  }
  return 'base'
}

export function useBreakpoint(): BreakpointBucket {
  const [bucket, setBucket] = useState<BreakpointBucket>(computeBucket)
  useEffect(() => {
    const queries = ORDER.map(bp => window.matchMedia(mq(bp)))
    const handler = () => setBucket(computeBucket())
    queries.forEach(q => q.addEventListener('change', handler))
    return () => queries.forEach(q => q.removeEventListener('change', handler))
  }, [])
  return bucket
}
