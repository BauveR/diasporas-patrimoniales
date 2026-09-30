// "Quería inscribirme a esta actividad pero primero tuve que iniciar
// sesión": lo marca useActividadBooking.handleRequestLogin() justo antes de
// abrir /login desde el botón "Inscribirme" de una tarjeta. Al volver ya con
// sesión, la tarjeta vuelve a montarse (el modal de login reemplaza la ruta
// de la tarjeta) y, al ver esta marca, abre directo el formulario de
// teléfono + privacidad en vez de obligar a pulsar "Inscribirme" otra vez.
//
// Una variable de módulo y no sessionStorage/estado: el login (email o popup
// de Google) nunca recarga la página, y leerla durante el render no dispara
// nada — la tarjeta se re-renderiza sola cuando cambia `user`.
let pendienteId: number | null = null

export function marcarInscripcionPendiente(actividadId: number) {
  pendienteId = actividadId
}

export function getInscripcionPendiente(): number | null {
  return pendienteId
}

export function limpiarInscripcionPendiente() {
  pendienteId = null
}
