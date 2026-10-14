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

export type IdiomaEmail = 'es' | 'en' | 'fr' | 'pt'
export const IDIOMAS_EMAIL: readonly IdiomaEmail[] = ['es', 'en', 'fr', 'pt']

// Textos fijos del correo en el idioma en que se hizo la inscripción. El
// título de la jornada y el programa son datos (Firestore / programa.ts) y
// van tal cual, como en la web.
const TEXTOS: Record<IdiomaEmail, {
  asuntoAmbos: string; asunto: (titulo: string) => string; cabecera: string; hola: (n: string) => string
  introAmbos: string; intro: (tituloHtml: string) => string; introTexto: (titulo: string) => string; introAmbosTexto: string
  sede: string; contacto: string; modera: string; liberar: string; liberarTexto: string; boton: string
  modalidad: string; presencial: string; presencialTitulo: string; presencialEn: (sede: string) => string; presencialSinSede: string
}> = {
  es: {
    asuntoAmbos: 'Confirmación de inscripción — Ambos días', asunto: t => `Confirmación de inscripción — ${t}`,
    cabecera: 'Inscripción confirmada', hola: n => `Hola ${n},`,
    introAmbos: 'Tu inscripción a las dos jornadas quedó confirmada. Este es el programa:',
    intro: t => `Tu plaza para <strong>${t}</strong> quedó confirmada. Este es el programa:`,
    introTexto: t => `Tu plaza para "${t}" quedó confirmada.`, introAmbosTexto: 'Tu inscripción a las dos jornadas quedó confirmada.',
    sede: 'Sede', contacto: 'Contacto', modera: 'Modera',
    liberar: 'Si necesitas liberar tu plaza, puedes hacerlo desde tu perfil en el sitio.',
    liberarTexto: 'Si necesitas liberar tu plaza, puedes hacerlo desde tu perfil en el sitio:', boton: 'Ir a tu perfil',
    modalidad: 'Modalidad', presencial: 'Presencial', presencialTitulo: 'Evento presencial',
    presencialEn: s => `Te esperamos en ${s}.`, presencialSinSede: 'La asistencia es en persona.',
  },
  en: {
    asuntoAmbos: 'Registration confirmed — Both days', asunto: t => `Registration confirmed — ${t}`,
    cabecera: 'Registration confirmed', hola: n => `Hello ${n},`,
    introAmbos: 'Your registration for both days is confirmed. Here is the programme:',
    intro: t => `Your place for <strong>${t}</strong> is confirmed. Here is the programme:`,
    introTexto: t => `Your place for "${t}" is confirmed.`, introAmbosTexto: 'Your registration for both days is confirmed.',
    sede: 'Venue', contacto: 'Contact', modera: 'Chair',
    liberar: 'If you need to release your place, you can do so from your profile on the website.',
    liberarTexto: 'If you need to release your place, you can do so from your profile on the website:', boton: 'Go to your profile',
    modalidad: 'Format', presencial: 'In person', presencialTitulo: 'In-person event',
    presencialEn: s => `We look forward to seeing you at ${s}.`, presencialSinSede: 'Attendance is in person.',
  },
  fr: {
    asuntoAmbos: 'Inscription confirmée — Les deux journées', asunto: t => `Inscription confirmée — ${t}`,
    cabecera: 'Inscription confirmée', hola: n => `Bonjour ${n},`,
    introAmbos: 'Votre inscription aux deux journées est confirmée. Voici le programme :',
    intro: t => `Votre place pour <strong>${t}</strong> est confirmée. Voici le programme :`,
    introTexto: t => `Votre place pour « ${t} » est confirmée.`, introAmbosTexto: 'Votre inscription aux deux journées est confirmée.',
    sede: 'Lieu', contacto: 'Contact', modera: 'Modération',
    liberar: 'Si vous devez libérer votre place, vous pouvez le faire depuis votre profil sur le site.',
    liberarTexto: 'Si vous devez libérer votre place, vous pouvez le faire depuis votre profil sur le site :', boton: 'Aller à votre profil',
    modalidad: 'Modalité', presencial: 'En présentiel', presencialTitulo: 'Événement en présentiel',
    presencialEn: s => `Nous vous attendons à ${s}.`, presencialSinSede: 'La participation se fait sur place.',
  },
  pt: {
    asuntoAmbos: 'Inscrição confirmada — Ambos os dias', asunto: t => `Inscrição confirmada — ${t}`,
    cabecera: 'Inscrição confirmada', hola: n => `Olá ${n},`,
    introAmbos: 'A sua inscrição nos dois dias está confirmada. Este é o programa:',
    intro: t => `A sua vaga para <strong>${t}</strong> está confirmada. Este é o programa:`,
    introTexto: t => `A sua vaga para «${t}» está confirmada.`, introAmbosTexto: 'A sua inscrição nos dois dias está confirmada.',
    sede: 'Local', contacto: 'Contacto', modera: 'Moderação',
    liberar: 'Se precisar de libertar a sua vaga, pode fazê-lo a partir do seu perfil no site.',
    liberarTexto: 'Se precisar de libertar a sua vaga, pode fazê-lo a partir do seu perfil no site:', boton: 'Ir para o seu perfil',
    modalidad: 'Modalidade', presencial: 'Presencial', presencialTitulo: 'Evento presencial',
    presencialEn: s => `Esperamos por si em ${s}.`, presencialSinSede: 'A participação é presencial.',
  },
}

export type ConfirmacionEmailData = {
  idioma?: IdiomaEmail
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
// Gris oscuro real (no negro) para el recuadro de sede/contacto — distinto
// a propósito del NEGRO casi puro que usa el header.
const GRIS_OSCURO = '#44403c'

// Mismo dominio que SITE_URL en src/components/SeoHead.tsx — se duplica en
// vez de importarlo para no meter react-router-dom (y el resto de ese
// módulo) en el bundle de esta función serverless por una sola constante.
// Los archivos de fuente viven en public/fonts/ (no en src/assets/fonts/,
// que Vite hashea en cada build) para tener URLs absolutas estables a las
// que el email pueda apuntar.
const SITE_URL = 'https://www.diasporaspatrimoniales.com'
const MATTONE_BOLD_URL = `${SITE_URL}/fonts/Mattone-Bold.woff2`
const GAMBETTA_BOLDITALIC_URL = `${SITE_URL}/fonts/Gambetta-BoldItalic.woff2`

function renderPrograma(programa: ProgramaItemEmail[], modera: string): string {
  if (programa.length === 0) return ''
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 0;">
      ${programa
        .map(
          item => `
        <tr>
          <td style="padding:5px 12px 5px 0;color:${ROJO};font-size:13px;font-weight:700;white-space:nowrap;vertical-align:top;">${escapeHtml(item.hora)}</td>
          <td style="padding:5px 0;font-size:13px;color:${NEGRO};vertical-align:top;">
            ${escapeHtml(item.titulo)}${item.moderador ? ` <span style="color:${GRIS};">· ${escapeHtml(modera)} ${escapeHtml(item.moderador)}</span>` : ''}
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
function renderDia(dia: DiaEmailData, modera: string): string {
  return `
    <div style="margin-bottom:20px;">
      <div style="background:${ROJO};color:#ffffff;border-radius:8px;padding:10px 14px;margin-bottom:10px;">
        <p style="margin:0;font-size:13px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;">${escapeHtml(dia.titulo)}</p>
        <p style="margin:2px 0 0;font-size:12px;color:rgba(255,255,255,0.85);text-transform:capitalize;">${escapeHtml(dia.fecha)}${dia.hora ? ` · ${escapeHtml(dia.hora)}` : ''}${dia.duracion ? ` · ${escapeHtml(dia.duracion)}` : ''}</p>
      </div>
      ${renderPrograma(dia.programa, modera)}
    </div>`
}

export function renderConfirmacionEmail(data: ConfirmacionEmailData): { subject: string; html: string; text: string } {
  const idioma: IdiomaEmail = data.idioma ?? 'es'
  const tx = TEXTOS[idioma]
  const prefijo = idioma === 'es' ? '' : `/${idioma}`
  const urlPerfil = `${SITE_URL}${prefijo}/perfil`
  const sede = [data.sedeNombre, data.sedeIsla].filter(Boolean).join(', ')
  const esCombinado = data.dias.length > 1
  const subject = esCombinado ? tx.asuntoAmbos : tx.asunto(data.dias[0]?.titulo ?? '')

  const diasHtml = data.dias.map(dia => renderDia(dia, tx.modera)).join('')

  // Filas de logística en texto plano — usadas tal cual en la versión text.
  const filasLogistica: [string, string][] = [
    [tx.modalidad, tx.presencial],
    [tx.sede, sede || '—'],
    [tx.contacto, data.contacto],
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
      const valueHtml = label === tx.contacto
        ? `<a href="${escapeHtml(contactoHref)}" style="color:#ffffff;text-decoration:underline;">${escapeHtml(value)}</a>`
        : escapeHtml(value)
      return `
        <tr>
          <td style="padding:6px 12px 6px 0;color:rgba(255,255,255,0.7);font-size:13px;font-weight:700;white-space:nowrap;vertical-align:top;">${escapeHtml(label)}</td>
          <td style="padding:6px 0;color:#ffffff;font-size:14px;font-weight:700;">${valueHtml}</td>
        </tr>`
    })
    .join('')

  // El simposio es presencial: se destaca arriba, justo tras el saludo y
  // antes del programa, además de la fila "Modalidad" de abajo.
  const presencialDetalle = sede ? tx.presencialEn(sede) : tx.presencialSinSede

  const intro = esCombinado ? tx.introAmbos : tx.intro(escapeHtml(data.dias[0]?.titulo ?? ''))

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
                <h1 style="margin:6px 0 0;color:#ffffff;font-size:22px;font-style:italic;font-weight:700;font-family:'Gambetta',Georgia,'Times New Roman',serif;">${escapeHtml(tx.cabecera)}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;color:${NEGRO};">
                <p style="margin:0 0 4px;font-size:15px;line-height:1.5;font-family:'Mattone','Arial Black',Arial,sans-serif;font-weight:700;">${escapeHtml(tx.hola(data.nombre))}</p>
                <div style="margin:12px 0 16px;border-left:4px solid ${ROJO};background:#fbeee9;border-radius:6px;padding:12px 16px;">
                  <p style="margin:0;font-size:15px;line-height:1.4;font-weight:700;color:${ROJO};text-transform:uppercase;letter-spacing:0.04em;font-family:'Mattone','Arial Black',Arial,sans-serif;">${escapeHtml(tx.presencialTitulo)}</p>
                  <p style="margin:4px 0 0;font-size:14px;line-height:1.5;color:${NEGRO};">${escapeHtml(presencialDetalle)}</p>
                </div>
                <p style="margin:0 0 20px;font-size:15px;line-height:1.5;">${intro}</p>
                ${diasHtml}
                <div style="margin:20px 0 0;background:${GRIS_OSCURO};border-radius:10px;padding:16px 18px 18px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${filasLogisticaHtml}</table>
                  <p style="margin:14px 0 0;font-size:13px;line-height:1.5;font-weight:700;color:#ffffff;border-top:1px solid rgba(255,255,255,0.15);padding-top:12px;">${escapeHtml(tx.liberar)}</p>
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:14px 0 0;">
                  <tr>
                    <td style="border-radius:8px;background:${ROJO};text-align:center;">
                      <a href="${urlPerfil}" style="display:block;padding:12px 22px;color:#ffffff;font-size:12px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;text-decoration:none;text-align:center;border-radius:8px;">${escapeHtml(tx.boton)}</a>
                    </td>
                  </tr>
                  </table>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`

  const text = [
    tx.hola(data.nombre),
    '',
    `${tx.presencialTitulo.toUpperCase()}: ${presencialDetalle}`,
    '',
    esCombinado ? tx.introAmbosTexto : tx.introTexto(data.dias[0]?.titulo ?? ''),
    '',
    ...data.dias.flatMap(dia => [
      `${dia.titulo} — ${dia.fecha}${dia.hora ? ` · ${dia.hora}` : ''}${dia.duracion ? ` · ${dia.duracion}` : ''}`,
      ...dia.programa.map(item => `  ${item.hora} — ${item.titulo}${item.moderador ? ` (${tx.modera} ${item.moderador})` : ''}`),
      '',
    ]),
    ...filasLogistica.map(([label, value]) => `${label}: ${value}`),
    '',
    tx.liberarTexto,
    urlPerfil,
    '',
    'Diásporas Patrimoniales',
  ].join('\n')

  return { subject, html, text }
}
