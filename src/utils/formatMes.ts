import i18n, { DEFAULT_LOCALE, LOCALE_TAGS, type Locale } from '../i18n/config'

// Extraído de la extinta FilterSheet.tsx (filtro multi-sede/isla/mes/temática
// eliminado junto con el resto de esa plantilla) — sigue haciendo falta acá
// porque AdminPage.tsx > ControlAsistentes usa el mismo formato de mes en su
// selector de "ver inscritos por evento".
export function formatMes(yyyyMM: string) {
  const [year, month] = yyyyMM.split('-')
  const s = new Date(Number(year), Number(month) - 1, 1)
    .toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// "jueves, 12 de noviembre de 2026" — mismo formato exacto repetido antes en
// ActividadExpandido/AmbosDiasExpandido/ActividadPage, cada uno con su propia
// copia de `new Date(fecha + 'T00:00:00').toLocaleDateString('es-ES', {...})`.
// No cubre las variantes con mes corto o sin día de semana que usan
// AdminPage.tsx/BookingWidget.tsx — esas son formatos distintos a propósito,
// no la misma duplicación.
// En el idioma activo de la web (antes siempre en español, también en /en,
// /fr y /pt). formatMes() de arriba sigue en español: solo lo usa el panel admin.
export function etiquetaIdioma(): string {
  return LOCALE_TAGS[i18n.language as Locale] ?? LOCALE_TAGS[DEFAULT_LOCALE]
}

export function formatFechaLarga(yyyyMMdd: string): string {
  return new Date(yyyyMMdd + 'T00:00:00').toLocaleDateString(etiquetaIdioma(), {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

// "12 de noviembre" / "12 November" — para "¡Nos vemos el …!".
export function formatFechaDiaMes(yyyyMMdd: string): string {
  return new Date(yyyyMMdd + 'T00:00:00').toLocaleDateString(etiquetaIdioma(), { day: 'numeric', month: 'long' })
}

// "12 de noviembre de 2026" — para "Las inscripciones abren el …".
export function formatFechaDiaMesAnio(yyyyMMdd: string): string {
  return new Date(yyyyMMdd + 'T00:00:00').toLocaleDateString(etiquetaIdioma(), { day: 'numeric', month: 'long', year: 'numeric' })
}
