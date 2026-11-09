import type { Locale } from '../i18n/config'

// PDF del programa por idioma — alojados en Google Drive (compartidos como
// "cualquier persona con el enlace"). Se abren en el visor de Drive en una
// pestaña nueva. Lo usan ProgramaSection y el HTML prerenderizado
// (src/seo/prerender.ts).
export const PROGRAMA_PDF: Record<Locale, string> = {
  es: 'https://drive.google.com/file/d/1tpi-UrKDMvtU8MQF5-hZo3BZamNSTL1X/view?usp=sharing',
  en: 'https://drive.google.com/file/d/1TX_70HCSzCuLZB53c4TswCUkqZnix58Z/view?usp=sharing',
  fr: 'https://drive.google.com/file/d/1BiXloL87Kmd2rqrZJR1Wy9ZvRhCinr9O/view?usp=sharing',
  pt: 'https://drive.google.com/file/d/1KGT9BeLw_DsClifssfaO3UiDAvJCOFXp/view?usp=sharing',
}
