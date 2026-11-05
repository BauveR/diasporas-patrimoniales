import type { Locale } from '../i18n/config'

// PDF del programa por idioma — alojados en Google Drive (compartidos como
// "cualquier persona con el enlace"). Se abren en el visor de Drive en una
// pestaña nueva. Lo usan ProgramaSection y el HTML prerenderizado
// (src/seo/prerender.ts).
export const PROGRAMA_PDF: Record<Locale, string> = {
  es: 'https://drive.google.com/file/d/1aAQG-chsqXxgudp6Ew7Vd8DFmZ5_bSns/view?usp=sharing',
  en: 'https://drive.google.com/file/d/1qCZk5O2Su1PfM9xeszQ2gqWinIjgae5M/view?usp=sharing',
  fr: 'https://drive.google.com/file/d/1SPNT9mRLzQZtjm2Q-7K830NW-N7aKrBC/view?usp=sharing',
  pt: 'https://drive.google.com/file/d/1I4daTMZXgNWiErSWTJPkda1kbCM2cQ3b/view?usp=sharing',
}
