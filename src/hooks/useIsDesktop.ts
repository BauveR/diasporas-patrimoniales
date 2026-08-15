import { useState, useEffect } from 'react'

export const SM_BREAKPOINT = '(min-width: 640px)'

export function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() => typeof window !== 'undefined' && window.matchMedia(SM_BREAKPOINT).matches)
  useEffect(() => {
    const mq = window.matchMedia(SM_BREAKPOINT)
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return isDesktop
}
