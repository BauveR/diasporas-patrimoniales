import { useTranslation } from 'react-i18next'
import { useDataContext } from '../contexts/DataContext'
import { SedePanel } from './map/SedePanel'

export function SedeSection() {
  const { t } = useTranslation()
  const { sedes } = useDataContext()
  const sede = sedes[0]

  if (!sede) return null

  return (
    <section className="w-full bg-white px-10 py-16 sm:px-16 sm:py-20 lg:px-24 lg:py-24">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <h2 className="font-mattone text-2xl font-bold tracking-tight text-[#9b2923] uppercase md:text-3xl">
          {t('sedeSection.titulo')}
        </h2>
        {/* Sin tope propio (`max-w-*`): ocupa el ancho completo del rail
            `max-w-7xl` de la sección, hasta los gutters. */}
        <div className="w-full overflow-hidden rounded-3xl border border-stone-100 shadow-sm">
          <SedePanel sede={sede} />
        </div>
      </div>
    </section>
  )
}
