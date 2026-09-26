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

export function Footer() {
  const year = new Date().getFullYear()
  const { t } = useTranslation()
  const location = useLocation()
  const locale = getLocaleFromPathname(location.pathname)
  const privacyPath = locale === DEFAULT_LOCALE ? '/privacidad' : `/${locale}/privacidad`
  // contacto.parrafo trae el email incrustado en la oración (así lo pide el
  // documento en las 4 lenguas) — se parte por ese string para que siga
  // siendo un mailto clicable en vez de mostrarlo dos veces.
  const [contactoAntes, contactoDespues] = t('contacto.parrafo').split(CONTACT_EMAIL)

  return (
    <footer id="footer" className="scroll-mt-16 bg-brand-red">
      <div className="mx-auto flex max-w-7xl flex-col gap-10 px-6 py-12 sm:px-8 lg:px-10">

        {/* Marca propia + colaboradores, en una sola fila (antes los 4 logos
            de abajo vivían en su propia fila aparte) + contacto */}
        <div className="flex flex-wrap items-start justify-between gap-x-12 gap-y-6">
          <div className="flex flex-wrap items-center gap-x-10 gap-y-4">
            <img
              src={logoDiasporasTea}
              alt="Diásporas Patrimoniales — TEA Tenerife"
              width={600}
              height={220}
              loading="lazy"
              className="h-20 w-auto object-contain"
            />
            {/* h-14 (3.5rem) = 70% de los h-20 (5rem) de antes */}
            <img
              src={logoDiasporasPoster}
              alt="Patrimonio Cultural de Canarias"
              width={700}
              height={350}
              loading="lazy"
              className="h-14 w-auto object-contain"
            />
            <div className="h-14 w-px bg-white/20" />
            <img src={logoGobCan} alt="Gobierno de Canarias" width={556} height={322} loading="lazy" className="h-[5.25rem] w-auto object-contain" />
            <img src={logoCabildoTenerife} alt="Cabildo de Tenerife" width={170} height={206} loading="lazy" className="h-[4.2rem] w-auto object-contain" />
            <img src={logoTEA} alt="Tenerife Espacio de las Artes" width={473} height={237} loading="lazy" className="h-[4.2rem] w-auto object-contain" />
            <img src={logoMuna} alt="MUNA — Museo de la Naturaleza y el Hombre" width={640} height={169} loading="lazy" className="h-[3.375rem] w-auto object-contain" />
          </div>
          <div className="flex flex-col gap-1 text-sm text-white/80" style={labelStyle}>
            <p>
              {contactoAntes}
              <a href={`mailto:${CONTACT_EMAIL}`} className="transition-colors hover:text-white">
                {CONTACT_EMAIL}
              </a>
              {contactoDespues}
            </p>
            <p>{t('footer.eventLine')}</p>
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
