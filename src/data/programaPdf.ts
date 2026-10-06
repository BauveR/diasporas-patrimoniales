import type { Locale } from '../i18n/config'

// PDF del programa por idioma — alojados en Google Drive (compartidos como
// "cualquier persona con el enlace"). Se abren en el visor de Drive en una
// pestaña nueva. Lo usan ProgramaSection y el HTML prerenderizado
// (src/seo/prerender.ts).
export const PROGRAMA_PDF: Record<Locale, string> = {
  es: 'https://drive.google.com/file/d/1heKxZWzvbkh5gKqdm-bmGqFqo2Kkksp_/view?usp=sharing',
  en: 'https://drive.google.com/file/d/1taaT5XyfCgs9iTfLnXfjO8E7Eg2ja0hb/view?usp=sharing',
  fr: 'https://drive.google.com/file/d/1SXHxY1X1IEOc4WboEimuLGfq9pCaPmpU/view?usp=sharing',
  pt: 'https://drive.google.com/file/d/1ofSG7eJmknj8qVfSa6oGnqOhUZ9zCkRJ/view?usp=sharing',
}
