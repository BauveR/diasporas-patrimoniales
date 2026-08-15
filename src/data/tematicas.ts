export const TEMATICAS = [
  'Arquitectura',
  'Historia local',
  'Patrimonio religioso',
  'Agua y paisaje',
  'Patrimonio marítimo',
  'Fiestas y tradiciones',
  'Arqueología',
  'Personajes históricos',
  'Patrimonio industrial',
  'Patrimonio inmaterial',
] as const

export type Tematica = typeof TEMATICAS[number]

export const TEMATICA_COLORS: Record<Tematica, string> = {
  'Arquitectura':          '#DAB36D',
  'Historia local':        '#C89145',
  'Patrimonio religioso':  '#B27035',
  'Agua y paisaje':        '#A24A35',
  'Patrimonio marítimo':   '#53664D',
  'Fiestas y tradiciones': '#40608E',
  'Arqueología':           '#2D2E30',
  'Personajes históricos': '#5D5D5D',
  'Patrimonio industrial': '#B39571',
  'Patrimonio inmaterial': '#967955',
}
