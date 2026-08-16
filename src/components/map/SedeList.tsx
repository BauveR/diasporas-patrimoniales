import type { Sede } from '../../data/sedes'

const labelStyle = { fontFamily: "'Open Sans', sans-serif" }

type Props = {
  sedes: Sede[]
  selectedId: number | null
  onSelect: (id: number) => void
}

// Replaces the interactive map as the way to browse sedes — a plain grid
// instead of pins on a map, but landing on the exact same selection state
// (selectedId) that SedePanel/SedeDrawer already consume, so the detail
// views needed no changes.
export function SedeList({ sedes, selectedId, onSelect }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:p-6 xl:grid-cols-3">
      {sedes.map(sede => {
        const isSelected = sede.id === selectedId
        return (
          <button
            key={sede.id}
            onClick={() => onSelect(sede.id)}
            className={`group flex cursor-pointer flex-col gap-3 rounded-2xl text-left ${isSelected ? 'ring-2 ring-[#b19e7b]' : ''}`}
          >
            <div className="relative aspect-4/3 overflow-hidden rounded-2xl">
              <img
                src={sede.imagen}
                alt={sede.nombre}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>

            <div className="flex flex-col gap-1 px-1">
              <p className="text-[10px] tracking-[0.2em] text-stone-400 uppercase" style={labelStyle}>
                {sede.isla} — {sede.municipio}
              </p>
              <h3 className="text-sm leading-snug text-stone-900 transition-colors group-hover:text-stone-600" style={labelStyle}>
                {sede.nombre}
              </h3>
            </div>
          </button>
        )
      })}
    </div>
  )
}
