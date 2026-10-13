import type { Locale } from '../i18n/config'

// PDF del programa por idioma — alojados en Google Drive (compartidos como
// "cualquier persona con el enlace"). Se abren en el visor de Drive en una
// pestaña nueva. Lo usan ProgramaSection y el HTML prerenderizado
// (src/seo/prerender.ts).
export const PROGRAMA_PDF: Record<Locale, string> = {
  es: 'https://drive.google.com/file/d/1vZt24eJr7r56ZhCx5wqpxsnYZKMFHV1z/view?usp=sharing',
  en: 'https://drive.google.com/file/d/1y2W5w1EBslboxaj9NMonqka_R_REVef4/view?usp=sharing',
  fr: 'https://drive.google.com/file/d/1pPAkD40tr9J0dB2PNpgNRIbB24ssw2a7/view?usp=sharing',
  pt: 'https://drive.google.com/file/d/1ibWtTWN0nP3SEgJyz4hF5BH6Fj1RwgGV/view?usp=sharing',
}
