// Fecha en Canarias (Atlantic/Canary) — el "hoy" del simposio. La usan los
// contadores de conexión (api/conexion.ts) y el tope diario de correos de
// confirmación (api/send-email.ts).
export function diaDe(fecha: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Atlantic/Canary' }).format(fecha)
}
