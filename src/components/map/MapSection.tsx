import { useState, useEffect, useRef } from 'react'
import { SedesMap } from './SedesMap'
import { SedePanel } from './SedePanel'
import { SedeDrawer } from './SedeDrawer'
import { IslaFilter } from './IslaFilter'
import { MapHint } from './MapHint'
import { useDataContext } from '../../contexts/DataContext'
import { useMapUIContext } from '../../contexts/MapUIContext'
import { SM_BREAKPOINT } from '../../hooks/useIsDesktop'

export function MapSection() {
  const { sedes } = useDataContext()
  const { selectedId, setSelectedId, selectedIsla, setSelectedIsla, drawerOpen, setDrawerOpen } = useMapUIContext()
  const [mapVisible, setMapVisible] = useState(false)
  const [mapActive, setMapActive] = useState(false)
  const mapContainerRef = useRef<HTMLDivElement>(null)

  const selected = sedes.find(c => c.id === selectedId) ?? null

  useEffect(() => {
    const el = mapContainerRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setMapVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const handleSelect = (id: number) => {
    setMapActive(true)
    setSelectedId(id)
    if (!window.matchMedia(SM_BREAKPOINT).matches) {
      setDrawerOpen(true)
    }
  }

  const handleIslaSelect = (isla: string | null) => {
    setSelectedIsla(isla)
    setSelectedId(null)
  }

  const handleDrawerClose = () => {
    setDrawerOpen(false)
    setSelectedId(null)
  }

  const handleDrawerNavigate = () => setDrawerOpen(false)

  return (
    <section className="w-full bg-white px-6 sm:px-8 lg:px-10 py-6 sm:py-8 overscroll-contain isolate">

      <div className="mb-3">
        <IslaFilter selectedIsla={selectedIsla} onSelect={handleIslaSelect} />
      </div>

      <div className="flex flex-row w-full h-[68svh] sm:h-[78svh] overflow-hidden rounded-3xl border border-stone-100 shadow-sm">

        <div ref={mapContainerRef} className="h-full flex-1 min-w-0 touch-none relative">

          <div className="h-full relative overflow-hidden">
            {mapVisible && (
              <div className="absolute inset-0">
                <SedesMap
                  sedes={sedes}
                  selectedId={selectedId}
                  selectedIsla={selectedIsla}
                  active={mapActive}
                  onSelect={handleSelect}
                  onActivate={() => setMapActive(true)}
                />
              </div>
            )}

            <MapHint visible={mapVisible} active={mapActive} />

            <div
              className={`absolute inset-0 bg-stone-100 pointer-events-none transition-opacity duration-700 ease-in-out ${
                mapVisible ? 'opacity-0' : 'opacity-100'
              }`}
            />
          </div>
        </div>

        <div
          className="hidden sm:block h-full shrink-0 overflow-hidden border-l border-stone-100 bg-white"
          style={{
            width: selected ? '40%' : '0',
            transition: 'width 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {selected && (
            <SedePanel
              key={selected.id}
              sede={selected}
              onClose={() => setSelectedId(null)}
            />
          )}
        </div>
      </div>

      <SedeDrawer
        sede={selected}
        open={drawerOpen}
        onClose={handleDrawerClose}
        onNavigate={handleDrawerNavigate}
      />
    </section>
  )
}
