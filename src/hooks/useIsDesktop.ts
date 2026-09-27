import { useState, useEffect } from 'react'
import { mq } from '../lib/breakpoints'

export function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() => typeof window !== 'undefined' && window.matchMedia(mq('sm')).matches)
  useEffect(() => {
    const mql = window.matchMedia(mq('sm'))
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])
  return isDesktop
}
