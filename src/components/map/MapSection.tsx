import { SedePanel } from './SedePanel'
import { ActividadesSlider } from '../actividades/ActividadesSlider'
import { useDataContext } from '../../contexts/DataContext'

export function MapSection() {
  const { sedes, actividades } = useDataContext()
  const sede = sedes[0]

  if (!sede) return null

  const today = new Date().toISOString().slice(0, 10)
  const proximosEventos = actividades
    .filter(a => a.sedeId === sede.id && !a.cancelada && a.fecha >= today)
    .sort((a, b) => a.fecha.localeCompare(b.fecha))

  return (
    <section className="w-full bg-white px-6 sm:px-8 lg:px-10 py-6 sm:py-8">
      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="w-full overflow-hidden rounded-3xl border border-stone-100 shadow-sm lg:w-[30%] lg:shrink-0">
          <SedePanel sede={sede} />
        </div>

        {proximosEventos.length > 0 && (
          <div className="lg:w-[70%] lg:min-w-0">
            <ActividadesSlider
              actividades={proximosEventos}
              labelSingular="evento próximo"
              labelPlural="eventos próximos"
            />
          </div>
        )}
      </div>
    </section>
  )
}
