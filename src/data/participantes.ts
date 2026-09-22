import type { Locale } from '../i18n/config'

export type LocalizedText = Record<Locale, string>

export type Participante = {
  id: number
  nombre: string
  cargo: LocalizedText
  bio: LocalizedText
  tituloIntervencion: string
  // URL base de ImageKit, sin transformación — cada lugar donde se usa pide
  // su propio tamaño/recorte con fotoThumbnail/fotoCompleta en vez de cargar
  // siempre la misma imagen (eso fue lo que hacía que el modal grande se
  // viera borroso: reusaba el recorte cuadrado de 128px pensado para la
  // tarjeta chica).
  foto?: string
}

// Bios reales de los 25 ponentes (documento 2026-09-22, ES/EN/FR/PT).
// `cargo` es la primera oración de cada bio (siempre declara título/rol/
// institución en un solo bloque) y `bio` es el resto — así la tarjeta no
// repite esa misma frase dos veces. `tituloIntervencion` queda vacío: el
// documento no trae título de intervención por persona, solo títulos de
// panel (ver programa.ts).

// `f-webp` en las dos: fuerza salida WebP (con canal alfa) en vez de dejar
// que ImageKit decida el formato — si la cuenta tiene auto-format a JPEG
// por defecto, eso aplana la transparencia del PNG a fondo blanco, que es
// justo lo que no queremos. WebP con alpha pesa además bastante menos que
// PNG, así que no es solo el fix de transparencia sino que ahorra banda.

// Cache-buster compartido: cuando se reemplaza un archivo en ImageKit
// manteniendo el mismo nombre, la URL no cambia — y tanto el navegador como
// el CDN de ImageKit siguen sirviendo la versión vieja cacheada contra esa
// URL exacta hasta que se las "engaña" con un parámetro distinto. Subir
// este número (v=2, v=3...) cada vez que se reemplacen fotos manteniendo el
// nombre fuerza a traer la versión nueva de las 25 de una sola vez.
const IK_CACHE_BUST = 'v=5'

// Miniatura para la grilla (ParticipanteCard): solo ancho (256px — 2x del
// tamaño real que se muestra, 112-128px, para que se vea nítido en retina),
// sin alto — ImageKit no fuerza ningún recorte. La tarjeta ya no es un
// círculo (cuadrado con `object-contain`), así que no hace falta el crop
// cuadrado que sí tenía sentido antes.
const IK_THUMB_TR = `${IK_CACHE_BUST}&tr=w-256,f-webp`

// Versión completa para los popups (sheet/modal): solo se pide un ancho
// (640px, cubre 2x del modal de 307px) y se deja la altura libre, así
// ImageKit no fuerza ningún recorte — la imagen entera llega tal cual su
// proporción original, y `ParticipanteFoto` la muestra con `object-contain`
// (sin cortar nada).
const IK_FULL_TR = `${IK_CACHE_BUST}&tr=w-640,f-webp`

// Algunas URLs ya traen su propio query string (p.ej. el `?updatedAt=...`
// que ImageKit agrega solo al reemplazar un archivo) — si ya hay un `?` en
// la URL, la transformación se suma con `&`, no con otro `?`.
function conTransform(url: string, tr: string): string {
  return `${url}${url.includes('?') ? '&' : '?'}${tr}`
}

export function fotoThumbnail(p: Pick<Participante, 'foto'>): string | undefined {
  return p.foto ? conTransform(p.foto, IK_THUMB_TR) : undefined
}

export function fotoCompleta(p: Pick<Participante, 'foto'>): string | undefined {
  return p.foto ? conTransform(p.foto, IK_FULL_TR) : undefined
}

export const PARTICIPANTES: Participante[] = [
  {
    id: 1,
    nombre: 'Hanna Pennock',
    cargo: {
      es: 'Historiadora del arte y profesional de museos, ha trabajado en los Países Bajos como investigadora, coordinadora de exposiciones, conservadora e inspectora de colecciones',
      en: 'Art historian and museum professional, she has worked in the Netherlands as a researcher, exhibition coordinator, curator and collections inspector',
      fr: `Historienne de l'art et professionnelle des musées, elle a travaillé aux Pays-Bas comme chercheuse, coordinatrice d'expositions, conservatrice et inspectrice des collections`,
      pt: 'Historiadora de arte e profissional de museus, trabalhou nos Países Baixos como investigadora, coordenadora de exposições, conservadora e inspetora de coleções',
    },
    bio: {
      es: 'Fue asesora sénior de la Cultural Heritage Agency of the Netherlands en colecciones coloniales y descolonización y ha desempeñado diversos cargos en ICOM. Actualmente es copresidenta del ICOM Standing Committee on Decolonisation.',
      en: 'She formerly served as Senior Advisor at the Cultural Heritage Agency of the Netherlands on colonial collections and decolonisation and has held several roles within ICOM. She is currently co-Chair of the ICOM Standing Committee on Decolonisation.',
      fr: `Ancienne Senior Advisor à la Cultural Heritage Agency of the Netherlands sur les collections coloniales et la décolonisation, elle a exercé plusieurs fonctions au sein de l'ICOM. Elle est actuellement coprésidente de l'ICOM Standing Committee on Decolonisation.`,
      pt: 'Foi Senior Advisor da Cultural Heritage Agency of the Netherlands nas áreas de coleções coloniais e descolonização e desempenhou várias funções no ICOM. É atualmente copresidente do ICOM Standing Committee on Decolonisation.',
    },
    tituloIntervencion: '',
    foto: 'https://ik.imagekit.io/h6qtszktl/ponentes%20/HannaPennock_BKFF100.png',
  },
  {
    id: 2,
    nombre: 'Armando Rangel Rivero',
    cargo: {
      es: 'Doctor en Ciencias Históricas, investigador titular y director del Museo Antropológico Montané de la Universidad de La Habana',
      en: 'Doctor of Historical Sciences, Senior Researcher and Director of the Montané Anthropological Museum at the University of Havana',
      fr: `Docteur en sciences historiques, chercheur titulaire et directeur du Museo Antropológico Montané de l'Université de La Havane`,
      pt: 'Doutor em Ciências Históricas, Investigador Titular e diretor do Museo Antropológico Montané da Universidade de Havana',
    },
    bio: {
      es: 'Es miembro de la Academia de Ciencias de Cuba y ha desarrollado una extensa trayectoria en antropología, arqueología, museología y patrimonio. Ha coordinado investigaciones sobre restos humanos y momias en Cuba y participado en proyectos y actividades académicas de alcance internacional.',
      en: 'He is a member of the Cuban Academy of Sciences and has a long-standing career in anthropology, archaeology, museology and heritage. He has coordinated research on human remains and mummies in Cuba and participated in international academic and heritage projects.',
      fr: `Membre de l'Académie des sciences de Cuba, il possède une longue expérience en anthropologie, archéologie, muséologie et patrimoine. Il a coordonné des recherches sur les restes humains et les momies à Cuba et participé à de nombreux projets académiques et patrimoniaux internationaux.`,
      pt: 'É membro da Academia de Ciências de Cuba e possui uma longa trajetória em antropologia, arqueologia, museologia e património. Coordenou investigações sobre restos humanos e múmias em Cuba e participou em projetos académicos e patrimoniais de âmbito internacional.',
    },
    tituloIntervencion: '',
    foto: 'https://ik.imagekit.io/h6qtszktl/ponentes%20/Armando%20Rangel%20Rivero.png',
  },
  {
    id: 3,
    nombre: 'Patricia Alonso Pajuelo',
    cargo: {
      es: 'Historiadora y documentalista, conservadora de museos desde 2008 y directora del Museo Nacional de Antropología de Madrid desde 2026',
      en: `Historian and documentation specialist, museum curator since 2008 and Director of Madrid's National Museum of Anthropology since 2026`,
      fr: 'Historienne et documentaliste, conservatrice de musées depuis 2008 et directrice du Museo Nacional de Antropología de Madrid depuis 2026',
      pt: 'Historiadora e documentalista, conservadora de museus desde 2008 e diretora do Museo Nacional de Antropología de Madrid desde 2026',
    },
    bio: {
      es: 'Ha trabajado especialmente con las colecciones de América y Oceanía y ha desarrollado proyectos expositivos y de investigación sobre comunidades indígenas, museología y cooperación con comunidades de origen. Ha realizado trabajo de campo con comunidades shuar en la Amazonía ecuatoriana.',
      en: `She has worked extensively with the museum's American and Oceanian collections and has developed exhibitions and research on Indigenous communities, museology and cooperation with communities of origin. She has also conducted fieldwork with Shuar communities in the Ecuadorian Amazon.`,
      fr: `Elle a travaillé notamment sur les collections d'Amérique et d'Océanie et développé des expositions et recherches consacrées aux communautés autochtones, à la muséologie et à la coopération avec les communautés d'origine. Elle a également mené des recherches de terrain auprès de communautés shuar en Amazonie équatorienne.`,
      pt: 'Trabalhou especialmente com as coleções da América e Oceânia e desenvolveu exposições e investigação sobre comunidades indígenas, museologia e cooperação com comunidades de origem. Realizou também trabalho de campo com comunidades shuar na Amazónia equatoriana.',
    },
    tituloIntervencion: '',
    foto: 'https://ik.imagekit.io/h6qtszktl/ponentes%20/Patricia%20Alonso%20Pajuelo.png',
  },
  {
    id: 4,
    nombre: 'Alejandra Gómez Colorado',
    cargo: {
      es: 'Antropóloga social formada en la Escuela Nacional de Antropología e Historia y especialista en estudios de Oriente Medio',
      en: `Social anthropologist trained at Mexico's National School of Anthropology and History and specialist in Middle Eastern studies`,
      fr: `Anthropologue sociale formée à l'Escuela Nacional de Antropología e Historia et spécialiste des études sur le Moyen-Orient`,
      pt: 'Antropóloga social formada na Escuela Nacional de Antropología e Historia e especialista em estudos do Médio Oriente',
    },
    bio: {
      es: 'Es directora del Museo Nacional de las Culturas del Mundo del INAH. Ha sido directora del Museo Regional de Guerrero y subdirectora de investigación de la Coordinación Nacional de Museos y Exposiciones, además de desarrollar una amplia trayectoria curatorial, docente y de divulgación.',
      en: `She is Director of the National Museum of World Cultures at INAH. She previously directed the Regional Museum of Guerrero and served as Deputy Director of Research at INAH's National Coordination of Museums and Exhibitions, alongside an extensive curatorial, teaching and outreach career.`,
      fr: `Elle dirige le Museo Nacional de las Culturas del Mundo de l'INAH. Elle a auparavant dirigé le Museo Regional de Guerrero et été sous-directrice de la recherche à la Coordination nationale des musées et expositions, parallèlement à une vaste activité curatoriale, pédagogique et de diffusion.`,
      pt: 'É diretora do Museo Nacional de las Culturas del Mundo do INAH. Foi anteriormente diretora do Museo Regional de Guerrero e subdiretora de investigação da Coordenação Nacional de Museus e Exposições, além de desenvolver uma ampla atividade curatorial, docente e de divulgação.',
    },
    tituloIntervencion: '',
    foto: 'https://ik.imagekit.io/h6qtszktl/ponentes%20/Alejandra%20Go%CC%81mez%20Colorado.png',
  },
  {
    id: 5,
    nombre: 'Conrado Rodríguez-Maffiotte Martín',
    cargo: {
      es: 'Doctor en Medicina y Cirugía y director del Instituto Canario de Bioantropología y del Museo Arqueológico de Tenerife, ambos integrados en Museos de Tenerife–Cabildo de Tenerife',
      en: 'Doctor of Medicine and Surgery and Director of the Canary Institute of Bioanthropology and the Archaeological Museum of Tenerife, both part of Museos de Tenerife–Cabildo de Tenerife',
      fr: `Docteur en médecine et chirurgie, il dirige l'Institut canarien de bioanthropologie et le Musée archéologique de Tenerife, tous deux rattachés à Museos de Tenerife–Cabildo de Tenerife`,
      pt: 'Doutor em Medicina e Cirurgia e diretor do Instituto Canário de Bioantropologia e do Museu Arqueológico de Tenerife, ambos integrados em Museos de Tenerife–Cabildo de Tenerife',
    },
    bio: {
      es: 'Es académico de número de la Real Academia de Medicina de Canarias y especialista en bioantropología, paleopatología y estudios de momias. Cuenta con una extensa producción científica y una dilatada trayectoria docente y de gestión patrimonial.',
      en: 'He is a full member of the Royal Academy of Medicine of the Canary Islands and specialises in bioanthropology, palaeopathology and mummy studies, with extensive scientific, teaching and heritage-management experience.',
      fr: `Membre titulaire de la Real Academia de Medicina de Canarias, il est spécialiste de bioanthropologie, paléopathologie et études sur les momies, avec une importante activité scientifique, pédagogique et de gestion patrimoniale.`,
      pt: 'É membro efetivo da Real Academia de Medicina de Canarias e especialista em bioantropologia, paleopatologia e estudos de múmias, com uma extensa trajetória científica, docente e de gestão patrimonial.',
    },
    tituloIntervencion: '',
    foto: 'https://ik.imagekit.io/h6qtszktl/ponentes%20/Conrado%20Rodri%CC%81guez.png',
  },
  {
    id: 6,
    nombre: 'Matilde Arnay de la Rosa',
    cargo: {
      es: 'Doctora en Historia por la Universidad de La Laguna y profesora honoraria de esta universidad',
      en: 'PhD in History from the University of La Laguna and Honorary Professor at the same university',
      fr: `Docteure en histoire de l'Université de La Laguna et professeure honoraire de cette université`,
      pt: 'Doutora em História pela Universidade de La Laguna e Professora Honorária desta universidade',
    },
    bio: {
      es: 'Desarrolló su carrera docente e investigadora en el área de Prehistoria entre 1987 y 2023 y fue responsable del grupo multidisciplinar de investigación en Bioantropología de la ULL. Su trayectoria se ha centrado en la arqueología canaria, la bioantropología y la formación universitaria.',
      en: 'She developed her teaching and research career in Prehistory between 1987 and 2023 and led the ULL multidisciplinary Bioanthropology research group. Her work has focused on Canarian archaeology, bioanthropology and university teaching and training.',
      fr: `Elle a développé sa carrière d'enseignement et de recherche en Préhistoire entre 1987 et 2023 et dirigé le groupe multidisciplinaire de recherche en bioanthropologie de l'ULL. Ses travaux portent principalement sur l'archéologie canarienne, la bioanthropologie et la formation universitaire.`,
      pt: 'Desenvolveu a sua carreira docente e de investigação em Pré-História entre 1987 e 2023 e coordenou o grupo multidisciplinar de investigação em Bioantropologia da ULL. O seu trabalho tem incidido na arqueologia canária, na bioantropologia e na formação universitária.',
    },
    tituloIntervencion: '',
    foto: 'https://ik.imagekit.io/h6qtszktl/ponentes%20/Matilde%20arnay.png',
  },
  {
    id: 7,
    nombre: 'José Fenoll Cascales',
    cargo: {
      es: 'Graduado en Historia del Arte por la Universidad de Murcia e investigador predoctoral en la Universidad Autónoma de Madrid',
      en: 'Graduate in Art History from the University of Murcia and predoctoral researcher at the Autonomous University of Madrid',
      fr: `Diplômé en histoire de l'art de l'Université de Murcie et chercheur prédoctoral à l'Université autonome de Madrid`,
      pt: 'Licenciado em História da Arte pela Universidade de Múrcia e investigador pré-doutoral na Universidade Autónoma de Madrid',
    },
    bio: {
      es: 'Forma parte del grupo de investigación Polemos y del proyecto arqueológico de Coimbra del Barranco Ancho, donde participa en tareas de dirección. Su investigación doctoral se centra en la necrópolis ibérica de Cabecico del Tesoro y en la cerámica y escultura ibéricas.',
      en: 'He is a member of the Polemos research group and the archaeological project at Coimbra del Barranco Ancho, where he contributes to project management. His doctoral research focuses on the Iberian necropolis of Cabecico del Tesoro and on Iberian pottery and sculpture.',
      fr: `Il appartient au groupe de recherche Polemos et au projet archéologique de Coimbra del Barranco Ancho, où il participe à la direction des travaux. Sa thèse porte sur la nécropole ibérique de Cabecico del Tesoro ainsi que sur la céramique et la sculpture ibériques.`,
      pt: 'Integra o grupo de investigação Polemos e o projeto arqueológico de Coimbra del Barranco Ancho, onde participa em tarefas de direção. A sua investigação doutoral centra-se na necrópole ibérica de Cabecico del Tesoro e na cerâmica e escultura ibéricas.',
    },
    tituloIntervencion: '',
    foto: 'https://ik.imagekit.io/h6qtszktl/ponentes%20/Foto%20Jose%CC%81%20Fenoll.png',
  },
  {
    id: 8,
    nombre: 'Said Karboune Rodríguez',
    cargo: {
      es: 'Investigador predoctoral de la Universidad de La Laguna, donde desarrolla una tesis sobre la construcción de la identidad canaria contemporánea y los discursos del regionalismo canario',
      en: 'Predoctoral researcher at the University of La Laguna, where he is completing a dissertation on the construction of contemporary Canarian identity and the discourses of Canarian regionalism',
      fr: `Chercheur prédoctoral à l'Université de La Laguna, où il achève une thèse sur la construction de l'identité canarienne contemporaine et les discours du régionalisme canarien`,
      pt: 'Investigador pré-doutoral da Universidade de La Laguna, onde conclui uma tese sobre a construção da identidade canária contemporânea e os discursos do regionalismo canário',
    },
    bio: {
      es: 'Sus investigaciones analizan las relaciones entre identidad, género, raza y nación en la historia contemporánea de Canarias. Ha publicado artículos y participado en congresos y seminarios especializados sobre estas cuestiones.',
      en: 'His research examines the relationships between identity, gender, race and nation in the modern history of the Canary Islands. He has published articles and presented his work at specialised conferences and seminars.',
      fr: `Ses recherches analysent les relations entre identité, genre, race et nation dans l'histoire contemporaine des Canaries. Il a publié plusieurs articles et présenté ses travaux dans des congrès et séminaires spécialisés.`,
      pt: 'A sua investigação analisa as relações entre identidade, género, raça e nação na história contemporânea das Canárias. Publicou artigos e apresentou trabalhos em congressos e seminários especializados sobre estas questões.',
    },
    tituloIntervencion: '',
    foto: 'https://ik.imagekit.io/h6qtszktl/ponentes%20/Said%20Karboune.png',
  },
  {
    id: 9,
    nombre: 'Raphael Callou',
    cargo: {
      es: 'Politólogo y director general de Cultura de la Organización de Estados Iberoamericanos para la Educación, la Ciencia y la Cultura (OEI)',
      en: 'Political scientist and Director General for Culture at the Organization of Ibero-American States for Education, Science and Culture (OEI)',
      fr: `Politologue et directeur général de la Culture de l'Organisation des États ibéro-américains pour l'éducation, la science et la culture (OEI)`,
      pt: 'Cientista político e Diretor-Geral de Cultura da Organização dos Estados Ibero-Americanos para a Educação, a Ciência e a Cultura (OEI)',
    },
    bio: {
      es: 'Anteriormente fue director y representante de la OEI en Brasil, etapa en la que también participó en la gestión del Museo de Arte de Río. Su trabajo se centra en cooperación cultural, políticas públicas, industrias culturales y creativas y desarrollo sostenible.',
      en: 'He previously served as Director and Representative of the OEI in Brazil, where he also took part in the management of the Rio Art Museum. His work focuses on cultural cooperation, public policy, cultural and creative industries and sustainable development.',
      fr: `Il a auparavant été directeur et représentant de l'OEI au Brésil, où il a également participé à la gestion du Museu de Arte do Rio. Ses activités portent sur la coopération culturelle, les politiques publiques, les industries culturelles et créatives et le développement durable.`,
      pt: 'Foi anteriormente diretor e representante da OEI no Brasil, período em que também participou na gestão do Museu de Arte do Rio. O seu trabalho centra-se na cooperação cultural, políticas públicas, indústrias culturais e criativas e desenvolvimento sustentável.',
    },
    tituloIntervencion: '',
    foto: 'https://ik.imagekit.io/h6qtszktl/ponentes%20/Raphael%20Callou.png',
  },
  {
    id: 10,
    nombre: 'Patricia Ledesma Bouchán',
    cargo: {
      es: 'Arqueóloga, especialista en Gestión del Patrimonio por la Escuela Nacional de Antropología e Historia (ENAH), México',
      en: `Archaeologist specialising in Heritage Management at Mexico's National School of Anthropology and History (ENAH)`,
      fr: `Archéologue, spécialisée en gestion du patrimoine à l'Escuela Nacional de Antropología e Historia (ENAH), au Mexique`,
      pt: 'Arqueóloga, especialista em Gestão do Património pela Escuela Nacional de Antropología e Historia (ENAH), México',
    },
    bio: {
      es: 'Desde 2015 dirige el Museo del Templo Mayor en Ciudad de México y es profesora de Arqueología e Historia en la ENAH. Ha publicado sobre cultura mexica, coordinado diversos libros y comisariado exposiciones sobre temas prehispánicos y gestión del patrimonio, entre ellas tres dedicadas a bienes repatriados: «La colección Julio 2022», «El regreso de Santa Rosa de Lima» (2024) y «Repatriación de Nueva York. Piezas mexicanas de vuelta a casa» (2026).',
      en: `Since 2015, she has directed the Templo Mayor Museum in Mexico City and teaches archaeology and history at ENAH. She has published on Mexica culture, coordinated several books, and curated exhibitions on pre-Hispanic heritage and heritage management, including three devoted to repatriated objects: "La colección Julio 2022", "El regreso de Santa Rosa de Lima" (2024) and "Repatriación de Nueva York. Piezas mexicanas de vuelta a casa" (2026).`,
      fr: `Depuis 2015, elle dirige le Museo del Templo Mayor à Mexico et enseigne l'archéologie et l'histoire à l'ENAH. Elle a publié sur la culture mexica, coordonné plusieurs ouvrages et assuré le commissariat d'expositions sur le patrimoine préhispanique et sa gestion, dont trois consacrées à des biens rapatriés : « La colección Julio 2022 », « El regreso de Santa Rosa de Lima » (2024) et « Repatriación de Nueva York. Piezas mexicanas de vuelta a casa » (2026).`,
      pt: 'Desde 2015 dirige o Museo del Templo Mayor, na Cidade do México, e leciona arqueologia e história na ENAH. Publicou trabalhos sobre a cultura mexica, coordenou vários livros e foi curadora de exposições sobre temas pré-hispânicos e gestão patrimonial, incluindo três dedicadas a bens repatriados: «La colección Julio 2022», «El regreso de Santa Rosa de Lima» (2024) e «Repatriación de Nueva York. Piezas mexicanas de vuelta a casa» (2026).',
    },
    tituloIntervencion: '',
    foto: 'https://ik.imagekit.io/h6qtszktl/ponentes%20/Patricia%20Ledesma%20Bouchan.png',
  },
  {
    id: 11,
    nombre: 'Jesús Robles Moreno',
    cargo: {
      es: 'Doctor en Estudios del Mundo Antiguo por la Universidad Autónoma de Madrid y profesor honorario de su Departamento de Prehistoria y Arqueología',
      en: 'PhD in Ancient World Studies from the Autonomous University of Madrid and Honorary Professor in its Department of Prehistory and Archaeology',
      fr: `Docteur en études du monde antique de l'Université autonome de Madrid et professeur honoraire au Département de Préhistoire et d'Archéologie`,
      pt: 'Doutor em Estudos do Mundo Antigo pela Universidade Autónoma de Madrid e Professor Honorário do Departamento de Pré-História e Arqueologia',
    },
    bio: {
      es: 'Forma parte del grupo de investigación Polemos y es adjunto de dirección del proyecto de Coimbra del Barranco Ancho. Su investigación se centra en el mundo ibérico, especialmente en la escultura, la arquitectura monumental y sus contextos arqueológicos.',
      en: 'He is a member of the Polemos research group and Deputy Director of the Coimbra del Barranco Ancho project. His research focuses on the Iberian world, especially sculpture, monumental architecture and their archaeological contexts.',
      fr: `Membre du groupe de recherche Polemos, il est directeur adjoint du projet de Coimbra del Barranco Ancho. Ses recherches portent sur le monde ibérique, en particulier la sculpture, l'architecture monumentale et leurs contextes archéologiques.`,
      pt: 'Integra o grupo de investigação Polemos e é diretor adjunto do projeto de Coimbra del Barranco Ancho. A sua investigação centra-se no mundo ibérico, em especial na escultura, arquitetura monumental e respetivos contextos arqueológicos.',
    },
    tituloIntervencion: '',
    foto: 'https://ik.imagekit.io/h6qtszktl/ponentes%20/%20Jesu%CC%81s%20Robles.png',
  },
  {
    id: 12,
    nombre: 'Fátima Faria Roque',
    cargo: {
      es: 'Coordinadora de la Rede Portuguesa de Museus y presidenta del Consejo Intergubernamental del Programa Ibermuseos',
      en: 'Coordinator of the Portuguese Museum Network and President of the Intergovernmental Council of the Ibermuseums Programme',
      fr: `Coordinatrice du Réseau portugais des musées et présidente du Conseil intergouvernemental du Programme Ibermuseus`,
      pt: 'Coordenadora da Rede Portuguesa de Museus e Presidente do Conselho Intergovernamental do Programa Ibermuseus',
    },
    bio: {
      es: 'Ha desempeñado cargos de dirección en distintas instituciones y servicios museísticos de Portugal. Es licenciada en Comunicación Social, con formación de posgrado en Cultura Portuguesa Contemporánea y doctorado en Estudios Portugueses. Es también investigadora del Instituto de Estudos de Literatura e Tradição.',
      en: 'She has held management positions in several Portuguese museum institutions and services. She holds a degree in Social Communication, postgraduate training in Contemporary Portuguese Culture and a PhD in Portuguese Studies, and is also a researcher at the Institute for the Study of Literature and Tradition.',
      fr: `Elle a exercé des fonctions de direction dans plusieurs institutions et services muséaux portugais. Diplômée en communication sociale, elle possède une formation de troisième cycle en culture portugaise contemporaine et un doctorat en études portugaises. Elle est également chercheuse à l'Instituto de Estudos de Literatura e Tradição.`,
      pt: 'Exerceu cargos de direção em várias instituições e serviços museológicos portugueses. É licenciada em Comunicação Social, possui formação pós-graduada em Cultura Portuguesa Contemporânea e doutoramento em Estudos Portugueses, sendo também investigadora do Instituto de Estudos de Literatura e Tradição.',
    },
    tituloIntervencion: '',
    foto: 'https://ik.imagekit.io/h6qtszktl/ponentes%20/Fatima%20Roque.png',
  },
  {
    id: 13,
    nombre: 'Tobias Mörike',
    cargo: {
      es: 'Historiador y conservador de la colección de Norte de África, Asia Occidental y Central y Siberia del Weltmuseum Wien',
      en: 'Historian and curator of the North Africa, West and Central Asia and Siberia collection at the Weltmuseum Wien',
      fr: 'Historien et conservateur de la collection Afrique du Nord, Asie occidentale et centrale et Sibérie du Weltmuseum Wien',
      pt: 'Historiador e conservador da coleção do Norte de África, Ásia Ocidental e Central e Sibéria do Weltmuseum Wien',
    },
    bio: {
      es: 'Doctor por la Universidad de Erfurt, investigó la exploración alemana de Palestina entre los siglos XIX y XX. Sus trabajos se centran en la historia del coleccionismo y de la producción de conocimiento en Asia Occidental y Central, así como en la práctica curatorial.',
      en: 'He holds a PhD from the University of Erfurt, where he researched German exploration of Palestine in the nineteenth and early twentieth centuries. His work focuses on the history of collecting and knowledge production in West and Central Asia, as well as curatorial practice.',
      fr: `Docteur de l'Université d'Erfurt, il a étudié l'exploration allemande de la Palestine aux XIXe et début du XXe siècles. Ses recherches portent sur l'histoire des collections et de la production des savoirs en Asie occidentale et centrale, ainsi que sur la pratique curatoriale.`,
      pt: 'Doutorado pela Universidade de Erfurt, investigou a exploração alemã da Palestina nos séculos XIX e início do XX. O seu trabalho centra-se na história do colecionismo e da produção de conhecimento na Ásia Ocidental e Central, bem como na prática curatorial.',
    },
    tituloIntervencion: '',
    foto: 'https://ik.imagekit.io/h6qtszktl/ponentes%20/Tobias%20Mo%CC%88rike.png',
  },
  {
    id: 14,
    nombre: 'Sarita Fuentes Villalobos',
    cargo: {
      es: 'Arqueóloga y analista de investigación y bioarqueología del Museo Pachacamac, Ministerio de Cultura del Perú',
      en: 'Archaeologist and Research and Bioarchaeology Analyst at the Pachacamac Museum, Ministry of Culture of Peru',
      fr: 'Archéologue et analyste de recherche et de bioarchéologie au Museo Pachacamac, ministère de la Culture du Pérou',
      pt: 'Arqueóloga e analista de investigação e bioarqueologia do Museo Pachacamac, Ministério da Cultura do Peru',
    },
    bio: {
      es: 'Su trabajo comprende el análisis, registro y documentación de restos humanos procedentes de contextos funerarios del santuario y el desarrollo de propuestas de divulgación científica. Forma parte del proyecto «Momias como Microcosmos» y cursa la Maestría en Antropología Forense y Bioarqueología de la PUCP.',
      en: `Her work includes the analysis, recording and documentation of human remains from funerary contexts at the sanctuary, together with scientific outreach. She is part of the "Mummies as Microcosms" project and is pursuing a Master's degree in Forensic Anthropology and Bioarchaeology at PUCP.`,
      fr: `Son travail comprend l'analyse, l'enregistrement et la documentation de restes humains issus de contextes funéraires du sanctuaire, ainsi que la diffusion scientifique. Elle participe au projet « Momies comme microcosmes » et suit un master en anthropologie médico-légale et bioarchéologie à la PUCP.`,
      pt: 'O seu trabalho inclui a análise, registo e documentação de restos humanos provenientes de contextos funerários do santuário, bem como divulgação científica. Integra o projeto «Múmias como Microcosmos» e frequenta o mestrado em Antropologia Forense e Bioarqueologia da PUCP.',
    },
    tituloIntervencion: '',
    foto: 'https://ik.imagekit.io/h6qtszktl/ponentes%20/Sarita%20fuentes.png',
  },
  {
    id: 15,
    nombre: 'Benoît de Saint Chamas',
    cargo: {
      es: 'Especialista en cooperación internacional y patrimonio del Ministerio de Europa y Asuntos Exteriores de Francia y antiguo director de gabinete de la Presidencia del Louvre',
      en: 'Specialist in international cooperation and heritage at the French Ministry for Europe and Foreign Affairs and former Chief of Staff to the President of the Louvre',
      fr: `Spécialiste de la coopération internationale et du patrimoine au ministère français de l'Europe et des Affaires étrangères, et ancien directeur de cabinet de la présidence du Louvre`,
      pt: 'Especialista em cooperação internacional e património no Ministério da Europa e dos Negócios Estrangeiros de França e antigo diretor de gabinete da Presidência do Louvre',
    },
    bio: {
      es: 'Colabora con el embajador Jean-Luc Martinez y participó en la elaboración del informe «Patrimoine partagé: universalité, restitutions et circulation des œuvres d\'art» (2023), dedicado a los criterios y procedimientos franceses en materia de restitución. Es además escritor y oficial de la Orden de las Artes y las Letras.',
      en: `He works with Ambassador Jean-Luc Martinez and contributed to the 2023 report "Patrimoine partagé: universalité, restitutions et circulation des œuvres d'art", on French approaches to restitution. He is also a writer and an Officer of the Order of Arts and Letters.`,
      fr: `Il travaille avec l'ambassadeur Jean-Luc Martinez et a contribué au rapport « Patrimoine partagé : universalité, restitutions et circulation des œuvres d'art » (2023), consacré aux approches françaises en matière de restitution. Il est également écrivain et officier des Arts et des Lettres.`,
      pt: 'Trabalha com o embaixador Jean-Luc Martinez e contribuiu para o relatório «Patrimoine partagé : universalité, restitutions et circulation des œuvres d\'art» (2023), dedicado às abordagens francesas sobre restituição. É também escritor e oficial da Ordem das Artes e das Letras.',
    },
    tituloIntervencion: '',
    foto: 'https://ik.imagekit.io/h6qtszktl/ponentes%20/Benoi%CC%82t%20de%20Saint%20Chamas.png',
  },
  {
    id: 16,
    nombre: 'Rebecca Whiting',
    cargo: {
      es: 'Conservadora de Bioarqueología en el Departamento de Egipto y Sudán del British Museum',
      en: 'Curator: Bioarchaeology in the Department of Egypt and Sudan at the British Museum',
      fr: 'Conservatrice de bioarchéologie au département Égypte et Soudan du British Museum',
      pt: 'Conservadora de Bioarqueologia no Departamento do Egito e Sudão do British Museum',
    },
    bio: {
      es: 'Su investigación se ha centrado en la bioarqueología del Sudán antiguo, la antropología dental y diferentes indicadores de salud y enfermedad. En el museo trabaja asimismo sobre cuestiones éticas relacionadas con los restos humanos, su conservación, investigación, exposición pública, procedencia y relación con comunidades e instituciones de origen.',
      en: 'Her research has focused on the bioarchaeology of ancient Sudan, dental anthropology and indicators of health and disease. At the museum, she also works on ethical questions surrounding human remains, including their care, research, display, provenance and relationships with communities and institutions of origin.',
      fr: `Ses recherches portent sur la bioarchéologie du Soudan ancien, l'anthropologie dentaire et différents indicateurs de santé et de maladie. Au musée, elle travaille également sur les questions éthiques liées aux restes humains, notamment leur conservation, leur étude, leur exposition, leur provenance et les relations avec les communautés et institutions d'origine.`,
      pt: 'A sua investigação centra-se na bioarqueologia do Sudão antigo, antropologia dentária e diferentes indicadores de saúde e doença. No museu, trabalha também sobre questões éticas relacionadas com restos humanos, incluindo conservação, investigação, exposição, proveniência e relações com comunidades e instituições de origem.',
    },
    tituloIntervencion: '',
    foto: 'https://ik.imagekit.io/h6qtszktl/ponentes%20/Rebecca%20Whiting.jpeg.png?updatedAt=1790066646524',
  },
  {
    id: 17,
    nombre: 'María Auxiliadora Llamas Márquez',
    cargo: {
      es: 'Historiadora del arte y profesional de museos con más de veinte años de experiencia',
      en: 'Art historian and museum professional with more than twenty years of experience',
      fr: `Historienne de l'art et professionnelle des musées avec plus de vingt ans d'expérience`,
      pt: 'Historiadora de arte e profissional de museus com mais de vinte anos de experiência',
    },
    bio: {
      es: 'Está adscrita al Museo de Cádiz y fue jefa del Servicio de Museos de la Junta de Andalucía entre 2014 y 2020. Miembro de ICOM desde 2008, preside actualmente ICOM España para el mandato 2026–2028 y desarrolla actividad profesional en museología, gestión de colecciones y políticas museísticas.',
      en: 'She is based at the Museum of Cádiz and served as Head of the Museums Service of the Regional Government of Andalusia from 2014 to 2020. An ICOM member since 2008, she currently chairs ICOM Spain for the 2026–2028 term and works on museology, collections management and museum policy.',
      fr: `Elle est rattachée au Museo de Cádiz et a dirigé le Service des musées de la Junta de Andalucía de 2014 à 2020. Membre de l'ICOM depuis 2008, elle préside actuellement ICOM Espagne pour le mandat 2026–2028 et travaille sur la muséologie, la gestion des collections et les politiques muséales.`,
      pt: 'Está vinculada ao Museo de Cádiz e foi chefe do Serviço de Museus da Junta de Andalucía entre 2014 e 2020. Membro do ICOM desde 2008, preside atualmente ao ICOM Espanha para o mandato 2026–2028 e desenvolve trabalho em museologia, gestão de coleções e políticas museológicas.',
    },
    tituloIntervencion: '',
    foto: 'https://ik.imagekit.io/h6qtszktl/ponentes%20/Mari%CC%81a%20Auxiliadora%20Llamas.png',
  },
  {
    id: 18,
    nombre: 'Afaf Wahba',
    cargo: {
      es: 'Bioarqueóloga egipcia y directora del Departamento de Bioarqueología del Ministerio de Turismo y Antigüedades de Egipto',
      en: `Egyptian bioarchaeologist and Director of the Bioarchaeology Department at Egypt's Ministry of Tourism and Antiquities`,
      fr: 'Bioarchéologue égyptienne et directrice du Département de bioarchéologie du ministère égyptien du Tourisme et des Antiquités',
      pt: 'Bioarqueóloga egípcia e diretora do Departamento de Bioarqueologia do Ministério do Turismo e Antiguidades do Egito',
    },
    bio: {
      es: 'Doctora por la Universidad de Minia, está especializada en osteología, paleopatología y análisis de restos humanos procedentes de yacimientos como Saqqara, Minia, Luxor y Guiza. También desarrolla programas de formación en bioarqueología dirigidos a conservadores, inspectores de antigüedades e investigadores egipcios e internacionales.',
      en: 'She holds a PhD from Minia University and specialises in osteology, palaeopathology and the analysis of human remains from sites including Saqqara, Minia, Luxor and Giza. She also leads bioarchaeology training programmes for Egyptian curators, antiquities inspectors and national and international researchers.',
      fr: `Docteure de l'Université de Minia, elle est spécialisée en ostéologie, paléopathologie et analyse des restes humains provenant notamment de Saqqarah, Minia, Louxor et Gizeh. Elle dirige également des programmes de formation en bioarchéologie destinés aux conservateurs, inspecteurs des antiquités et chercheurs égyptiens et internationaux.`,
      pt: 'Doutorada pela Universidade de Minia, é especialista em osteologia, paleopatologia e análise de restos humanos provenientes de sítios como Saqqara, Minia, Luxor e Gizé. Desenvolve também programas de formação em bioarqueologia para conservadores, inspetores de antiguidades e investigadores egípcios e internacionais.',
    },
    tituloIntervencion: '',
    foto: 'https://ik.imagekit.io/h6qtszktl/ponentes%20/Afaf%20Wahba.png',
  },
  {
    id: 19,
    nombre: 'André Delpuech',
    cargo: {
      es: 'Conservador general del patrimonio honorario e investigador vinculado al Centre Alexandre-Koyré (EHESS–CNRS–MNHN)',
      en: 'Honorary Conservateur général du patrimoine and researcher affiliated with the Centre Alexandre-Koyré (EHESS–CNRS–MNHN)',
      fr: 'Conservateur général du patrimoine honoraire et chercheur associé au Centre Alexandre-Koyré (EHESS–CNRS–MNHN)',
      pt: 'Conservador-geral do património honorário e investigador associado ao Centre Alexandre-Koyré (EHESS–CNRS–MNHN)',
    },
    bio: {
      es: `Fue director del Musée de l'Homme entre 2017 y 2022 y anteriormente responsable de las colecciones de las Américas del musée du quai Branly–Jacques Chirac. Fundó el Servicio Arqueológico de Guadalupe y ha desarrollado una amplia trayectoria en arqueología americana, museología e historia de las colecciones.`,
      en: `He directed the Musée de l'Homme from 2017 to 2022 and previously oversaw the Americas collections at the musée du quai Branly–Jacques Chirac. Founder of the Archaeological Service of Guadeloupe, he has built a wide-ranging career in American archaeology, museology and the history of collections.`,
      fr: `Il a dirigé le Musée de l'Homme de 2017 à 2022 et auparavant les collections des Amériques au musée du quai Branly–Jacques Chirac. Fondateur du Service archéologique de la Guadeloupe, il possède une vaste expérience en archéologie américaine, muséologie et histoire des collections.`,
      pt: `Dirigiu o Musée de l'Homme entre 2017 e 2022 e anteriormente foi responsável pelas coleções das Américas no musée du quai Branly–Jacques Chirac. Fundador do Serviço Arqueológico de Guadalupe, possui uma ampla trajetória em arqueologia americana, museologia e história das coleções.`,
    },
    tituloIntervencion: '',
    foto: 'https://ik.imagekit.io/h6qtszktl/ponentes%20/Andre%CC%81%20Delpuech.png',
  },
  {
    id: 20,
    nombre: 'Hamady Bocoum',
    cargo: {
      es: 'Arqueólogo y director de investigación en la Universidad Cheikh Anta Diop de Dakar',
      en: 'Archaeologist and Director of Research at Cheikh Anta Diop University in Dakar',
      fr: 'Archéologue et directeur de recherche à l\'Université Cheikh Anta Diop de Dakar',
      pt: 'Arqueólogo e Diretor de Investigação na Universidade Cheikh Anta Diop de Dakar',
    },
    bio: {
      es: 'Ha sido director del Patrimonio Cultural de Senegal, director del IFAN Cheikh Anta Diop y primer director general del Musée des Civilisations Noires de Dakar. Es miembro de la Academia Nacional de Ciencias y Técnicas de Senegal y ha desarrollado una destacada trayectoria en arqueología africana y gestión del patrimonio.',
      en: `He has served as Senegal's Director of Cultural Heritage, Director of IFAN Cheikh Anta Diop and the first Director General of the Musée des Civilisations Noires in Dakar. He is a member of Senegal's National Academy of Sciences and Technologies and has a distinguished career in African archaeology and heritage management.`,
      fr: `Il a été directeur du Patrimoine culturel du Sénégal, directeur de l'IFAN Cheikh Anta Diop et premier directeur général du Musée des Civilisations Noires de Dakar. Membre de l'Académie nationale des sciences et techniques du Sénégal, il possède une importante carrière en archéologie africaine et en gestion du patrimoine.`,
      pt: 'Foi diretor do Património Cultural do Senegal, diretor do IFAN Cheikh Anta Diop e primeiro diretor-geral do Musée des Civilisations Noires de Dakar. É membro da Academia Nacional de Ciências e Técnicas do Senegal e possui uma destacada trajetória em arqueologia africana e gestão do património.',
    },
    tituloIntervencion: '',
    foto: 'https://ik.imagekit.io/h6qtszktl/ponentes%20/Hamady%20Bocoum.png',
  },
  {
    id: 21,
    nombre: 'Alyne Mayra Rufino dos Santos',
    cargo: {
      es: 'Arqueóloga y directora del Centro Nacional de Arqueologia del Instituto do Patrimônio Histórico e Artístico Nacional (IPHAN), Brasil',
      en: `Archaeologist and Director of the National Centre for Archaeology at Brazil's National Institute of Historic and Artistic Heritage (IPHAN)`,
      fr: `Archéologue et directrice du Centro Nacional de Arqueologia de l'Instituto do Patrimônio Histórico e Artístico Nacional (IPHAN), au Brésil`,
      pt: 'Arqueóloga e diretora do Centro Nacional de Arqueologia do Instituto do Patrimônio Histórico e Artístico Nacional (IPHAN), Brasil',
    },
    bio: {
      es: 'Es máster en Arqueología por la Universidade Federal de Sergipe y actualmente realiza el doctorado en la misma disciplina. Su trayectoria profesional se ha desarrollado en el ámbito del patrimonio arqueológico, la gestión pública y el trabajo con comunidades y territorios de la Amazonía brasileña.',
      en: `She holds a Master's degree in Archaeology from the Federal University of Sergipe and is currently pursuing a PhD in the same field. Her professional experience spans archaeological heritage, public-sector management and work with communities and territories in the Brazilian Amazon.`,
      fr: `Titulaire d'un master en archéologie de l'Universidade Federal de Sergipe, elle poursuit actuellement un doctorat dans la même discipline. Son parcours professionnel associe patrimoine archéologique, gestion publique et travail avec les communautés et territoires de l'Amazonie brésilienne.`,
      pt: 'É mestre em Arqueologia pela Universidade Federal de Sergipe e atualmente frequenta o doutoramento na mesma área. A sua trajetória profissional abrange património arqueológico, gestão pública e trabalho com comunidades e territórios da Amazónia brasileira.',
    },
    tituloIntervencion: '',
    foto: 'https://ik.imagekit.io/h6qtszktl/ponentes%20/Alyne%20Mayra%20Rufino%20dos%20Santos.png',
  },
  {
    id: 22,
    nombre: 'Claire Chastanier',
    cargo: {
      es: 'Adjunta al subdirector de colecciones del Service des musées de France, integrado en la Dirección General de Patrimonios y Arquitectura del Ministerio de Cultura francés',
      en: `Deputy to the Head of Collections at the Service des musées de France, within the French Ministry of Culture's Directorate-General for Heritage and Architecture`,
      fr: `Adjointe au sous-directeur des collections du Service des musées de France, au sein de la Direction générale des patrimoines et de l'architecture du ministère de la Culture`,
      pt: 'Adjunta do subdiretor de coleções do Service des musées de France, integrado na Direção-Geral dos Patrimónios e da Arquitetura do Ministério da Cultura francês',
    },
    bio: {
      es: 'Su actividad profesional se centra en la política pública de colecciones, la gestión de los museos de Francia, la investigación de procedencia y los marcos institucionales vinculados con la circulación, restitución y gestión responsable de bienes culturales.',
      en: 'Her work focuses on public collections policy, the administration of French museums, provenance research and institutional frameworks relating to the circulation, restitution and responsible management of cultural property.',
      fr: `Son activité porte sur les politiques publiques de collections, l'administration des musées de France, la recherche de provenance et les cadres institutionnels relatifs à la circulation, la restitution et la gestion responsable des biens culturels.`,
      pt: 'A sua atividade centra-se nas políticas públicas de coleções, administração dos museus de França, investigação de proveniência e enquadramentos institucionais relacionados com circulação, restituição e gestão responsável de bens culturais.',
    },
    tituloIntervencion: '',
    foto: 'https://ik.imagekit.io/h6qtszktl/ponentes%20/Claire%20Chastanier.png',
  },
  {
    id: 23,
    nombre: 'Mustapha Jlok',
    cargo: {
      es: 'Antropólogo, conservador del patrimonio y director del Patrimonio Cultural del Ministerio de Juventud, Cultura y Comunicación de Marruecos',
      en: 'Anthropologist, heritage curator and Director of Cultural Heritage at Morocco\'s Ministry of Youth, Culture and Communication',
      fr: 'Anthropologue, conservateur du patrimoine et directeur du Patrimoine culturel au ministère marocain de la Jeunesse, de la Culture et de la Communication',
      pt: 'Antropólogo, conservador do património e diretor do Património Cultural do Ministério da Juventude, Cultura e Comunicação de Marrocos',
    },
    bio: {
      es: `Formado en el Institut National des Sciences de l'Archéologie et du Patrimoine, ha desarrollado su trayectoria en la investigación, protección y gestión del patrimonio marroquí. Es autor y editor de trabajos relacionados con patrimonio, museos y cultura amazigh.`,
      en: `Trained at the Institut National des Sciences de l'Archéologie et du Patrimoine, he has built his career around the research, protection and management of Moroccan heritage. He is the author and editor of publications on heritage, museums and Amazigh culture.`,
      fr: `Formé à l'Institut National des Sciences de l'Archéologie et du Patrimoine, il a consacré sa carrière à la recherche, à la protection et à la gestion du patrimoine marocain. Il est auteur et éditeur de publications sur le patrimoine, les musées et la culture amazighe.`,
      pt: `Formado no Institut National des Sciences de l'Archéologie et du Patrimoine, desenvolveu a sua carreira na investigação, proteção e gestão do património marroquino. É autor e editor de publicações sobre património, museus e cultura amazigh.`,
    },
    tituloIntervencion: '',
    foto: 'https://ik.imagekit.io/h6qtszktl/ponentes%20/Mustapha%20Jlok.png',
  },
  {
    id: 24,
    nombre: 'María José Miñana',
    cargo: {
      es: 'Especialista de programa en la Unidad de Patrimonio Mueble y Museos del Sector de Cultura de la UNESCO',
      en: `Programme Specialist in UNESCO's Movable Heritage and Museums Unit, Culture Sector`,
      fr: `Spécialiste de programme au sein de l'Unité du patrimoine mobilier et des musées du Secteur de la culture de l'UNESCO`,
      pt: 'Especialista de programa na Unidade de Património Móvel e Museus do Setor da Cultura da UNESCO',
    },
    bio: {
      es: 'Su trabajo se centra en la protección del patrimonio cultural mueble, la aplicación de la Convención de 1970, la prevención del tráfico ilícito de bienes culturales y el fortalecimiento de la cooperación internacional en materia de retorno y restitución, así como en proyectos de sensibilización y formación.',
      en: 'Her work focuses on the protection of movable cultural heritage, implementation of the 1970 Convention, prevention of illicit trafficking in cultural property and international cooperation on return and restitution, as well as awareness-raising, capacity-building and partnership development.',
      fr: `Son travail porte sur la protection du patrimoine culturel mobilier, la mise en œuvre de la Convention de 1970, la prévention du trafic illicite de biens culturels et la coopération internationale en matière de retour et de restitution, ainsi que sur la sensibilisation et le renforcement des capacités.`,
      pt: 'O seu trabalho centra-se na proteção do património cultural móvel, aplicação da Convenção de 1970, prevenção do tráfico ilícito de bens culturais e cooperação internacional em matéria de retorno e restituição, bem como em ações de sensibilização, capacitação e desenvolvimento de parcerias.',
    },
    tituloIntervencion: '',
    foto: 'https://ik.imagekit.io/h6qtszktl/ponentes%20/Foto%20Maria%20Jose%20Min%CC%83ana.png',
  },
  {
    id: 25,
    nombre: 'Daniel Pérez Estévez',
    cargo: {
      es: 'Director de la Sociedad Científica El Museo Canario',
      en: 'Director of the Scientific Society El Museo Canario',
      fr: 'Directeur de la Sociedad Científica El Museo Canario',
      pt: 'Diretor da Sociedade Científica El Museo Canario',
    },
    bio: {
      es: 'Es doctor en Economía y doctorando en Historia, con formación de posgrado en política internacional, comercio exterior, dirección empresarial y responsabilidad social corporativa. Ha desarrollado su carrera en la gestión de entidades culturales y educativas, sostenibilidad y cooperación internacional. Sus trabajos recientes incluyen proyectos de cooperación museística y patrimonio canario disperso.',
      en: 'He holds a PhD in Economics and is a doctoral candidate in History, with postgraduate training in international policy, foreign trade, business management and corporate social responsibility. His career spans the management of cultural and educational institutions, sustainability and international cooperation, including recent work on museum partnerships and dispersed Canarian heritage.',
      fr: `Docteur en économie et doctorant en histoire, il possède une formation de troisième cycle en politique internationale, commerce extérieur, gestion d'entreprise et responsabilité sociale. Sa carrière couvre la direction d'institutions culturelles et éducatives, la durabilité et la coopération internationale, avec des travaux récents sur la coopération muséale et le patrimoine canarien dispersé.`,
      pt: 'É doutor em Economia e doutorando em História, com formação pós-graduada em política internacional, comércio externo, gestão empresarial e responsabilidade social corporativa. Desenvolveu a sua carreira na gestão de instituições culturais e educativas, sustentabilidade e cooperação internacional, incluindo trabalhos recentes sobre cooperação museológica e património canário disperso.',
    },
    tituloIntervencion: '',
    foto: 'https://ik.imagekit.io/h6qtszktl/ponentes%20/Daniel%20Pe%CC%81rez%20Este%CC%81vez.png',
  },
]
