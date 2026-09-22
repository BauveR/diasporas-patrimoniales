export type ConfirmacionEmailData = {
  nombre: string
  titulo: string
  fecha: string
  hora: string
  duracion: string
  puntoEncuentro: string
  organizador: string
  contacto: string
  sedeNombre?: string
  sedeIsla?: string
}

// Sin librería de templating: el volumen de este único email no lo justifica
// y evita sumar una dependencia server-side más. Todo el contenido variable
// pasa por escapeHtml — viene de Firestore (admin, ya lo escribió el propio
// usuario vía inscribirse()), no de un input libre en esta función, pero se
// sanea igual por si algún campo de actividad/sede trae caracteres HTML.
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function renderConfirmacionEmail(data: ConfirmacionEmailData): { subject: string; html: string; text: string } {
  const sede = [data.sedeNombre, data.sedeIsla].filter(Boolean).join(', ')
  const subject = `Confirmación de inscripción — ${data.titulo}`

  const filas: [string, string][] = [
    ['Fecha', data.fecha],
    ['Hora', data.hora],
    ['Duración', data.duracion],
    ['Sede', sede || '—'],
    ['Punto de encuentro', data.puntoEncuentro],
    ['Organiza', data.organizador],
    ['Contacto', data.contacto],
  ]

  const filasHtml = filas
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:6px 12px 6px 0;color:#78716c;font-size:14px;white-space:nowrap;">${escapeHtml(label)}</td>
          <td style="padding:6px 0;color:#292524;font-size:14px;">${escapeHtml(value)}</td>
        </tr>`
    )
    .join('')

  const html = `
    <div style="font-family:'Open Sans',Arial,sans-serif;max-width:560px;margin:0 auto;color:#292524;">
      <h1 style="font-size:20px;color:#9b2923;margin:0 0 16px;">Inscripción confirmada</h1>
      <p style="font-size:15px;line-height:1.5;">Hola ${escapeHtml(data.nombre)},</p>
      <p style="font-size:15px;line-height:1.5;">Tu plaza para <strong>${escapeHtml(data.titulo)}</strong> quedó confirmada. Estos son los datos:</p>
      <table cellpadding="0" cellspacing="0" style="margin:16px 0;">${filasHtml}</table>
      <p style="font-size:13px;line-height:1.5;color:#78716c;">Si necesitás liberar tu plaza, podés hacerlo desde tu perfil en el sitio.</p>
      <p style="font-size:15px;margin-top:24px;">Diásporas Patrimoniales</p>
    </div>`

  const text = [
    `Hola ${data.nombre},`,
    '',
    `Tu plaza para "${data.titulo}" quedó confirmada.`,
    '',
    ...filas.map(([label, value]) => `${label}: ${value}`),
    '',
    'Si necesitás liberar tu plaza, podés hacerlo desde tu perfil en el sitio.',
    '',
    'Diásporas Patrimoniales',
  ].join('\n')

  return { subject, html, text }
}
