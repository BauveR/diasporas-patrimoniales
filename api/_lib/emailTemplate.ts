export type ProgramaItemEmail = {
  hora: string
  titulo: string
  moderador?: string
}

export type DiaEmailData = {
  titulo: string
  fecha: string
  hora: string
  duracion: string
  programa: ProgramaItemEmail[]
}

export type ConfirmacionEmailData = {
  nombre: string
  dias: DiaEmailData[]
  contacto: string
  sedeNombre?: string
  sedeIsla?: string
}

// Sin librería de templating: el volumen de este único email no lo justifica
// y evita sumar una dependencia server-side más. Todo el contenido variable
// pasa por escapeHtml — viene de Firestore (admin, ya lo escribió el propio
// usuario vía inscribirse()) o de programa.ts (dato estático del repo), no
// de un input libre en esta función, pero se sanea igual por si algún campo
// de actividad/sede trae caracteres HTML.
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const ROJO = '#9b2923'
const GRIS = '#78716c'
const NEGRO = '#1c1917'

// Mismo dominio que SITE_URL en src/components/SeoHead.tsx — se duplica en
// vez de importarlo para no meter react-router-dom (y el resto de ese
// módulo) en el bundle de esta función serverless por una sola constante.
// Los archivos de fuente viven en public/fonts/ (no en src/assets/fonts/,
// que Vite hashea en cada build) para tener URLs absolutas estables a las
// que el email pueda apuntar.
const SITE_URL = 'https://diasporaspatrimoniales.com'
const MATTONE_BOLD_URL = `${SITE_URL}/fonts/Mattone-Bold.woff2`
const GAMBETTA_BOLDITALIC_URL = `${SITE_URL}/fonts/Gambetta-BoldItalic.woff2`

function renderPrograma(programa: ProgramaItemEmail[]): string {
  if (programa.length === 0) return ''
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 0;">
      ${programa
        .map(
          item => `
        <tr>
          <td style="padding:5px 12px 5px 0;color:${ROJO};font-size:13px;font-weight:700;white-space:nowrap;vertical-align:top;">${escapeHtml(item.hora)}</td>
          <td style="padding:5px 0;font-size:13px;color:${NEGRO};vertical-align:top;">
            ${escapeHtml(item.titulo)}${item.moderador ? ` <span style="color:${GRIS};">· Modera ${escapeHtml(item.moderador)}</span>` : ''}
          </td>
        </tr>`
        )
        .join('')}
    </table>`
}

// Banner rojo teja con la fecha de la jornada, siempre visible (antes solo
// aparecía cuando el email cubría las 2 jornadas) — así queda resaltada
// también en el email de un solo día, no solo mencionada de paso en el
// párrafo de arriba.
function renderDia(dia: DiaEmailData): string {
  return `
    <div style="margin-bottom:20px;">
      <div style="background:${ROJO};color:#ffffff;border-radius:8px;padding:10px 14px;margin-bottom:10px;">
        <p style="margin:0;font-size:13px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;">${escapeHtml(dia.titulo)}</p>
        <p style="margin:2px 0 0;font-size:12px;color:rgba(255,255,255,0.85);text-transform:capitalize;">${escapeHtml(dia.fecha)}${dia.hora ? ` · ${escapeHtml(dia.hora)}` : ''}${dia.duracion ? ` · ${escapeHtml(dia.duracion)}` : ''}</p>
      </div>
      ${renderPrograma(dia.programa)}
    </div>`
}

export function renderConfirmacionEmail(data: ConfirmacionEmailData): { subject: string; html: string; text: string } {
  const sede = [data.sedeNombre, data.sedeIsla].filter(Boolean).join(', ')
  const esCombinado = data.dias.length > 1
  const subject = esCombinado
    ? 'Confirmación de inscripción — Ambos días'
    : `Confirmación de inscripción — ${data.dias[0]?.titulo ?? ''}`

  const diasHtml = data.dias.map(dia => renderDia(dia)).join('')

  // Filas de logística en texto plano — usadas tal cual en la versión text.
  const filasLogistica: [string, string][] = [
    ['Sede', sede || '—'],
    ['Contacto', data.contacto],
  ]

  // Contacto puede ser email o teléfono (ver isValidContacto en
  // AdminPage.tsx, el mismo campo) — mailto:/tel: según cuál sea, no un
  // mailto: fijo sin importar el formato. Solo esta fila renderiza como link
  // en la versión html; el resto queda como texto simple.
  const contactoHref = data.contacto.includes('@') ? `mailto:${data.contacto}` : `tel:${data.contacto.replace(/\s+/g, '')}`

  // Blanco + negrita sobre el recuadro oscuro de abajo (antes gris/negro
  // sobre blanco) — label en blanco 70% para diferenciarlo del valor sin
  // salir del blanco que pidió, el valor en blanco pleno.
  const filasLogisticaHtml = filasLogistica
    .map(([label, value]) => {
      const valueHtml = label === 'Contacto'
        ? `<a href="${escapeHtml(contactoHref)}" style="color:#ffffff;text-decoration:underline;">${escapeHtml(value)}</a>`
        : escapeHtml(value)
      return `
        <tr>
          <td style="padding:6px 12px 6px 0;color:rgba(255,255,255,0.7);font-size:13px;font-weight:700;white-space:nowrap;vertical-align:top;">${escapeHtml(label)}</td>
          <td style="padding:6px 0;color:#ffffff;font-size:14px;font-weight:700;">${valueHtml}</td>
        </tr>`
    })
    .join('')

  const intro = esCombinado
    ? 'Tu inscripción a las dos jornadas quedó confirmada. Este es el programa:'
    : `Tu plaza para <strong>${escapeHtml(data.dias[0]?.titulo ?? '')}</strong> quedó confirmada. Este es el programa:`

  const html = `
    <style>
      /* Gmail (web) y Apple/iOS Mail respetan @font-face en emails; Outlook
         de escritorio y otros clientes lo ignoran y caen directo al
         fallback de la regla font-family de abajo — comportamiento normal
         del formato email, no algo que se pueda forzar desde acá. */
      @font-face {
        font-family: 'Mattone';
        src: url('${MATTONE_BOLD_URL}') format('woff2');
        font-weight: 700;
        font-style: normal;
      }
      @font-face {
        font-family: 'Gambetta';
        src: url('${GAMBETTA_BOLDITALIC_URL}') format('woff2');
        font-weight: 700;
        font-style: italic;
      }
    </style>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f4;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;font-family:'Open Sans',Arial,sans-serif;">
            <tr>
              <td style="background:#000000;padding:28px 32px;">
                <p style="margin:0;color:#ffffff;font-size:15px;letter-spacing:0.1em;text-transform:uppercase;font-family:'Mattone','Arial Black',Arial,sans-serif;font-weight:700;">Diásporas Patrimoniales</p>
                <h1 style="margin:6px 0 0;color:#ffffff;font-size:22px;font-style:italic;font-weight:700;font-family:'Gambetta',Georgia,'Times New Roman',serif;">Inscripción confirmada</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;color:${NEGRO};">
                <p style="margin:0 0 4px;font-size:15px;line-height:1.5;font-family:'Mattone','Arial Black',Arial,sans-serif;font-weight:700;">Hola ${escapeHtml(data.nombre)},</p>
                <p style="margin:0 0 20px;font-size:15px;line-height:1.5;">${intro}</p>
                ${diasHtml}
                <div style="margin:20px 0 0;background:${NEGRO};border-radius:10px;padding:16px 18px 18px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${filasLogisticaHtml}</table>
                  <p style="margin:14px 0 0;font-size:13px;line-height:1.5;font-weight:700;color:#ffffff;border-top:1px solid rgba(255,255,255,0.15);padding-top:12px;">Si necesitás liberar tu plaza, podés hacerlo desde tu perfil en el sitio.</p>
                </div>
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="border-radius:8px;background:${ROJO};">
                      <a href="${SITE_URL}/perfil" style="display:inline-block;padding:12px 22px;color:#ffffff;font-size:12px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;text-decoration:none;border-radius:8px;">Ir a tu perfil</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`

  const text = [
    `Hola ${data.nombre},`,
    '',
    esCombinado
      ? 'Tu inscripción a las dos jornadas quedó confirmada.'
      : `Tu plaza para "${data.dias[0]?.titulo ?? ''}" quedó confirmada.`,
    '',
    ...data.dias.flatMap(dia => [
      `${dia.titulo} — ${dia.fecha}${dia.hora ? ` · ${dia.hora}` : ''}${dia.duracion ? ` · ${dia.duracion}` : ''}`,
      ...dia.programa.map(item => `  ${item.hora} — ${item.titulo}${item.moderador ? ` (Modera ${item.moderador})` : ''}`),
      '',
    ]),
    ...filasLogistica.map(([label, value]) => `${label}: ${value}`),
    '',
    'Si necesitás liberar tu plaza, podés hacerlo desde tu perfil en el sitio:',
    `${SITE_URL}/perfil`,
    '',
    'Diásporas Patrimoniales',
  ].join('\n')

  return { subject, html, text }
}
