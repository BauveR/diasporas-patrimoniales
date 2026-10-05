import { useLocation } from 'react-router-dom'
import { ALL_LOCALES, DEFAULT_LOCALE, LOCALE_TAGS } from '../i18n/config'
import { getLocaleFromPathname, localizePathname } from '../i18n/routing'

// Dominio final del sitio. Exportado para que otros usos de URL absoluta
// (ej. ShareButton, o el email de confirmación en api/) se mantengan en
// sincro con este único valor.
export const SITE_URL = 'https://www.diasporaspatrimoniales.com'

type Props = { title: string; description: string }

// React 19 hoists <title>/<meta>/<link> rendered anywhere in the tree up to
// <head> automatically — no react-helmet-async needed. One alternate link
// per supported locale (plus x-default pointing at Spanish, the fallback)
// tells crawlers these are translations of the same page, not duplicate
// content, and lets them serve the right language variant directly.
export function SeoHead({ title, description }: Props) {
  const location = useLocation()
  const currentLocale = getLocaleFromPathname(location.pathname)
  const url = `${SITE_URL}${location.pathname}`

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="Diásporas Patrimoniales" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={`${SITE_URL}/og-image.jpg`} />
      <meta property="og:image:width" content="945" />
      <meta property="og:image:height" content="945" />
      <meta property="og:locale" content={LOCALE_TAGS[currentLocale].replace('-', '_')} />
      <meta name="twitter:card" content="summary" />
      {ALL_LOCALES.map(locale => (
        <link
          key={locale}
          rel="alternate"
          hrefLang={LOCALE_TAGS[locale]}
          href={`${SITE_URL}${localizePathname(location.pathname, locale)}`}
        />
      ))}
      <link
        rel="alternate"
        hrefLang="x-default"
        href={`${SITE_URL}${localizePathname(location.pathname, DEFAULT_LOCALE)}`}
      />
    </>
  )
}
