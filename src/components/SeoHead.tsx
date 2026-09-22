import { useLocation } from 'react-router-dom'
import { ALL_LOCALES, DEFAULT_LOCALE, LOCALE_TAGS } from '../i18n/config'
import { getLocaleFromPathname, localizePathname } from '../i18n/routing'

// TODO: swap in the real production domain once it's live — needed for
// absolute hreflang/canonical URLs to be meaningful to crawlers. Exported so
// other absolute-URL use sites (e.g. ShareButton links) stay in sync with it.
export const SITE_URL = 'https://diasporas-patrimoniales.example'

type Props = { title: string; description: string }

// React 19 hoists <title>/<meta>/<link> rendered anywhere in the tree up to
// <head> automatically — no react-helmet-async needed. One alternate link
// per supported locale (plus x-default pointing at Spanish, the fallback)
// tells crawlers these are translations of the same page, not duplicate
// content, and lets them serve the right language variant directly.
export function SeoHead({ title, description }: Props) {
  const location = useLocation()
  const currentLocale = getLocaleFromPathname(location.pathname)

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:locale" content={LOCALE_TAGS[currentLocale]} />
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
