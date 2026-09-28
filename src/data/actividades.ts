import type { Tematica } from './tematicas'
import { SEDES, type Sede } from './sedes'

export type Dificultad = 'Fácil' | 'Media' | 'Difícil'

export type Actividad = {
  id: number
  imagen: string
  titulo: string
  sedeId: number
  descripcion: string
  fecha: string
  hora: string
  duracion: string
  dificultad: Dificultad
  plazas: number
  plazasDisponibles: number
  tematica: Tematica
  organizador: string
  contacto: string
  puntoEncuentro: string
  cancelada?: boolean
  serieId?: string
  fechaAperturaInscripciones?: string
}

// Imagen propia de la tarjeta "Ambos días" — antes reutilizaba dia1.imagen,
// ahora tiene la suya (AmbosDiasCard.tsx / AmbosDiasExpandido.tsx), ya que
// no hay un objeto Actividad combinado propio donde guardarla.
export const IMAGEN_AMBOS_DIAS = 'https://ik.imagekit.io/h6qtszktl/images%20/2.png'

export const ACTIVIDADES: Actividad[] = [
  {
    id: 1,
    imagen: 'https://ik.imagekit.io/h6qtszktl/images%20/1.png',
    titulo: 'Día 1 — 12 de noviembre',
    sedeId: 1,
    descripcion: `Día 1 — 12 de noviembre

Mañana
08:45–09:30 h | Recepción y acreditaciones
09:30–10:15 h | Sesión de apertura. Presentación e inauguración

Participantes previstos
Presidente del Gobierno de Canarias.
Director General de Cultura y Patrimonio Cultural del Gobierno de Canarias.
Representantes del Cabildo de Tenerife.
Organismo Autónomo de Museos y Centros.
Museo de la Naturaleza y Arqueología.
Dirección científica del simposio.

10:15–10:45 h | Pausa café

10:45–12:00 h | Panel I. Coleccionismo desigual y museos: historias y prácticas de apropiación
Moderador: Jorge Onrubia
Participantes
Hamady Bocoum – Exdirector del Musée des Civilisations Noires, Senegal.
Alyne Mayra Rufino Dos Santos – Directora del Centro Nacional de Arqueología, IPHAN, Brasil.
Benoît de Saint Chamas – Encargado de misión para la cooperación internacional en el ámbito del patrimonio, Ministerio de Europa y Asuntos Exteriores, Francia.
Patricia Alonso Pajuelo – Directora del Museo Nacional de Antropología, España.

12:00–12:15 h | Pausa técnica y cambio de panel

12:15–13:30 h | Panel II. Cooperación y restitución: políticas y marcos de actuación
Moderador: Isaac Sastre
Participantes
Claire Chastanier – Adjunta de la Subdirección de Colecciones, Dirección General de Patrimonios y Arquitectura, Ministerio de Cultura, Francia.
Fátima Roque – Presidenta del Consejo Intergubernamental de Ibermuseos y coordinadora de la Red Portuguesa de Museos, Portugal.
Hanna Pennock – Asesora sénior de la Agencia del Patrimonio Cultural de los Países Bajos y presidenta del Grupo de Trabajo sobre Descolonización del ICOM.
Maria Auxiliadora Llamas Márquez – Presidenta de ICOM España y directora del Museo de Cádiz, España.

13:30–15:30 h | Pausa almuerzo

Tarde
15:30–16:45 h | Panel III. Experiencias internacionales: Europa, África y América Latina
Moderador: Isaac Sastre
Participantes
Mustapha Jlok – Director de Patrimonio Cultural, Ministerio de Juventud, Cultura y Comunicación, Marruecos.
Patricia Ledesma Bouchán – Directora del Museo del Templo Mayor / ENAH, México.
María Miñana – UNESCO, Convención de 1970 / Tráfico Ilícito Internacional y Museo Virtual, Francia.
Raphael Callou – Director General de Cultura de la OEI, España.`,
    fecha: '2026-11-12',
    hora: '08:45',
    duracion: '8h',
    dificultad: 'Fácil',
    plazas: 150,
    plazasDisponibles: 150,
    tematica: 'Arqueología',
    organizador: 'TEA Tenerife Espacio de las Artes',
    contacto: 'diasporaspatrimoniales@gmail.com',
    puntoEncuentro: 'TEA Tenerife Espacio de las Artes, Santa Cruz de Tenerife',
  },
  {
    id: 2,
    imagen: 'https://ik.imagekit.io/h6qtszktl/images%20/3.png',
    titulo: 'Día 2 — 13 de noviembre',
    sedeId: 1,
    descripcion: `Día 2 — 13 de noviembre

Mañana
09:30–10:45 h | Panel IV. Canarias como estudio de caso: deslocalizaciones, colaboraciones y expectativas de restitución
Moderador: Jorge Onrubia
Participantes
Dr. C. Armando Rangel Rivero. Director Museo Antropológico Montané. Universidad de La Habana, Cuba.
André Delpuech – Centre Alexandre Koyré / exdirector del Musée de l'Homme, Francia.
Tobias Mörike – Conservador del Weltmuseum Wien, Austria.
Daniel Pérez Estévez – Director de El Museo Canario, España.

10:45–11:15 h | Pausa café

11:15–12:30 h | Panel V. Trayectorias clave y debates singulares
Moderador: Jared Carballo
Participantes
Conrado Rodríguez Martín – Director del MUNA / Instituto Canario de Bioantropología, España.
Alejandra Gómez Colorado – Directora del Museo Nacional de las Culturas del Mundo, México.
José Fenoll – Doctorando y especialista en escultura ibérica y en la Dama de Elche, Universidad Autónoma de Madrid, España.
Badayco Said Karboune Rodríguez – Doctorando y especialista en la historia de la translocación de la Momia del Barranco de Erques, Universidad de La Laguna, España.

12:30–14:30 h | Pausa almuerzo

Tarde
14:30–15:45 h | Panel VI. Restos humanos y ética: ciencia, sensibilidad y responsabilidad pública
Moderador: Jared Carballo
Participantes
Matilde Arnay de la Rosa – Profesora honoraria de Prehistoria, Universidad de La Laguna, España.
Afaf Wahba – Directora del Departamento de Bioarqueología del Consejo Supremo de Antigüedades, Egipto.
Sarita Fuentes Villalobos – Santuario Arqueológico de Pachacamac / Pontificia Universidad Católica del Perú, Perú.
Rebecca Whiting – Conservadora de Bioarqueología, Departamento de Egipto y Sudán del British Museum, Reino Unido.

15:45–16:15 h | Pausa café

16:15–17:00 h | Sesión de clausura
Lectura de la «Declaración de Santa Cruz de Tenerife» y clausura institucional.
Participantes previstos
Dirección General de Cultura y Patrimonio Cultural.
Dirección científica del simposio.`,
    fecha: '2026-11-13',
    hora: '09:30',
    duracion: '7h 30min',
    dificultad: 'Fácil',
    plazas: 150,
    plazasDisponibles: 150,
    tematica: 'Arqueología',
    organizador: 'TEA Tenerife Espacio de las Artes',
    contacto: 'diasporaspatrimoniales@gmail.com',
    puntoEncuentro: 'TEA Tenerife Espacio de las Artes, Santa Cruz de Tenerife',
  },
]

// Estado público de ocupación — reemplaza el conteo exacto de plazas
// restantes (lo que antes mostraban ActividadCard/BookingWidget) por 3
// niveles, como la mayoría de plataformas de registro a eventos: mostrar el
// número real invita a "contar cupos" y no aporta nada que el usuario pueda
// actuar distinto. `agotada` es aparte (ya se maneja como "Sin plazas
// disponibles"/"Aforo completo" en otros lados) — esta función solo cubre
// el rango con cupo abierto.
export type PlazasEstado = 'disponibles' | 'algunas' | 'pocas' | 'agotada'

export function getPlazasEstado(actividad: Pick<Actividad, 'plazas' | 'plazasDisponibles'>): PlazasEstado {
  if (actividad.plazasDisponibles <= 0) return 'agotada'
  const ratio = actividad.plazas > 0 ? actividad.plazasDisponibles / actividad.plazas : 0
  if (ratio <= 0.2) return 'pocas'
  if (ratio <= 0.5) return 'algunas'
  return 'disponibles'
}

export function getActividadesBySede(sedeId: number): Actividad[] {
  return ACTIVIDADES.filter(a => a.sedeId === sedeId)
}

export function getSedeByActividad(actividadId: number): Sede | undefined {
  const actividad = ACTIVIDADES.find(a => a.id === actividadId)
  if (!actividad) return undefined
  return SEDES.find(c => c.id === actividad.sedeId)
}
