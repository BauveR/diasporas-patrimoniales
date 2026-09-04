import { useTranslation } from 'react-i18next'
import { SedePanel } from './SedePanel'
import { ActividadesSlider } from '../actividades/ActividadesSlider'
import { useDataContext } from '../../contexts/DataContext'
import logoYoutube from '../../assets/diasporas patrimoniales live youtube-15.png'

// TODO: reemplazar por la URL real del canal / transmisión en directo de YouTube
const YOUTUBE_URL = '#'

export function MapSection() {
  const { t } = useTranslation()
  const { sedes, actividades } = useDataContext()
  const sede = sedes[0]

  if (!sede) return null

  const today = new Date().toISOString().slice(0, 10)
  const proximosEventos = actividades
    .filter(a => a.sedeId === sede.id && !a.cancelada && a.fecha >= today)
    .sort((a, b) => a.fecha.localeCompare(b.fecha))

  return (
    <section className="w-full bg-white px-10 sm:px-16 lg:px-24 py-6 sm:py-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:gap-10">
        <div className="w-full overflow-hidden rounded-3xl border border-stone-100 shadow-sm lg:w-[30%] lg:shrink-0">
          <SedePanel sede={sede} />
        </div>

        {proximosEventos.length > 0 && (
          <div className="lg:w-165 lg:shrink-0">
            <ActividadesSlider actividades={proximosEventos} />
          </div>
        )}

        <div className="flex items-center justify-center lg:flex-1">
          <a href={YOUTUBE_URL} target="_blank" rel="noopener noreferrer" className="-translate-y-16 transition-opacity hover:opacity-80">
            <img
              src={logoYoutube}
              alt={t('sedes.youtubeAlt')}
              className="h-32 w-auto object-contain"
            />
          </a>
        </div>
      </div>
    </section>
  )
}
