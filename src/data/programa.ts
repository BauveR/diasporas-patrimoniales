// Contenido tabular en español plano, sin pasar por i18next — mismo criterio
// que sedes.ts/actividades.ts: son datos de un programa concreto, no copy de
// interfaz. La UI que envuelve esta tabla (título de sección, "Día 1"/"Día
// 2", etiqueta "Moderador/a") sí se traduce, vía ProgramaSection.tsx.
export type ProgramaItem = {
  id: string
  hora: string
  titulo: string
  // Solo 2 ítems la tienen hoy (la apertura y la clausura, ver comentario
  // en ProgramaTimeline sobre dónde se muestra) — el resto de las filas no
  // necesita una descripción propia más allá del título.
  descripcion?: string
  moderador?: string
  participantes?: string[]
}

export const PROGRAMA_DIA_1: ProgramaItem[] = [
  { id: 'd1-1', hora: '08:45–09:30', titulo: 'Recepción y acreditaciones' },
  {
    id: 'd1-2',
    hora: '09:30–10:15',
    titulo: 'Sesión de apertura. Presentación e inauguración',
    descripcion: 'Participación institucional prevista del Gobierno de Canarias, Cabildo de Tenerife, Organismo Autónomo de Museos y Centros, Museo de la Naturaleza y Arqueología y Dirección científica del simposio.',
  },
  { id: 'd1-3', hora: '10:15–10:45', titulo: 'Pausa café' },
  {
    id: 'd1-4',
    hora: '10:45–12:00',
    titulo: 'Panel I. Coleccionismo desigual y museos: historias y prácticas de apropiación',
    moderador: 'Jorge Onrubia',
    participantes: ['Hamady Bocoum', 'Alyne Mayra Rufino dos Santos', 'Benoît de Saint Chamas', 'Patricia Alonso Pajuelo'],
  },
  { id: 'd1-5', hora: '12:00–12:15', titulo: 'Pausa' },
  {
    id: 'd1-6',
    hora: '12:15–13:30',
    titulo: 'Panel II. Cooperación y restitución: políticas y marcos de actuación',
    moderador: 'Isaac Sastre',
    participantes: ['Claire Chastanier', 'Fátima Faria Roque', 'Hanna Pennock', 'María Auxiliadora Llamas Márquez'],
  },
  { id: 'd1-7', hora: '13:30–15:30', titulo: 'Pausa almuerzo' },
  {
    id: 'd1-8',
    hora: '15:30–16:45',
    titulo: 'Panel III. Experiencias internacionales: Europa, África y América Latina',
    moderador: 'Isaac Sastre',
    participantes: ['Mustapha Jlok', 'Patricia Ledesma Bouchán', 'María José Miñana', 'Raphael Callou'],
  },
]

// Reordenado — antes alternaba panel/pausa-café/panel/pausa-café/panel
// (dos cafés entre los 3 paneles); ahora los paneles IV y V van seguidos,
// un único café entre V y VI, y el almuerzo se corrió a después de VI, no
// entre V y VI.
export const PROGRAMA_DIA_2: ProgramaItem[] = [
  {
    id: 'd2-1',
    hora: '09:30–10:45',
    titulo: 'Panel IV. Canarias como estudio de caso: deslocalizaciones, colaboraciones y expectativas de restitución',
    moderador: 'Jorge Onrubia',
    participantes: ['Armando Rangel Rivero', 'André Delpuech', 'Tobias Mörike', 'Daniel Pérez Estévez'],
  },
  {
    id: 'd2-2',
    hora: '10:45–12:00',
    titulo: 'Panel V. Trayectorias clave y debates singulares',
    moderador: 'Jared Carballo',
    participantes: ['Conrado Rodríguez-Maffiotte Martín', 'Alejandra Gómez Colorado', 'José Fenoll Cascales', 'Jesús Robles Moreno', 'Said Karboune Rodríguez'],
  },
  { id: 'd2-3', hora: '12:00–12:30', titulo: 'Pausa café' },
  {
    id: 'd2-4',
    hora: '12:30–13:45',
    titulo: 'Panel VI. Restos humanos y ética: ciencia, sensibilidad y responsabilidad pública',
    moderador: 'Jared Carballo',
    participantes: ['Matilde Arnay de la Rosa', 'Afaf Wahba', 'Sarita Fuentes Villalobos', 'Rebecca Whiting'],
  },
  { id: 'd2-5', hora: '13:45–15:45', titulo: 'Pausa almuerzo' },
  {
    id: 'd2-6',
    hora: '15:45–16:30',
    titulo: 'Sesión de clausura',
    descripcion: 'Lectura de la «Declaración de Santa Cruz de Tenerife» y clausura institucional.',
  },
]
