import { useRef, useEffect, useLayoutEffect } from 'react'
import { useNavigationType, useLocation } from 'react-router-dom'
import { useMapUIContext } from '../contexts/MapUIContext'
import { SM_BREAKPOINT } from './useIsDesktop'

export function useMapRestoration() {
  const navType = useNavigationType()
  const location = useLocation()
  const { selectedId, setDrawerOpen } = useMapUIContext()

  // Capture at mount time — restoration only applies to the initial render after back navigation
  const shouldRestore = useRef(
    navType === 'POP' && !!selectedId && location.state?.from !== 'actividades'
  )

  useLayoutEffect(() => {
    if (!shouldRestore.current) return
    document.getElementById('sedes')?.scrollIntoView({ behavior: 'instant' })
  }, [])

  useEffect(() => {
    if (!shouldRestore.current) return
    if (!window.matchMedia(SM_BREAKPOINT).matches) {
      setDrawerOpen(true)
    }
  }, [setDrawerOpen])
}
