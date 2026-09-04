import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import es from './locales/es.json'
import en from './locales/en.json'
import fr from './locales/fr.json'
import pt from './locales/pt.json'

// Language lives in the URL (see App.tsx), not detected from the browser —
// keeps the active locale a pure function of the current route instead of
// a second, possibly-conflicting source of truth.
export const DEFAULT_LOCALE = 'es'
export const SUPPORTED_LOCALES = ['en', 'fr', 'pt'] as const
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]
export type Locale = SupportedLocale | typeof DEFAULT_LOCALE
export const ALL_LOCALES = [DEFAULT_LOCALE, ...SUPPORTED_LOCALES] as const

// BCP 47 tags for Intl/toLocaleDateString calls elsewhere in the app.
export const LOCALE_TAGS: Record<Locale, string> = {
  es: 'es-ES',
  en: 'en-US',
  fr: 'fr-FR',
  pt: 'pt-PT',
}

export function isSupportedLocale(value: string | undefined): value is SupportedLocale {
  return !!value && (SUPPORTED_LOCALES as readonly string[]).includes(value)
}

i18n.use(initReactI18next).init({
  resources: {
    es: { translation: es },
    en: { translation: en },
    fr: { translation: fr },
    pt: { translation: pt },
  },
  lng: DEFAULT_LOCALE,
  fallbackLng: DEFAULT_LOCALE,
  interpolation: { escapeValue: false }, // React already escapes output
})

export default i18n
