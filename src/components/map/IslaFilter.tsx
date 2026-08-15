const ISLAS = [
  'Todas', 'Tenerife', 'Gran Canaria', 'Lanzarote',
  'Fuerteventura', 'La Palma', 'La Gomera', 'El Hierro',
] as const

const labelStyle = { fontFamily: "'Open Sans', sans-serif" }

type Props = {
  selectedIsla: string | null
  onSelect: (isla: string | null) => void
}

export function IslaFilter({ selectedIsla, onSelect }: Props) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {ISLAS.map(isla => {
        const isActive = isla === 'Todas' ? selectedIsla === null : selectedIsla === isla
        return (
          <button
            key={isla}
            onClick={() => onSelect(isla === 'Todas' ? null : isla)}
            style={{ ...labelStyle, ...(isActive ? { backgroundColor: '#595d8d' } : {}) }}
            className={`flex-none px-3 py-1.5 rounded-xl text-[10px] tracking-widest uppercase whitespace-nowrap transition-colors duration-150 cursor-pointer border ${
              isActive
                ? 'text-white border-transparent'
                : 'bg-white text-stone-500 border-stone-200 hover:border-stone-400 hover:text-stone-900'
            }`}
          >
            {isla}
          </button>
        )
      })}
    </div>
  )
}
