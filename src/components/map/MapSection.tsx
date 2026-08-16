import { SedeList } from './SedeList'
import { SedePanel } from './SedePanel'
import { SedeDrawer } from './SedeDrawer'
import { useDataContext } from '../../contexts/DataContext'
import { useMapUIContext } from '../../contexts/MapUIContext'
import { SM_BREAKPOINT } from '../../hooks/useIsDesktop'

export function MapSection() {
  const { sedes } = useDataContext()
  const { selectedId, setSelectedId, drawerOpen, setDrawerOpen } = useMapUIContext()

  const selected = sedes.find(c => c.id === selectedId) ?? null

  const handleSelect = (id: number) => {
    setSelectedId(id)
    if (!window.matchMedia(SM_BREAKPOINT).matches) {
      setDrawerOpen(true)
    }
  }

  const handleDrawerClose = () => {
    setDrawerOpen(false)
    setSelectedId(null)
  }

  const handleDrawerNavigate = () => setDrawerOpen(false)

  return (
    <section className="w-full bg-white px-6 sm:px-8 lg:px-10 py-6 sm:py-8 overscroll-contain isolate">

      <div className="flex flex-row w-full h-[68svh] sm:h-[78svh] overflow-hidden rounded-3xl border border-stone-100 shadow-sm">

        <div className="h-full flex-1 min-w-0 overflow-y-auto">
          <SedeList
            sedes={sedes}
            selectedId={selectedId}
            onSelect={handleSelect}
          />
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
