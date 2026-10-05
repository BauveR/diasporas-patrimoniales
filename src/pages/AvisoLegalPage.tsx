import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { DEFAULT_LOCALE } from '../i18n/config'
import { getLocaleFromPathname } from '../i18n/routing'
import { labelStyle } from '../lib/styles'
import { SeoHead } from '../components/SeoHead'

const titleStyle = { fontFamily: "'Google Sans Flex', sans-serif", fontVariationSettings: "'wght' 100" }
const CONTACT_EMAIL = 'diasporaspatrimoniales@gmail.com'

// Datos del titular exigidos por la LSSI-CE (art. 10) — pendientes de que
// la organización los confirme. Mientras valgan null no se muestran; basta
// con completarlos acá para que aparezcan en los 4 idiomas.
const TITULAR = {
  titular: null as string | null,
  nif: null as string | null,
  domicilio: null as string | null,
  registro: null as string | null,
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-base font-semibold text-stone-800" style={labelStyle}>{title}</h2>
      <div className="text-sm text-stone-500 leading-relaxed flex flex-col gap-2" style={labelStyle}>
        {children}
      </div>
    </div>
  )
}

export function AvisoLegalPage() {
  const { t } = useTranslation()
  const location = useLocation()
  const locale = getLocaleFromPathname(location.pathname)
  const privacyPath = locale === DEFAULT_LOCALE ? '/privacidad' : `/${locale}/privacidad`
  const datosTitular = (Object.keys(TITULAR) as (keyof typeof TITULAR)[]).filter(k => TITULAR[k])

  return (
    <main className="min-h-screen bg-white pt-navbar" style={labelStyle}>
      <SeoHead title={t('meta.avisoLegalTitle')} description={t('meta.avisoLegalDescription')} />
      <div className="max-w-2xl mx-auto px-6 py-14 flex flex-col gap-10">

        <div className="flex flex-col gap-3">
          <p className="text-[10px] tracking-[0.25em] uppercase text-stone-400">{t('avisoLegal.eyebrow')}</p>
          <h1 className="text-4xl uppercase tracking-tight text-stone-800" style={titleStyle}>
            {t('avisoLegal.titulo')}
          </h1>
          <p className="text-xs text-stone-400">{t('avisoLegal.actualizacion')}</p>
        </div>

        <div className="w-full h-px bg-stone-100" />

        <Section title={t('avisoLegal.titularTitulo')}>
          <ul className="flex flex-col gap-1">
            {datosTitular.map(k => (
              <li key={k}><strong>{t(`avisoLegal.${k}`)}:</strong> {TITULAR[k]}</li>
            ))}
            <li>
              <strong>{t('avisoLegal.contacto')}:</strong>{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="underline underline-offset-2 hover:text-stone-700 transition-colors">
                {CONTACT_EMAIL}
              </a>
            </li>
          </ul>
        </Section>

        <Section title={t('avisoLegal.objetoTitulo')}>
          <p>{t('avisoLegal.objeto')}</p>
        </Section>

        <Section title={t('avisoLegal.contenidosTitulo')}>
          <p>{t('avisoLegal.contenidos')}</p>
        </Section>

        <Section title={t('avisoLegal.propiedadTitulo')}>
          <p>{t('avisoLegal.propiedad')}</p>
        </Section>

        <Section title={t('avisoLegal.enlacesTitulo')}>
          <p>{t('avisoLegal.enlaces')}</p>
        </Section>

        <Section title={t('avisoLegal.datosTitulo')}>
          <p>
            {t('avisoLegal.datosAntes')}
            <Link to={privacyPath} className="underline underline-offset-2 hover:text-stone-700 transition-colors">
              {t('avisoLegal.datosLink')}
            </Link>
            {t('avisoLegal.datosDespues')}
          </p>
        </Section>

        <Section title={t('avisoLegal.legislacionTitulo')}>
          <p>{t('avisoLegal.legislacion')}</p>
        </Section>

      </div>
    </main>
  )
}
