import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { DEFAULT_LOCALE } from '../i18n/config'
import { getLocaleFromPathname } from '../i18n/routing'
import logoDiasporasTea from '../assets/diásporas patrimoniales tea tenerife-12.png'
import logoDiasporasPoster from '../assets/posters diasporas-16.png'
import logoGobCan from '../assets/Logo_GobCan_claim_blanco_mod1-01.png'
import logoCabildoTenerife from '../assets/cabildo-de-tenerife [Converted]-01.png'
import logoTEA from '../assets/tenerife-espacio-de-las-artes [Converted]-01.png'
import logoMuna from '../assets/15-Logo-MUNA-Museos-de-Tenerife-Naturaleza-y-Arqueologia-750x750.png'

const labelStyle = { fontFamily: "'Open Sans', sans-serif" }

export function Footer() {
  const year = new Date().getFullYear()
  const { t } = useTranslation()
  const location = useLocation()
  const locale = getLocaleFromPathname(location.pathname)
  const privacyPath = locale === DEFAULT_LOCALE ? '/privacidad' : `/${locale}/privacidad`

  return (
    <footer style={{ backgroundColor: '#9b2923' }}>
      <div className="mx-auto flex max-w-7xl flex-col gap-10 px-6 py-12 sm:px-8 lg:px-10">

        {/* Marca propia + contacto + colaboradores */}
        <div className="flex flex-wrap items-start justify-between gap-x-12 gap-y-6">
          <div className="flex flex-wrap items-center gap-x-10 gap-y-4">
            <img
              src={logoDiasporasTea}
              alt="Diásporas Patrimoniales — TEA Tenerife"
              className="h-20 w-auto object-contain"
            />
            <img
              src={logoDiasporasPoster}
              alt="Diásporas Patrimoniales"
              className="ml-8 h-20 w-auto object-contain"
            />
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
              <img src={logoGobCan} alt="Gobierno de Canarias" className="h-[5.25rem] w-auto object-contain" />
              <img src={logoCabildoTenerife} alt="Cabildo de Tenerife" className="h-[4.2rem] w-auto object-contain" />
              <img src={logoTEA} alt="Tenerife Espacio de las Artes" className="h-[4.2rem] w-auto object-contain" />
              <img src={logoMuna} alt="MUNA — Museo de la Naturaleza y el Hombre" className="h-[3.375rem] w-auto object-contain" />
            </div>
            <div className="flex flex-col gap-1 text-sm text-white/80" style={labelStyle}>
              <a href="mailto:diasporaspatrimoniales@gmail.com" className="transition-colors hover:text-white">
                diasporaspatrimoniales@gmail.com
              </a>
              <p>{t('footer.eventLine')}</p>
            </div>
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
            <span className="text-white/40">{t('footer.legalPending')}</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
