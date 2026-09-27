import { DEFAULT_LOCALE, isSupportedLocale, type Locale } from './config'

const PREFIX_RE = /^\/([a-z]{2})(?=\/|$)/

// Single source of truth for the URL<->locale mapping, shared by App's
// route-driven language sync and the Navbar's language switcher — both need
// the exact same "strip/add the 2-letter prefix" logic, and having it live
// in two places would let them drift out of sync.

// Spanish (the default) has no URL prefix; en/fr/pt are prefixed
// (/en/..., /fr/..., /pt/...). Any other/unknown 2-letter segment is
// treated as "no locale prefix" rather than guessed at.
export function getLocaleFromPathname(pathname: string): Locale {
  const match = pathname.match(PREFIX_RE)
  return match && isSupportedLocale(match[1]) ? match[1] : DEFAULT_LOCALE
}

// Rewrites `pathname` to the equivalent URL for `targetLocale`, preserving
// whatever page/path it already pointed to.
export function localizePathname(pathname: string, targetLocale: Locale): string {
  const match = pathname.match(PREFIX_RE)
  const hasKnownPrefix = match && isSupportedLocale(match[1])
  const rest = hasKnownPrefix ? pathname.slice(match![0].length) || '/' : pathname

  if (targetLocale === DEFAULT_LOCALE) return rest
  return rest === '/' ? `/${targetLocale}` : `/${targetLocale}${rest}`
}
