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

// Una sola sede: el simposio se celebra íntegramente en el TEA. Las otras 8
// entradas que había acá (heredadas de la plantilla de reservas multi-sede)
// apuntaban a actividadIds que ya no existen en actividades.ts — datos rotos,
// no solo sobrantes.
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
    descripcion: 'TEA Tenerife Espacio de las Artes será la sede de las sesiones académicas. El edificio, diseñado por Herzog & de Meuron junto a Virgilio Gutiérrez, se encuentra en el centro de Santa Cruz de Tenerife, a pocos pasos del MUNA. La tarde del 12 de noviembre el programa continuará en el Museo de la Naturaleza y Arqueología con una breve visita opcional para los invitados y la recepción cultural.',
    actividadIds: [1, 2],
    lat: 28.4636,
    lng: -16.2492,
    fundacion: '2008',
  },
]
