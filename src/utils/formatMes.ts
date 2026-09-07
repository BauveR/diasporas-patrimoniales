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
