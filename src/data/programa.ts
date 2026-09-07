// Contenido tabular en español plano, sin pasar por i18next — mismo criterio
// que sedes.ts/actividades.ts: son datos de un programa concreto, no copy de
// interfaz. La UI que envuelve esta tabla (título de sección, "Día 1"/"Día
// 2", etiqueta "Moderador/a") sí se traduce, vía ProgramaSection.tsx.
export type ProgramaItem = {
  id: string
  hora: string
  titulo: string
  moderador?: string
  participantes?: string[]
}

export const PROGRAMA_DIA_1: ProgramaItem[] = [
  { id: 'd1-1', hora: '08:45–09:30', titulo: 'Recepción y acreditaciones' },
  { id: 'd1-2', hora: '09:30–10:15', titulo: 'Acto de apertura. Presentación e inauguración' },
  { id: 'd1-3', hora: '10:15–10:45', titulo: 'Pausa café' },
  {
    id: 'd1-4',
    hora: '10:45–12:00',
    titulo: 'Panel I. Coleccionismo desigual y museos: historias y gestos de apropiación',
    moderador: 'Jorge Onrubia',
    participantes: ['Hamady Bocoum', 'Alyne Mayra Rufino Dos Santos', 'Benoît de Saint Chamas', 'Patricia Alonso Pajuelo'],
  },
  { id: 'd1-5', hora: '12:00–12:15', titulo: 'Pausa técnica y cambio de panel' },
  {
    id: 'd1-6',
    hora: '12:15–13:30',
    titulo: 'Panel II. Cooperación y restitución: políticas y marcos de actuación',
    moderador: 'Isaac Sastre',
    participantes: ['Claire Chastanier', 'Fátima Roque', 'Hanna Pennock', 'Maria Auxiliadora Llamas Márquez'],
  },
  { id: 'd1-7', hora: '13:30–15:30', titulo: 'Pausa para el almuerzo' },
  {
    id: 'd1-8',
    hora: '15:30–16:45',
    titulo: 'Panel III. Experiencias internacionales: Europa, África y América Latina',
    moderador: 'Isaac Sastre',
    participantes: ['Mustapha Jlok', 'Patricia Ledesma Bouchán', 'María Miñana', 'Raphael Callou'],
  },
  { id: 'd1-9', hora: '16:45–17:15', titulo: 'Cierre de la jornada y transición al MUNA' },
  { id: 'd1-10', hora: '17:15–17:45', titulo: 'Visita opcional a la Sección de Bioantropología del MUNA (invitados/as)' },
  { id: 'd1-11', hora: '17:15', titulo: 'Apertura del cóctel de bienvenida y recepción institucional en el patio del MUNA' },
  { id: 'd1-12', hora: '17:45–20:00', titulo: 'Evento cultural y recepción institucional · MUNA' },
]

export const PROGRAMA_DIA_2: ProgramaItem[] = [
  {
    id: 'd2-1',
    hora: '09:30–10:45',
    titulo: 'Panel IV. Canarias como estudio de caso: deslocalizaciones, partenariados y expectativas de retorno',
    moderador: 'Jorge Onrubia',
    participantes: ['Armando Rangel Rivero', 'André Delpuech', 'Tobias Mörike', 'Daniel Pérez Estévez'],
  },
  { id: 'd2-2', hora: '10:45–11:15', titulo: 'Pausa café' },
  {
    id: 'd2-3',
    hora: '11:15–12:30',
    titulo: 'Panel V. Trayectorias clave y debates singulares',
    moderador: 'Jared Carballo',
    participantes: ['Conrado Rodríguez Martín', 'Alejandra Gómez Colorado', 'José Fenoll', 'Badayco Said Karboune Rodríguez'],
  },
  { id: 'd2-4', hora: '12:30–14:30', titulo: 'Pausa para el almuerzo' },
  {
    id: 'd2-5',
    hora: '14:30–15:45',
    titulo: 'Panel VI. Restos humanos y ética: ciencia, sensibilidad y responsabilidad pública',
    moderador: 'Jared Carballo',
    participantes: ['Matilde Arnay de la Rosa', 'Afaf Wahba', 'Sarita Fuentes Villalobos', 'Rebecca Whiting'],
  },
  { id: 'd2-6', hora: '15:45–16:15', titulo: 'Pausa café' },
  {
    id: 'd2-7',
    hora: '16:15–17:00',
    titulo: 'Acto de clausura · Lectura de la Declaración de Santa Cruz de Tenerife y clausura institucional',
  },
]
