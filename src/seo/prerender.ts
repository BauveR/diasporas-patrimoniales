// HTML prerenderizado para buscadores y bots de IA (que no ejecutan
// JavaScript y sin esto solo veían un <div id="root"></div> vacío), datos
// estructurados schema.org/Event y /llms.txt. Lo usa el plugin
// `seo-prerender` de vite.config.ts al terminar la build: genera
// dist/index.html (es) y dist/{en,fr,pt}/index.html.
//
// Funciones puras sobre strings (sin APIs de Node ni del DOM): el contenido
// sale de las mismas traducciones y datos que la app, así no se desincroniza.
// No importa i18n/config.ts a propósito: ese módulo inicializa i18next al
// importarse, y esto corre dentro de la build.
//
// El contenido va dentro de #root, oculto visualmente (no `display: none`:
// sigue siendo texto real del documento para lectores de pantalla y bots).
// React lo reemplaza al montar la app; visualmente no cambia nada.
import es from '../i18n/locales/es.json'
import en from '../i18n/locales/en.json'
import fr from '../i18n/locales/fr.json'
import pt from '../i18n/locales/pt.json'
import { PROGRAMA_DIA_1, PROGRAMA_DIA_2, type ProgramaItem } from '../data/programa'
import { PARTICIPANTES } from '../data/participantes'
import { SEDES, googleMapsUrl } from '../data/sedes'
import { PROGRAMA_PDF } from '../data/programaPdf'

type Locale = 'es' | 'en' | 'fr' | 'pt'

export const PRERENDER_LOCALES: Locale[] = ['es', 'en', 'fr', 'pt']

// Mismos valores que SITE_URL (components/SeoHead.tsx) y LOCALE_TAGS
// (i18n/config.ts) — duplicados por lo explicado arriba.
const SITE_URL = 'https://www.diasporaspatrimoniales.com'
const LOCALE_TAGS: Record<Locale, string> = { es: 'es-ES', en: 'en-US', fr: 'fr-FR', pt: 'pt-PT' }

// Fechas de las dos jornadas. Canarias en noviembre está en UTC+0 (WET).
const DIA_1 = '2026-11-12'
const DIA_2 = '2026-11-13'
const TZ = '+00:00'

const TRANSLATIONS: Record<Locale, unknown> = { es, en, fr, pt }

function tr(locale: Locale, key: string, fallback = ''): string {
  let node: unknown = TRANSLATIONS[locale]
  for (const part of key.split('.')) {
    node = node && typeof node === 'object' ? (node as Record<string, unknown>)[part] : undefined
  }
  return typeof node === 'string' ? node : fallback
}

function trList(locale: Locale, key: string, fallback: string[] = []): string[] {
  let node: unknown = TRANSLATIONS[locale]
  for (const part of key.split('.')) {
    node = node && typeof node === 'object' ? (node as Record<string, unknown>)[part] : undefined
  }
  return Array.isArray(node) ? node.map(String) : fallback
}

const esc = (s: string) => s
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')

export const pageUrl = (locale: Locale) => (locale === 'es' ? `${SITE_URL}/` : `${SITE_URL}/${locale}`)

// Mismo criterio que ProgramaTimeline: hora/título/descripción/cargos
// traducidos desde programaItems.<id>, nombres desde programa.ts.
function programaItem(locale: Locale, item: ProgramaItem) {
  return {
    hora: tr(locale, `programaItems.${item.id}.hora`, item.hora),
    titulo: tr(locale, `programaItems.${item.id}.titulo`, item.titulo),
    descripcion: tr(locale, `programaItems.${item.id}.descripcion`, item.descripcion ?? ''),
    moderador: item.moderador,
    participantes: item.participantes ?? [],
    cargos: trList(locale, `programaItems.${item.id}.participantesCargo`, item.participantesCargo ?? []),
  }
}

function startEnd(): { start: string; end: string } {
  const first = PROGRAMA_DIA_1[0].hora.split(/[–-]/)[0].trim()
  const last = PROGRAMA_DIA_2[PROGRAMA_DIA_2.length - 1].hora.split(/[–-]/)[1].trim()
  return { start: `${DIA_1}T${first}:00${TZ}`, end: `${DIA_2}T${last}:00${TZ}` }
}

export function eventJsonLd(locale: Locale): string {
  const sede = SEDES[0]
  const { start, end } = startEnd()
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: `Diásporas Patrimoniales — ${tr(locale, 'hero.headline')}`,
    description: tr(locale, 'meta.homeDescription'),
    startDate: start,
    endDate: end,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    inLanguage: LOCALE_TAGS[locale],
    url: pageUrl(locale),
    image: [`${SITE_URL}/og-image.jpg`],
    location: {
      '@type': 'Place',
      name: sede.nombre,
      address: {
        '@type': 'PostalAddress',
        addressLocality: sede.municipio,
        addressRegion: 'Canarias',
        addressCountry: 'ES',
      },
      geo: { '@type': 'GeoCoordinates', latitude: sede.lat, longitude: sede.lng },
    },
    organizer: { '@type': 'Organization', name: 'Gobierno de Canarias', url: 'https://www.gobiernodecanarias.org' },
    performer: PARTICIPANTES.map(p => ({ '@type': 'Person', name: p.nombre })),
  }
  // `<` escapado: el JSON va dentro de un <script>.
  return JSON.stringify(data).replace(/</g, '\\u003c')
}

function programaHtml(locale: Locale, dia: string, items: ProgramaItem[]): string {
  const rows = items.map(raw => {
    const it = programaItem(locale, raw)
    const extra: string[] = []
    if (it.descripcion) extra.push(esc(it.descripcion))
    if (it.moderador) extra.push(`${esc(tr(locale, 'programa.moderador'))} ${esc(it.moderador)}`)
    const people = it.participantes.map((n, i) => (it.cargos[i] ? `${esc(n)} (${esc(it.cargos[i])})` : esc(n)))
    if (people.length) extra.push(people.join('; '))
    return `<li><strong>${esc(it.hora)}</strong> ${esc(it.titulo)}${extra.length ? `. ${extra.join('. ')}` : ''}</li>`
  })
  return `<h3>${esc(dia)}</h3><ul>${rows.join('')}</ul>`
}

export function rootHtml(locale: Locale): string {
  const sede = SEDES[0]
  const other = PRERENDER_LOCALES.filter(l => l !== locale)
  return [
    // Oculto visualmente (patrón "sr-only"), ver comentario de cabecera.
    '<div style="position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0">',
    '<main>',
    `<h1>Diásporas Patrimoniales — ${esc(tr(locale, 'hero.simposio'))}</h1>`,
    `<p>${esc(tr(locale, 'hero.headline'))}</p>`,
    `<p>${esc(tr(locale, 'hero.dateLine'))} · ${esc(tr(locale, 'hero.location'))}</p>`,
    `<p>${esc(tr(locale, 'hero.description'))}</p>`,
    `<section><h2>${esc(tr(locale, 'sobreEncuentro.titulo'))}</h2>`,
    ['parrafo1', 'parrafo2', 'parrafo3'].map(k => `<p>${esc(tr(locale, `sobreEncuentro.${k}`))}</p>`).join(''),
    '</section>',
    `<section><h2>${esc(tr(locale, 'inscripcion.titulo'))}</h2><p>${esc(tr(locale, 'inscripcion.parrafo'))}</p></section>`,
    `<section><h2>${esc(tr(locale, 'sedeSection.titulo'))}</h2><p>${esc(tr(locale, 'sedeSection.descripcion', sede.descripcion))}</p>`,
    `<p><a href="${esc(googleMapsUrl(sede))}">${esc(sede.nombre)}, ${esc(sede.municipio)}</a></p></section>`,
    `<section><h2>${esc(tr(locale, 'participantes.titulo'))}</h2><p>${esc(tr(locale, 'participantes.parrafo1'))}</p>`,
    `<h3>${esc(tr(locale, 'participantes.direccionCientifica.titulo'))}</h3><p>${esc(tr(locale, 'participantes.direccionCientifica.texto'))}</p>`,
    `<ul>${PARTICIPANTES.map(p => `<li><strong>${esc(p.nombre)}</strong>${p.cargo[locale] ? ` — ${esc(p.cargo[locale])}` : ''}</li>`).join('')}</ul></section>`,
    `<section><h2>${esc(tr(locale, 'programa.titulo'))}</h2><p>${esc(tr(locale, 'programa.parrafo'))}</p>`,
    `<p><a href="${esc(PROGRAMA_PDF[locale])}">${esc(tr(locale, 'programa.descargar'))} (PDF)</a></p>`,
    programaHtml(locale, tr(locale, 'programa.dia1'), PROGRAMA_DIA_1),
    programaHtml(locale, tr(locale, 'programa.dia2'), PROGRAMA_DIA_2),
    '</section>',
    `<section><h2>${esc(tr(locale, 'contacto.titulo'))}</h2><p>${esc(tr(locale, 'contacto.parrafo'))}</p></section>`,
    `<nav>${other.map(l => `<a href="${pageUrl(l)}" hreflang="${LOCALE_TAGS[l]}">${l.toUpperCase()}</a>`).join(' ')}</nav>`,
    '</main>',
    '</div>',
  ].join('')
}

function headTags(locale: Locale): string {
  const title = tr(locale, 'meta.homeTitle')
  const description = tr(locale, 'meta.homeDescription')
  const url = pageUrl(locale)
  // data-seo-static: main.tsx los quita al arrancar y SeoHead pone los suyos
  // (mismo mecanismo que ya usaba index.html).
  const s = 'data-seo-static'
  return [
    `<meta ${s} name="description" content="${esc(description)}" />`,
    `<link ${s} rel="canonical" href="${url}" />`,
    `<meta ${s} property="og:type" content="website" />`,
    `<meta ${s} property="og:site_name" content="Diásporas Patrimoniales" />`,
    `<meta ${s} property="og:title" content="${esc(title)}" />`,
    `<meta ${s} property="og:description" content="${esc(description)}" />`,
    `<meta ${s} property="og:url" content="${url}" />`,
    `<meta ${s} property="og:image" content="${SITE_URL}/og-image.jpg" />`,
    `<meta ${s} property="og:image:width" content="945" />`,
    `<meta ${s} property="og:image:height" content="945" />`,
    `<meta ${s} property="og:image:alt" content="${esc(`${title}, ${tr(locale, 'hero.dateLine')}`)}" />`,
    `<meta ${s} property="og:locale" content="${LOCALE_TAGS[locale].replace('-', '_')}" />`,
    `<meta ${s} name="twitter:card" content="summary" />`,
    ...PRERENDER_LOCALES.map(l => `<link ${s} rel="alternate" hreflang="${LOCALE_TAGS[l]}" href="${pageUrl(l)}" />`),
    `<link ${s} rel="alternate" hreflang="x-default" href="${pageUrl('es')}" />`,
    `<script type="application/ld+json">${eventJsonLd(locale)}</script>`,
  ].join('\n    ')
}

// Toma el index.html ya construido por Vite y devuelve la versión de un
// idioma: <html lang>, <title>, metadatos estáticos y contenido en #root.
export function buildLocalizedHtml(template: string, locale: Locale): string {
  const withoutStatic = template.replace(/^\s*<(meta|link) data-seo-static[^>]*>\s*$/gm, '')
  const out = withoutStatic
    .replace(/<html lang="[^"]*">/, `<html lang="${locale}">`)
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(tr(locale, 'meta.homeTitle'))}</title>\n    ${headTags(locale)}`)
    .replace('<div id="root"></div>', `<div id="root">${rootHtml(locale)}</div>`)
  if (!out.includes('application/ld+json') || !out.includes('<main>')) {
    throw new Error(`seo-prerender: no se pudo inyectar el contenido en index.html (${locale})`)
  }
  return out
}

// /llms.txt (convención llmstxt.org): resumen en Markdown del simposio para
// modelos de lenguaje, en español, con un resumen en inglés y enlaces a cada
// idioma.
export function buildLlmsTxt(): string {
  const l: Locale = 'es'
  const sede = SEDES[0]
  const lineas = (items: ProgramaItem[]) => items.map(raw => {
    const it = programaItem(l, raw)
    const extra: string[] = []
    if (it.descripcion) extra.push(it.descripcion)
    if (it.moderador) extra.push(`Modera: ${it.moderador}`)
    if (it.participantes.length) extra.push(`Intervienen: ${it.participantes.join(', ')}`)
    return `- ${it.hora} — ${it.titulo}${extra.length ? `. ${extra.join('. ')}` : ''}`
  }).join('\n')

  return `# Diásporas Patrimoniales — ${tr(l, 'hero.simposio')}

> ${tr(l, 'meta.homeDescription')}

${tr(l, 'hero.headline')}. ${tr(l, 'hero.description')}

- Fechas: ${tr(l, 'hero.dateLine')}
- Sede: ${sede.nombre}, ${sede.municipio} (Tenerife, Canarias, España) — ${googleMapsUrl(sede)}
- Inscripción: ${tr(l, 'inscripcion.parrafo')} Formulario en ${pageUrl(l)}
- Contacto: ${tr(l, 'contacto.parrafo')}
- Web: ${pageUrl('es')} (también en inglés ${pageUrl('en')}, francés ${pageUrl('fr')} y portugués ${pageUrl('pt')})

## In English

${tr('en', 'meta.homeDescription')} ${tr('en', 'hero.headline')}. Website in English: ${pageUrl('en')}

## Sobre el encuentro

${tr(l, 'sobreEncuentro.parrafo1')}

${tr(l, 'sobreEncuentro.parrafo2')}

${tr(l, 'sobreEncuentro.parrafo3')}

## Programa

${tr(l, 'programa.parrafo')}

Programa en PDF: ${PROGRAMA_PDF.es}

### ${tr(l, 'programa.dia1')}

${lineas(PROGRAMA_DIA_1)}

### ${tr(l, 'programa.dia2')}

${lineas(PROGRAMA_DIA_2)}

## Dirección científica

${tr(l, 'participantes.direccionCientifica.texto')}

## Participantes

${tr(l, 'participantes.parrafo1')}

${PARTICIPANTES.map(p => `- ${p.nombre}${p.cargo.es ? ` — ${p.cargo.es}` : ''}`).join('\n')}

## Enlaces

- [Inicio (español)](${pageUrl('es')})
- [Home (English)](${pageUrl('en')})
- [Accueil (français)](${pageUrl('fr')})
- [Início (português)](${pageUrl('pt')})
- [Programa en PDF](${PROGRAMA_PDF.es})
- [Política de privacidad](${SITE_URL}/privacidad)
- [Aviso legal](${SITE_URL}/aviso-legal)
`
}
