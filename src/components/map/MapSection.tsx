import { SedePanel } from './SedePanel'
import { useDataContext } from '../../contexts/DataContext'

export function MapSection() {
  const { sedes } = useDataContext()
  const sede = sedes[0]

  if (!sede) return null

  return (
    <section className="w-full bg-white px-6 sm:px-8 lg:px-10 py-6 sm:py-8">
      <div className="w-full overflow-hidden rounded-3xl border border-stone-100 shadow-sm">
        <SedePanel sede={sede} />
      </div>
    </section>
  )
}
