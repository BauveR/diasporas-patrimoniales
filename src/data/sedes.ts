export type Sede = {
  id: number
  nombre: string
  municipio: string
  isla: string
  imagen: string
  descripcion: string
  actividadIds: number[]
  lat: number
  lng: number
  fundacion?: string
  declaraciones?: string[]
  bibliografia?: string[]
}

export const SEDES: Sede[] = [
  {
    id: 1,
    nombre: 'TEA Tenerife Espacio de las Artes',
    municipio: 'Santa Cruz de Tenerife',
    isla: 'Tenerife',
    // f_auto/q_auto dejan que Cloudinary elija formato (WebP/AVIF) y calidad
    // según el navegador; w_900 evita servir el original de 1280px cuando la
    // tarjeta nunca lo muestra a más de unos cientos de px de ancho.
    imagen: 'https://res.cloudinary.com/s6z9q8tc/image/upload/f_auto,q_auto,w_900/v1786964737/1280px-TEA.Tenerife.jpg',
    descripcion: 'El TEA Tenerife Espacio de las Artes es el centro de arte contemporáneo de Santa Cruz de Tenerife, diseñado por Herzog & de Meuron junto a Virgilio Gutiérrez. Acoge el Instituto Óscar Domínguez de Arte y Cultura Contemporánea, la Biblioteca Insular y espacios expositivos dedicados a la creación actual.',
    actividadIds: [1, 2, 9, 19, 21],
    lat: 28.4636,
    lng: -16.2492,
    fundacion: '2008',
  },
  {
    id: 2,
    nombre: 'Sede Histórica de Betancuria',
    municipio: 'Betancuria',
    isla: 'Fuerteventura',
    imagen: 'https://upload.wikimedia.org/wikipedia/commons/4/40/Convento_de_San_Buenaventura_-_Betancuria_-_Fuerteventura.jpg',
    descripcion: 'Primera capital de Fuerteventura, fundada a principios del siglo XV. Conserva un extraordinario patrimonio arquitectónico y religioso en un entorno natural singular.',
    actividadIds: [3, 20],
    lat: 28.4227,
    lng: -14.0583,
    fundacion: '1404',
  },
  {
    id: 3,
    nombre: 'Sede Histórica de Vegueta-Triana',
    municipio: 'Las Palmas de Gran Canaria',
    isla: 'Gran Canaria',
    imagen: 'https://upload.wikimedia.org/wikipedia/commons/4/40/Convento_de_San_Buenaventura_-_Betancuria_-_Fuerteventura.jpg',
    descripcion: 'Núcleo fundacional de Las Palmas de Gran Canaria, con la Catedral de Santa Ana y la Casa de Colón como joyas de su patrimonio histórico y cultural.',
    actividadIds: [4, 5, 22],
    lat: 28.1024,
    lng: -15.4148,
    fundacion: '1478',
    declaraciones: ['Bien de Interés Cultural'],
  },
  {
    id: 4,
    nombre: 'Sede Histórica de Garachico',
    municipio: 'Garachico',
    isla: 'Tenerife',
    imagen: 'https://upload.wikimedia.org/wikipedia/commons/4/40/Convento_de_San_Buenaventura_-_Betancuria_-_Fuerteventura.jpg',
    descripcion: 'Antigua capital comercial de Tenerife, devastada por la erupción volcánica de 1706. Conserva un centro histórico de gran valor con piscinas naturales en la lava volcánica.',
    actividadIds: [6, 8, 10, 23],
    lat: 28.3704,
    lng: -16.7614,
    fundacion: '1496',
  },
  {
    id: 5,
    nombre: 'Sede Histórica de Agüimes',
    municipio: 'Agüimes',
    isla: 'Gran Canaria',
    imagen: 'https://upload.wikimedia.org/wikipedia/commons/4/40/Convento_de_San_Buenaventura_-_Betancuria_-_Fuerteventura.jpg',
    descripcion: 'Villa de origen prehispánico con un casco histórico de arquitectura canaria bien conservado, centrado en la iglesia de San Sebastián y sus calles empedradas.',
    actividadIds: [7, 24],
    lat: 27.9044,
    lng: -15.4477,
    declaraciones: ['Bien de Interés Cultural'],
  },
  {
    id: 6,
    nombre: 'Sede Histórica de Teguise',
    municipio: 'Teguise',
    isla: 'Lanzarote',
    imagen: 'https://upload.wikimedia.org/wikipedia/commons/4/40/Convento_de_San_Buenaventura_-_Betancuria_-_Fuerteventura.jpg',
    descripcion: 'Antigua capital de Lanzarote, fundada en el siglo XIV. Conserva un núcleo histórico de gran pureza con el castillo de Santa Bárbara y la iglesia de Nuestra Señora de Guadalupe.',
    actividadIds: [11, 12, 25],
    lat: 29.0613,
    lng: -13.5603,
    fundacion: 'c. 1350',
  },
  {
    id: 7,
    nombre: 'Sede Histórica de Santa Cruz de La Palma',
    municipio: 'Santa Cruz de La Palma',
    isla: 'La Palma',
    imagen: 'https://upload.wikimedia.org/wikipedia/commons/4/40/Convento_de_San_Buenaventura_-_Betancuria_-_Fuerteventura.jpg',
    descripcion: 'Capital histórica de La Palma con uno de los centros históricos renacentistas mejor conservados de las islas. La Plaza de España y la calle Real son joyas del siglo XVI.',
    actividadIds: [13, 14, 26],
    lat: 28.6835,
    lng: -17.7642,
    fundacion: '1493',
    declaraciones: ['Bien de Interés Cultural'],
  },
  {
    id: 8,
    nombre: 'Sede Histórica de San Sebastián de La Gomera',
    municipio: 'San Sebastián de La Gomera',
    isla: 'La Gomera',
    imagen: 'https://upload.wikimedia.org/wikipedia/commons/4/40/Convento_de_San_Buenaventura_-_Betancuria_-_Fuerteventura.jpg',
    descripcion: 'Capital de La Gomera y punto de partida del último viaje de Colón. Conserva la Torre del Conde, construida en 1447, y un trazado histórico vinculado a la conquista americana.',
    actividadIds: [15, 16],
    lat: 28.0916,
    lng: -17.1114,
    fundacion: '1440',
  },
  {
    id: 9,
    nombre: 'Sede Histórica de Valverde',
    municipio: 'Valverde',
    isla: 'El Hierro',
    imagen: 'https://upload.wikimedia.org/wikipedia/commons/4/40/Convento_de_San_Buenaventura_-_Betancuria_-_Fuerteventura.jpg',
    descripcion: 'Capital de El Hierro, la isla más occidental de Canarias. Pequeño núcleo histórico rodeado de naturaleza volcánica con la iglesia de la Concepción como elemento central.',
    actividadIds: [17, 18],
    lat: 27.8085,
    lng: -17.9155,
    fundacion: 's. XVI',
  },
]
