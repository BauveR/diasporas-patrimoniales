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
export function formatFechaLarga(yyyyMMdd: string): string {
  return new Date(yyyyMMdd + 'T00:00:00').toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}
