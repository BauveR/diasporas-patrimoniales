import type { Sede } from '../../data/sedes'
import { SectionCard } from './fields'
import { SedeRow } from './SedeRow'

// El evento tiene una única sede fija (TEA) — sin buscador ni alta de sedes
// nuevas, que solo tenían sentido con la lista multi-sede de la plantilla
// original. Lo que queda es editar los datos de esa sede única.
export function GestionSedes({ sedes }: { sedes: Sede[] }) {
  return (
    <SectionCard title="Sede">
      {sedes.length === 0 ? (
        <p className="text-sm text-stone-400 py-4 text-center">Sin sede. Inicializa la base de datos.</p>
      ) : (
        sedes.map(c => <SedeRow key={c.id} sede={c} />)
      )}
    </SectionCard>
  )
}
