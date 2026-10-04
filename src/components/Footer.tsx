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

          {/* Mobile (<sm): 3 filas — marca propia, Gobierno+Cabildo,
              TEA+MUNA — sin la línea vertical (separador pensado para una
              sola fila larga, no para filas de 2). Cada fila centra su
              par de logos con flex items-center justify-center, y la
              columna que las envuelve las centra a su vez entre sí, así
              que cambiar el tamaño de cualquiera no descentra nada.
              Alturas: Diásporas TEA a -30% (h-14) sobre su tamaño de
              desktop de antes; Patrimonio Cultural a -20% (h-16, igual
              que en el bloque desktop de abajo); Gobierno+Cabildo parten
              de -20% sobre desktop y luego +20% sobre ese valor (quedan
              en h-[5.04rem]/h-[4.032rem]); TEA+MUNA se quedan en el
              -20% original sobre desktop (ver esos 2 en el bloque sm+
              más abajo). */}
          <div className="flex flex-col items-center gap-6 sm:hidden">
            <div className="flex items-center justify-center gap-8">
              <img src={logoDiasporasTea} alt="Diásporas Patrimoniales — TEA Tenerife" width={600} height={220} loading="lazy" className="h-14 w-auto object-contain" />
              <img src={logoDiasporasPoster} alt="Patrimonio Cultural de Canarias" width={700} height={350} loading="lazy" className="h-16 w-auto object-contain" />
            </div>
            <div className="flex items-center justify-center gap-8">
              <img src={logoGobCan} alt="Gobierno de Canarias" width={556} height={322} loading="lazy" className="h-[5.04rem] w-auto -translate-x-4 object-contain" />
              <img src={logoCabildoTenerife} alt="Cabildo de Tenerife" width={170} height={206} loading="lazy" className="h-[4.032rem] w-auto object-contain" />
            </div>
            <div className="flex items-center justify-center gap-8">
              <img src={logoTEA} alt="Tenerife Espacio de las Artes" width={473} height={237} loading="lazy" className="h-[3.36rem] w-auto object-contain" />
              <img src={logoMuna} alt="MUNA — Museo de la Naturaleza y el Hombre" width={640} height={169} loading="lazy" className="h-[2.7rem] w-auto object-contain" />
            </div>
          </div>

          {/* Desktop (sm+): la fila única con línea vertical, sin cambios. */}
          <div className="hidden items-center gap-x-10 gap-y-4 sm:flex sm:flex-wrap">
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

          <div className="flex flex-col items-center gap-1 text-center text-sm text-white/80 sm:items-start sm:text-left" style={labelStyle}>
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
            <Link to={legalPath} className="transition-colors hover:text-white">
              {t('footer.legalLink')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
