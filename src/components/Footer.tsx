import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { DEFAULT_LOCALE } from '../i18n/config'
import { getLocaleFromPathname } from '../i18n/routing'
import logoDiasporasTea from '../assets/diásporas patrimoniales tea tenerife-12.png'
import logoDiasporasPoster from '../assets/patrimonio cultural de canarias.png'
import logoGobCan from '../assets/Logo_GobCan_claim_blanco_mod1-01.png'
import logoCabildoTenerife from '../assets/cabildo-de-tenerife [Converted]-01.png'
import logoTEA from '../assets/tenerife-espacio-de-las-artes [Converted]-01.png'
import logoMuna from '../assets/15-Logo-MUNA-Museos-de-Tenerife-Naturaleza-y-Arqueologia-750x750.png'
import { labelStyle } from '../lib/styles'

const CONTACT_EMAIL = 'diasporaspatrimoniales@gmail.com'

// Redes de Patrimonio Cultural de Canarias. Iconos inline (sin librería):
// Facebook y TikTok con los trazados de Simple Icons (CC0); Instagram y
// YouTube dibujados con primitivas. El triángulo de YouTube usa el mismo
// rojo del fondo del footer para "recortarse" del rectángulo.
const REDES = [
  {
    nombre: 'Instagram',
    href: 'https://www.instagram.com/patrimoniocanario/',
    icono: (
      <>
        <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="12" cy="12" r="4.25" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="17.4" cy="6.6" r="1.25" fill="currentColor" />
      </>
    ),
  },
  {
    nombre: 'Facebook',
    href: 'https://www.facebook.com/patrimonioculturaldecanarias/',
    icono: (
      <path
        fill="currentColor"
        d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z"
      />
    ),
  },
  {
    nombre: 'TikTok',
    href: 'https://www.tiktok.com/@patrimoniocanario',
    icono: (
      <path
        fill="currentColor"
        d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"
      />
    ),
  },
  {
    nombre: 'YouTube',
    href: 'https://www.youtube.com/patrimonioculturaldecanarias',
    icono: (
      <>
        <rect x="1" y="4.5" width="22" height="15" rx="4.5" fill="currentColor" />
        <path d="M9.75 8.6v6.8L15.6 12z" fill="var(--color-brand-red)" />
      </>
    ),
  },
]

export function Footer() {
  const year = new Date().getFullYear()
  const { t } = useTranslation()
  const location = useLocation()
  const locale = getLocaleFromPathname(location.pathname)
  const privacyPath = locale === DEFAULT_LOCALE ? '/privacidad' : `/${locale}/privacidad`
  const legalPath = locale === DEFAULT_LOCALE ? '/aviso-legal' : `/${locale}/aviso-legal`
  // contacto.parrafo trae el email incrustado en la oración (así lo pide el
  // documento en las 4 lenguas) — se parte por ese string para que siga
  // siendo un mailto clicable en vez de mostrarlo dos veces.
  const [contactoAntes, contactoDespues] = t('contacto.parrafo').split(CONTACT_EMAIL)

  return (
    <footer id="footer" className="scroll-mt-16 bg-brand-red">
      <div className="mx-auto flex max-w-7xl flex-col gap-10 px-6 py-12 sm:px-8 lg:px-10">

        {/* Marca propia + colaboradores + contacto. Mobile (<sm) y desktop
            (sm+) usan estructuras distintas, no la misma fila reflowing:
            mobile pide 3 filas de a 2 logos en un orden puntual (no el
            orden en que flex-wrap los cortaría solo por ancho), así que
            son 2 bloques separados con `sm:hidden`/`hidden sm:flex` en vez
            de forzar un único flex-wrap a acomodarse distinto en cada
            breakpoint. */}
        <div className="flex flex-col items-center gap-8 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-x-12 sm:gap-y-6">

          {/* Mobile (<sm): 3 filas — marca propia sola, Gobierno +
              Patrimonio Cultural + Cabildo, TEA+MUNA — mismo orden que el
              hero, sin la línea vertical (separador pensado para una sola
              fila larga, no para filas cortas). Cada fila centra sus logos
              con flex items-center justify-center, y la columna que las
              envuelve las centra a su vez entre sí, así que cambiar el
              tamaño de cualquiera no descentra nada. La fila de 3 lleva
              alturas y gap más chicos que el resto para entrar en ~327px
              (375px menos el padding): ~265px medidos sobre el ancho
              natural de cada logo. TEA+MUNA se quedan en el -20% original
              sobre desktop (ver esos 2 en el bloque sm+ más abajo). */}
          <div className="flex flex-col items-center gap-6 sm:hidden">
            <img src={logoDiasporasTea} alt="Diásporas Patrimoniales — TEA Tenerife" width={600} height={220} loading="lazy" className="h-14 w-auto object-contain" />
            <div className="flex items-center justify-center gap-5">
              <img src={logoGobCan} alt="Gobierno de Canarias" width={556} height={322} loading="lazy" className="h-14 w-auto object-contain" />
              <img src={logoDiasporasPoster} alt="Patrimonio Cultural de Canarias" width={700} height={350} loading="lazy" className="h-11 w-auto object-contain" />
              <img src={logoCabildoTenerife} alt="Cabildo de Tenerife" width={170} height={206} loading="lazy" className="h-12 w-auto object-contain" />
            </div>
            <div className="flex items-center justify-center gap-8">
              <img src={logoTEA} alt="Tenerife Espacio de las Artes" width={473} height={237} loading="lazy" className="h-[3.36rem] w-auto object-contain" />
              <img src={logoMuna} alt="MUNA — Museo de la Naturaleza y el Hombre" width={640} height={169} loading="lazy" className="h-[2.7rem] w-auto object-contain" />
            </div>
          </div>

          {/* Desktop (sm+): fila única — marca propia sola a la izquierda
              de la línea vertical; a la derecha los colaboradores en el
              mismo orden que el hero (Gobierno · Patrimonio Cultural ·
              Cabildo · TEA · MUNA). */}
          <div className="hidden items-center gap-x-10 gap-y-4 sm:flex sm:flex-wrap">
            <img
              src={logoDiasporasTea}
              alt="Diásporas Patrimoniales — TEA Tenerife"
              width={600}
              height={220}
              loading="lazy"
              className="h-20 w-auto object-contain"
            />
            <div className="h-14 w-px bg-white/20" />
            <img src={logoGobCan} alt="Gobierno de Canarias" width={556} height={322} loading="lazy" className="h-[5.25rem] w-auto object-contain" />
            {/* h-14 (3.5rem) = 70% de los h-20 (5rem) de antes */}
            <img
              src={logoDiasporasPoster}
              alt="Patrimonio Cultural de Canarias"
              width={700}
              height={350}
              loading="lazy"
              className="h-14 w-auto object-contain"
            />
            <img src={logoCabildoTenerife} alt="Cabildo de Tenerife" width={170} height={206} loading="lazy" className="h-[4.2rem] w-auto object-contain lg:ml-4" />
            <img src={logoTEA} alt="Tenerife Espacio de las Artes" width={473} height={237} loading="lazy" className="h-[4.2rem] w-auto object-contain lg:ml-4" />
            <img src={logoMuna} alt="MUNA — Museo de la Naturaleza y el Hombre" width={640} height={169} loading="lazy" className="h-[3.375rem] w-auto object-contain" />
          </div>

          <div className="flex flex-col items-center gap-1 text-center text-sm text-white/80 sm:items-start sm:text-left" style={labelStyle}>
            <p>
              {contactoAntes}
              <a href={`mailto:${CONTACT_EMAIL}`} className="transition-colors hover:text-white">
                {CONTACT_EMAIL}
              </a>
              {contactoDespues}
            </p>
            <p>{t('footer.eventLine')}</p>
            <ul className="mt-3 flex items-center gap-5">
              {REDES.map(red => (
                <li key={red.nombre}>
                  <a
                    href={red.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={red.nombre}
                    title={red.nombre}
                    className="block text-white/80 transition-colors hover:text-white"
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                      {red.icono}
                    </svg>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="h-px w-full bg-white/10" />

        {/* Legal */}
        <div
          className="flex flex-col gap-4 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between"
          style={labelStyle}
        >
          <div className="flex flex-col gap-1">
            <p>{t('footer.rights', { year })}</p>
            <p>{t('footer.legal')}</p>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-white/70">
            <Link to={privacyPath} className="transition-colors hover:text-white">
              {t('footer.privacyLink')}
            </Link>
            <Link to={legalPath} className="transition-colors hover:text-white">
              {t('footer.legalLink')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
