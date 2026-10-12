import i18n from '../i18n/config'

// Pide al servidor el correo de confirmación de una inscripción ya hecha.
// Devuelve si salió: antes el fallo era silencioso (ni la persona ni nadie se
// enteraba si llegaba el tope diario o fallaba Resend). La inscripción ya está
// completada en cualquier caso — esto solo decide si se avisa en la tarjeta.
export async function enviarCorreoConfirmacion(
  user: { getIdToken: () => Promise<string> },
  actividadIds: number[],
): Promise<boolean> {
  try {
    const idToken = await user.getIdToken()
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken, actividadIds, idioma: i18n.language }),
    })
    if (!res.ok) console.warn('[correo] no se envió la confirmación:', res.status)
    return res.ok
  } catch (err) {
    console.warn('[correo] no se envió la confirmación:', err)
    return false
  }
}
