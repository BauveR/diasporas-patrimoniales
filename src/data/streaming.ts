import type { Locale } from '../i18n/config'

// Retransmisiones en directo del canal de YouTube de Patrimonio Cultural de
// Canarias (https://www.youtube.com/@PatrimonioCulturaldeCanarias/streams):
// 4 sesiones × 3 idiomas. No hay emisión en portugués — la versión PT del
// sitio muestra la inglesa (ver idiomaStreamingPorDefecto).
//
// Horas en hora de Canarias (WET = UTC+0 en noviembre), alineadas con
// src/data/programa.ts: inicio de la primera intervención de cada jornada y
// fin de la última.

export type IdiomaStreaming = 'es' | 'en' | 'fr'

export const IDIOMAS_STREAMING: readonly IdiomaStreaming[] = ['es', 'en', 'fr']

export type SesionStreaming = {
  id: string
  dia: 1 | 2
  turno: 'manana' | 'tarde'
  inicio: string // ISO UTC
  fin: string // ISO UTC
  videos: Record<IdiomaStreaming, string> // id de vídeo de YouTube
}

export const SESIONES_STREAMING: readonly SesionStreaming[] = [
  {
    id: 'd1-manana',
    dia: 1,
    turno: 'manana',
    inicio: '2026-11-12T09:30:00Z',
    fin: '2026-11-12T13:30:00Z',
    videos: { es: 'xRqNNAH8fsU', en: 'W9BJp2FGfUk', fr: '33O25D82l8Q' },
  },
  {
    id: 'd1-tarde',
    dia: 1,
    turno: 'tarde',
    inicio: '2026-11-12T15:30:00Z',
    fin: '2026-11-12T16:45:00Z',
    videos: { es: 'Lj2mabhg63s', en: 'xecij6uhZTY', fr: '2u4ySC22wSA' },
  },
  {
    id: 'd2-manana',
    dia: 2,
    turno: 'manana',
    inicio: '2026-11-13T09:30:00Z',
    fin: '2026-11-13T13:45:00Z',
    videos: { es: 'zUHCo7LJj2I', en: 'Wx5CqdsXp2Q', fr: '9g6z-Q7bcNA' },
  },
  {
    id: 'd2-tarde',
    dia: 2,
    turno: 'tarde',
    inicio: '2026-11-13T15:45:00Z',
    fin: '2026-11-13T16:30:00Z',
    videos: { es: 'GGVbZxT9xR0', en: 'Od73-9RMpyk', fr: '5UALwSg7vU8' },
  },
]

export const ZONA_HORARIA_EVENTO = 'Atlantic/Canary'

// Las emisiones suelen arrancar un poco antes y alargarse con las preguntas
// del público: margen para no mostrar "Finalizada" con el directo abierto.
const MARGEN_PREVIO_MS = 15 * 60 * 1000
const MARGEN_POSTERIOR_MS = 30 * 60 * 1000

export type EstadoSesion = 'programada' | 'directo' | 'finalizada'

export function estadoSesion(sesion: SesionStreaming, ahora: number): EstadoSesion {
  const inicio = Date.parse(sesion.inicio) - MARGEN_PREVIO_MS
  const fin = Date.parse(sesion.fin) + MARGEN_POSTERIOR_MS
  if (ahora < inicio) return 'programada'
  if (ahora <= fin) return 'directo'
  return 'finalizada'
}

// Sin emisión en portugués: PT cae a la versión inglesa.
export function idiomaStreamingPorDefecto(locale: Locale): IdiomaStreaming {
  return locale === 'pt' ? 'en' : locale
}

export function urlVideo(id: string): string {
  return `https://www.youtube.com/watch?v=${id}`
}

// mqdefault = 320×180, sin las bandas negras de hqdefault y ~4× más liviana.
export function miniaturaVideo(id: string): string {
  return `https://i.ytimg.com/vi/${id}/mqdefault.jpg`
}

// Cuenta atrás compacta hasta `inicio` (null si ya empezó).
export function tiempoRestante(inicio: string, ahora: number): { dias: number; horas: number; minutos: number } | null {
  const ms = Date.parse(inicio) - ahora
  if (ms <= 0) return null
  const minutosTotales = Math.floor(ms / 60000)
  return {
    dias: Math.floor(minutosTotales / 1440),
    horas: Math.floor((minutosTotales % 1440) / 60),
    minutos: minutosTotales % 60,
  }
}
