import type { Locale } from '../i18n/config'

// PDF del programa por idioma — alojados en Google Drive (compartidos como
// "cualquier persona con el enlace"). Se abren en el visor de Drive en una
// pestaña nueva. Lo usan ProgramaSection y el HTML prerenderizado
// (src/seo/prerender.ts).
export const PROGRAMA_PDF: Record<Locale, string> = {
  es: 'https://drive.google.com/file/d/14YnrWI-xlMddjQuj7p0w4JXsUwrPl2Me/view?usp=sharing',
  en: 'https://drive.google.com/file/d/1C4-PXxL6cPiX1JWMIKta1s9Egtain8So/view?usp=sharing',
  fr: 'https://drive.google.com/file/d/1tzVk8YvhiDBx0qWOHMuuEsmOoBRPns2h/view?usp=sharing',
  pt: 'https://drive.google.com/file/d/10dur63WJXEbukNitOzfH1hkvh7Zi_ZHb/view?usp=sharing',
}
