import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { googleMapsUrl, type Sede } from '../../data/sedes'
import logoTEA from '../../assets/tenerife-espacio-de-las-artes [Converted]-01.png'
import { labelStyle } from '../../lib/styles'

type Props = {
  sede: Sede
}

export function SedePanel({ sede }: Props) {
  const { t } = useTranslation()
  const [bibOpen, setBibOpen] = useState(false)
  const mapsUrl = googleMapsUrl(sede)

  return (
    <div className="flex flex-col sm:flex-row">

      {/* Foto — a la izquierda desde `sm`; `sm:aspect-auto` deja que la
          altura la marque el contenido de texto (flex `align-items: stretch`
          por defecto), en vez del `aspect-16/7` fijo que solo tiene sentido
          cuando la foto ocupa el ancho completo arriba. Envuelta en un link
          a Google Maps (misma ubicación, coordenadas exactas) en vez de la
          tarjeta entera — evita anidar un link alrededor del botón de
          bibliografía más abajo, que sí necesita seguir siendo su propio
          elemento interactivo. */}
      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t('sedes.verEnGoogleMaps')}
        className="group relative aspect-16/7 w-full shrink-0 overflow-hidden sm:aspect-auto sm:w-1/2"
      >
        <img
          src={sede.imagen}
          alt={sede.nombre}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </a>

      {/* Content — `justify-center`: la columna se estira a la altura de la
          foto (`items-stretch` por defecto del padre `sm:flex-row`), así que
          sin esto el contenido queda pegado arriba dejando aire abajo en vez
          de centrado respecto al alto real de la tarjeta. */}
      <div className="flex flex-col justify-center gap-5 px-8 py-7">

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <p className="text-[10px] tracking-[0.25em] uppercase text-white/50" style={labelStyle}>
            {sede.isla} — {sede.municipio}
          </p>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] tracking-[0.2em] uppercase text-white/70 underline underline-offset-2 hover:text-white transition-colors"
            style={labelStyle}
          >
            {t('sedes.verEnGoogleMaps')}
          </a>
        </div>

        <h2 className="font-mattone text-2xl font-normal uppercase tracking-tight leading-tight" style={{ color: '#b19e7b' }}>
          {sede.nombre}
        </h2>

        <div className="w-8 h-px bg-white/20" />

        <p className="text-sm text-white/70 leading-relaxed" style={labelStyle}>
          {sede.descripcion}
        </p>

        <div className="w-full h-px bg-white/10" />

        {/* Logo TEA — el PNG es blanco puro (sin canal alfa parcial en el
            trazo), así que `opacity` sobre un fondo blanco lo dejaría casi
            invisible en vez de gris. `brightness()` sí funciona: escala los
            tres canales por igual, así que el blanco puro (255) baja a un
            gris parejo (255*0.75≈191) sin afectar la transparencia del
            fondo del PNG. */}
        <img
          src={logoTEA}
          alt="Tenerife Espacio de las Artes"
          width={473}
          height={237}
          loading="lazy"
          className="h-14 w-auto object-contain brightness-75"
        />

        {/* Bibliografía */}
        {(sede.bibliografia?.length ?? 0) > 0 && (
          <div className="border border-white/10 rounded-2xl overflow-hidden">
            <button
              onClick={() => setBibOpen(p => !p)}
              className="w-full flex items-center justify-between px-5 py-3.5 text-left cursor-pointer hover:bg-white/5 transition-colors"
              style={labelStyle}
            >
              <span className="text-[10px] tracking-[0.25em] uppercase text-white/50">{t('sedes.bibliografia')}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
                className={`text-white/40 shrink-0 transition-transform duration-200 ${bibOpen ? 'rotate-180' : ''}`}
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            {bibOpen && (
              <ul className="flex flex-col gap-2 px-5 pb-5 pt-1">
                {sede.bibliografia!.map((ref, i) => (
                  <li key={i} className="text-[11px] text-white/70 leading-relaxed" style={labelStyle}>
                    {ref.startsWith('http') ? (
                      <a href={ref} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 decoration-white/30 hover:text-white break-all">
                        {ref}
                      </a>
                    ) : ref}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
