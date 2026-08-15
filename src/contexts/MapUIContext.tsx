import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'

type MapUIContextValue = {
  selectedId: number | null
  setSelectedId: (id: number | null) => void
  selectedIsla: string | null
  setSelectedIsla: (isla: string | null) => void
  drawerOpen: boolean
  setDrawerOpen: (open: boolean) => void
}

const MapUIContext = createContext<MapUIContextValue | null>(null)

export function MapUIProvider({ children }: { children: ReactNode }) {
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [selectedIsla, setSelectedIsla] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <MapUIContext.Provider value={{
      selectedId, setSelectedId,
      selectedIsla, setSelectedIsla,
      drawerOpen, setDrawerOpen,
    }}>
      {children}
    </MapUIContext.Provider>
  )
}

// Context + colocated hook is the standard pattern here — it only costs Fast
// Refresh granularity, not correctness.
// eslint-disable-next-line react-refresh/only-export-components
export function useMapUIContext() {
  const ctx = useContext(MapUIContext)
  if (!ctx) throw new Error('useMapUIContext must be used within MapUIProvider')
  return ctx
}
