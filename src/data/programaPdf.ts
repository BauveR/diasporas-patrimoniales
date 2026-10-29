import type { Locale } from '../i18n/config'

// PDF del programa por idioma — alojados en Google Drive (compartidos como
// "cualquier persona con el enlace"). Se abren en el visor de Drive en una
// pestaña nueva. Lo usan ProgramaSection y el HTML prerenderizado
// (src/seo/prerender.ts).
export const PROGRAMA_PDF: Record<Locale, string> = {
  es: 'https://drive.google.com/file/d/1TQMbdSbtxpvMaoup7mpgdOOO3qY_pNEp/view?usp=sharing',
  en: 'https://drive.google.com/file/d/1uzz4hqMbHI14h-PLhy5fJAYeJZHwUk6I/view?usp=sharing',
  fr: 'https://drive.google.com/file/d/1948xOgvanTA2H6rT6MdE96aV_nBcDxHF/view?usp=sharing',
  pt: 'https://drive.google.com/file/d/1tPipoJSycMxMFrQmTf8poeME7KbR8Epx/view?usp=sharing',
}
