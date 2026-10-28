import type { Locale } from '../i18n/config'

// PDF del programa por idioma — alojados en Google Drive (compartidos como
// "cualquier persona con el enlace"). Se abren en el visor de Drive en una
// pestaña nueva. Lo usan ProgramaSection y el HTML prerenderizado
// (src/seo/prerender.ts).
export const PROGRAMA_PDF: Record<Locale, string> = {
  es: 'https://drive.google.com/file/d/1i-kbfSP1t8OS8R-1CDidNtNsw58NUzZ9/view?usp=sharing',
  en: 'https://drive.google.com/file/d/1nArPwrEmgJwEm6P2SG71yoGJlbTEJoBZ/view?usp=sharing',
  fr: 'https://drive.google.com/file/d/1Gn8E2LgLHFL3KFXozp7yReV2XnSY5qua/view?usp=sharing',
  pt: 'https://drive.google.com/file/d/1DG0d45Qpd5BcS3iaXx6yYitfIQRStusa/view?usp=sharing',
}
