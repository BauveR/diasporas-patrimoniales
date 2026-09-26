import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion, type PanInfo } from 'framer-motion'
import { PARTICIPANTES, type Participante, fotoThumbnail, fotoCompleta, participanteAnchorId } from '../data/participantes'
import { SlideInText } from './SlideInText'
import { ParticipantesBackground } from './ParticipantesBackground'
import { RevealOnScroll, RevealGroup, RevealItem } from './RevealOnScroll'
import { useIsDesktop } from '../hooks/useIsDesktop'
import { mq } from '../lib/breakpoints'
import type { Locale } from '../i18n/config'

const labelStyle = { fontFamily: "'Open Sans', sans-serif" }

// La grilla de participantes solo es de 5 columnas desde md: (768px, ver el
// className del grid en ParticipantesSection) — entre 640 y 767px sigue
// siendo de 3 (useIsDesktop ya da true ahí). El panel expandido que fusiona
// 2 columnas (ParticipanteExpandido) solo tiene sentido con 5 columnas
// reales; en el rango de 3 se sigue usando el modal centrado de siempre.
function useIsFiveColumns() {
  const [isFiveCol, setIsFiveCol] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(mq('md')).matches,
  )
  useEffect(() => {
    const mql = window.matchMedia(mq('md'))
    const handler = (e: MediaQueryListEvent) => setIsFiveCol(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])
  return isFiveCol
}

function FotoPlaceholder() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="h-12 w-12 text-stone-300">
        <circle cx="12" cy="8" r="3.2" />
        <path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6" />
      </svg>
    </div>
  )
}

function ParticipanteCard({
  id,
  nombre,
  cargo,
  foto,
  onFotoClick,
}: Pick<Participante, 'id' | 'nombre' | 'foto'> & { cargo: string; onFotoClick: () => void }) {
  return (
    // Toda la tarjeta es un solo botón (antes solo la foto lo era) — así se
    // puede abrir el popup haciendo clic en cualquier parte, incluida la
    // placa. `group` deja que la foto reaccione al hover del botón entero,
    // no solo al propio (ver group-hover más abajo). Sin ancho fijo: ocupa
    // el ancho real de su celda en la grilla. `id` (participanteAnchorId):
    // adónde hace scroll un nombre clickeado en ProgramaTimeline.
    <button
      type="button"
      id={participanteAnchorId(id)}
      onClick={onFotoClick}
      aria-label={nombre}
      className="group flex w-full flex-col scroll-mt-16 rounded-lg text-left transition-shadow duration-300"
    >
      {/* Cuadrado, más chico que el ancho de la celda (w-[75%], centrado) y
          sin fondo propio (fondo transparente real del PNG) —
          object-contain en vez de cover, a tono con "que no se corten" del
          popup. relative z-0 + group-hover (en vez de hover propio, ahora
          que el click está en el botón padre): el `transform` del scale le
          abre su propio stacking context, así que sin z-index explícito acá
          y z-10 en la placa, al crecer se pintaba por encima de la placa. */}
      <div className="relative z-0 mx-auto aspect-square w-[75%] overflow-hidden transition-transform duration-300 group-hover:scale-105">
        {foto ? (
          <img src={foto} alt={nombre} loading="lazy" decoding="async" className="h-full w-full object-contain" />
        ) : (
          <FotoPlaceholder />
        )}
      </div>
      {/* Placa pegada directo a la foto (sin gap), mismo ancho que la
          celda — al ser más angosta que la foto queda como una base
          ligeramente más ancha asomando debajo.

          Patrón de grilla de speakers/equipo de la industria (SU.org y
          similares, revisado antes en esta conversación): la tarjeta de la
          grilla NUNCA muestra la bio completa, muestra nombre + una
          descripción corta truncada, y el texto completo vive en el
          detalle al hacer clic — que acá ya existe (ParticipanteModal/
          ParticipanteSheet). Por eso el cargo va con line-clamp (3 líneas)
          en vez de intentar que quepa completo — eso era lo que obligaba a
          una placa gigante para calzar con la persona de cargo más largo,
          dejando hueco vacío en las otras 24. Con el texto acotado,
          min-h-32 (128px) alcanza para nombre (hasta 2 líneas) + cargo
          (hasta 3) + separador + padding, y las 25 quedan parejas de
          verdad, sin ese hueco.

          Formación editorial: el nombre vive en una zona de alto fijo
          (min-h-10 = 40px, lo que ocupan 2 líneas de text-sm) en vez de
          fluir pegado al cargo — así el cargo siempre arranca en el mismo
          punto Y sea cual sea el nombre. Dentro de esa zona, flex +
          items-center centra el nombre verticalmente. La línea fina debajo
          (el separador) marca ese límite fijo, como en un créditos/masthead
          editorial.

          Color: arranca en el rojo teja de marca (#9b2923, el mismo del
          navbar/footer) y pasa a negro cuando la tarjeta entra en viewport
          (whileInView, una sola vez) — el mismo momento en que RevealItem
          la hace aparecer (fade + slide), pero animando el color por su
          cuenta en vez de sumarlo a esas variants compartidas (que las usan
          también otras secciones del sitio; tocarlas ahí las afectaría a
          todas). */}
      <motion.div
        className="relative z-10 flex min-h-32 flex-col justify-start rounded-2xl px-4 py-3 text-center"
        // Literal hex on purpose, not the brand-red @theme token: framer-motion
        // interpolates this color in JS, and a CSS var() string isn't a color
        // it can parse/animate between — it needs the real value.
        initial={{ backgroundColor: '#9b2923' }}
        whileInView={{ backgroundColor: '#000000' }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
      >
        <div className="flex min-h-10 flex-col items-center justify-center">
          <h3 className="line-clamp-2 font-mattone text-sm font-normal text-white">{nombre}</h3>
        </div>
        <div className="mx-auto my-2 h-px w-8 bg-white/30" />
        <span className="line-clamp-3 text-xs text-white" style={labelStyle}>
          {cargo}
        </span>
      </motion.div>
    </button>
  )
}

// Bloque de nombre/cargo/título/bio — el único pedazo que de verdad comparten
// el sheet mobile (columna, centrado) y el modal desktop/tablet (fila,
// alineado a la izquierda); cada uno decide layout y tamaño de foto por su
// lado en vez de forzar un solo componente a las dos formas.
function ParticipanteTextos({
  participante,
  className = '',
  dark = false,
  dense = false,
}: {
  participante: Participante
  className?: string
  // El panel expandido en la grilla (ParticipanteExpandido) va sobre fondo
  // negro; sheet/modal van sobre blanco — mismo componente, paleta de texto
  // distinta según el fondo en vez de forzar un solo esquema de color.
  dark?: boolean
  // ParticipanteExpandido: su alto lo fija la fila de la grilla (foto +
  // nombre de las tarjetas vecinas), no un contenedor con margen de sobra
  // como sheet/modal — con la bio más larga (449 caracteres, Patricia
  // Ledesma Bouchán) medido en vivo a 832px de ancho (el peor caso de `lg`):
  // 320px de contenido contra 242px de fila real, 78px de más. Texto/gaps
  // más chicos en vez de agregar su propio scroll.
  dense?: boolean
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language as Locale
  return (
    <div className={`flex flex-col ${dense ? 'gap-2' : 'gap-4'} ${className}`}>
      <div className="flex flex-col gap-1">
        {/* Sin `style={labelStyle}` acá a propósito — un inline style siempre
            gana por encima de una clase, así que el `font-mattone` de abajo
            quedaba pisado por el Open Sans de labelStyle y el nombre nunca
            llegó a renderizar en Mattone pese a la clase. */}
        <h3 className={`font-mattone font-bold leading-[1.05] ${dense ? 'text-xl' : 'text-3xl'} ${dark ? 'text-white' : 'text-stone-900'}`}>
          {participante.nombre}
        </h3>
        <p className={`tracking-wide ${dense ? 'text-xs' : 'text-sm'} ${dark ? 'text-white/60' : 'text-stone-400'}`} style={labelStyle}>
          {participante.cargo[locale] || t('participantes.cargoPendiente')}
        </p>
      </div>
      {participante.tituloIntervencion && (
        // Gambetta bold italic — mismo acento "editorial" que ya usa el
        // email de confirmación para su titular, acá como cita destacada
        // del título de la intervención en vez de negrita+cursiva fingida
        // sobre la tipografía de cuerpo.
        <p className={`font-gambetta italic ${dense ? 'text-sm' : 'text-xl'} leading-snug ${dark ? 'text-[#e8a79f]' : 'text-brand-red'}`}>
          "{participante.tituloIntervencion}"
        </p>
      )}
      <p className={`${dense ? 'text-xs leading-snug' : 'text-[15px] leading-relaxed'} ${dark ? 'text-white/80' : 'text-stone-600'}`} style={labelStyle}>
        {participante.bio[locale] || t('participantes.bioPendiente')}
      </p>
    </div>
  )
}

function ParticipanteFoto({
  participante,
  className,
  circular = true,
}: {
  participante: Participante
  className: string
  // Experimento a pedido: en los popups (sheet/modal) probar sin el círculo,
  // ya que las fotos son PNG y forzarlas a un círculo recorta contenido que
  // un recuadro completo (object-contain, sin crop) no recortaría. La
  // tarjeta de la grilla (ParticipanteCard) no usa este componente, así que
  // no se toca.
  circular?: boolean
}) {
  return (
    <div
      className={`shrink-0 overflow-hidden ${circular ? 'rounded-full border border-stone-700 bg-stone-800' : 'bg-stone-800'} ${className}`}
    >
      {participante.foto ? (
        <img
          src={fotoCompleta(participante)}
          alt={participante.nombre}
          loading="lazy"
          className={`h-full w-full ${circular ? 'object-cover' : 'object-contain'}`}
        />
      ) : (
        <FotoPlaceholder />
      )}
    </div>
  )
}

function CerrarButton({ onClose, className }: { onClose: () => void; className: string }) {
  const { t } = useTranslation()
  return (
    <button type="button" onClick={onClose} aria-label={t('participantes.cerrar')} className={className}>
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M18 6 6 18M6 6l12 12" />
      </svg>
    </button>
  )
}

// Tarjeta tipo iOS que sube desde abajo — mobile (< 640px, ver
// ParticipantesSection). `drag="y"` + dragConstraints/dragElastic dejan
// arrastrarla hacia abajo para cerrarla, además del backdrop y el botón X.
function ParticipanteSheet({ participante, onClose }: { participante: Participante; onClose: () => void }) {
  const handleDragEnd = (_e: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) => {
    if (info.offset.y > 120 || info.velocity.y > 500) onClose()
  }

  return (
    <>
      <motion.div
        className="fixed inset-0 z-[1500] bg-black/40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
      />
      <motion.div
        className="fixed inset-x-0 bottom-0 z-[1600] max-h-[85svh] overflow-y-auto rounded-t-3xl bg-stone-900 shadow-xl pb-[env(safe-area-inset-bottom,0px)]"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 34 }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.6 }}
        onDragEnd={handleDragEnd}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1.5 w-10 rounded-full bg-white/20" />
        </div>
        <CerrarButton
          onClose={onClose}
          className="absolute top-4 right-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
        />
        <div className="flex flex-col items-center gap-6 px-8 pt-6 pb-10 text-center">
          <ParticipanteFoto participante={participante} className="h-28 w-28" circular={false} />
          <ParticipanteTextos participante={participante} className="items-center text-center" dark />
        </div>
      </motion.div>
    </>
  )
}

// Modal centrado — desktop/tablet (≥ 640px, `useIsDesktop`). Mismo lenguaje
// visual que ActividadModal/AuthModal (backdrop + scale-in) en vez del sheet
// que sube desde abajo, que en pantallas anchas no tiene el mismo sentido
// "tipo iOS" (no hay borde inferior de pantalla al que anclarse).
// Foto a la izquierda / texto a la derecha. Ancho/alto ajustados a pedido en
// pasos sucesivos desde la versión centrada original (24rem): +60% ancho,
// luego +50% más (38.4rem→57.6rem); alto +30% y luego -10% (35rem→31.5rem).
// El padding es asimétrico (pl-28 > pr-14), no `justify-center`, para
// correr la foto hacia la derecha en vez de dejarla pegada al borde
// izquierdo. Foto +20% (16rem→19.2rem); texto en `max-w-sm` (más ancho que
// el `max-w-xs` anterior) para aprovechar el espacio ganado.
function ParticipanteModal({ participante, onClose }: { participante: Participante; onClose: () => void }) {
  return (
    <>
      <motion.div
        className="fixed inset-0 z-[1500] bg-black/40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
      />
      <motion.div
        className="fixed inset-0 z-[1600] flex items-center justify-center p-6 pointer-events-none"
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        <div
          className="relative w-full max-w-[57.6rem] min-h-[31.5rem] max-h-[85svh] overflow-y-auto rounded-3xl bg-stone-900 shadow-xl pointer-events-auto"
          onClick={e => e.stopPropagation()}
        >
          <CerrarButton
            onClose={onClose}
            className="absolute top-4 right-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          />
          <div className="flex h-full min-h-[31.5rem] items-center gap-12 py-10 pr-16 pl-28">
            <ParticipanteFoto participante={participante} className="h-[19.2rem] w-[19.2rem]" circular={false} />
            <ParticipanteTextos participante={participante} className="max-w-md text-left" dark />
          </div>
        </div>
      </motion.div>
    </>
  )
}

// Panel que "nace" en el lugar donde estaba la tarjeta clickeada, ocupando
// 3 columnas de la grilla (foto izquierda, texto completo a la derecha) —
// alternativa a reflowar el grid de verdad: es un elemento `position:
// absolute` ubicado por líneas de grid (`gridColumn`/`gridRow` inline), así
// no contribuye al alto de esa fila ni corre a las otras tarjetas (los 25
// siguen en su lugar normal de siempre; este panel las tapa visualmente
// nada más). `overflow-y-auto` en el texto es la red de seguridad si algún
// bio puntual no entra en el alto de una fila.
//
// SPAN=3 centrado en la tarjeta clickeada cuando hay lugar a ambos lados
// (come un vecino de cada lado, no dos del mismo): columna ideal de inicio
// = posición-1 (así la clickeada queda en el medio de las 3), recortada a
// [1, columnas-SPAN+1] para no salirse de la fila de 5. Con eso: posición 1
// y 2 arrancan en la columna 1 (comen a la derecha, no hay a la izquierda);
// posición 3 queda perfectamente centrada (columnas 2-4); posición 4 y 5
// arrancan en la columna 3 (comen a la izquierda, no hay a la derecha).
const EXPANDED_SPAN = 3
const COLUMNS_PER_ROW = 5
function ParticipanteExpandido({
  participante,
  index,
  onClose,
}: {
  participante: Participante
  index: number
  onClose: () => void
}) {
  const row = Math.floor(index / COLUMNS_PER_ROW) + 1
  const colInRow = (index % COLUMNS_PER_ROW) + 1
  const idealStart = colInRow - 1
  const maxStart = COLUMNS_PER_ROW - EXPANDED_SPAN + 1
  const startCol = Math.min(Math.max(idealStart, 1), maxStart)
  return (
    <motion.div
      style={{ gridColumn: `${startCol} / span ${EXPANDED_SPAN}`, gridRow: `${row} / span 1` }}
      // Mismo negro (bg-stone-900, sin borde) que ActividadExpandido/
      // AmbosDiasExpandido — la card de registro desplegable — para que
      // todos los paneles "desplegables" del sitio compartan un solo
      // lenguaje visual.
      className="absolute inset-0 z-20 flex overflow-hidden rounded-2xl bg-stone-900 shadow-xl"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {/* Columna de foto un 30% más chica que antes (2/5 = 40% → 28%) —
          object-contain (no cover) para que el fondo gris se note alrededor
          de la foto en vez de quedar tapado por un recorte a pantalla
          completa. La columna de texto gana lo que la foto cede. */}
      <div className="h-full w-[28%] shrink-0">
        {participante.foto ? (
          <img
            src={fotoCompleta(participante)}
            alt={participante.nombre}
            loading="lazy"
            className="h-full w-full object-contain"
          />
        ) : (
          <FotoPlaceholder />
        )}
      </div>
      <div className="flex w-[72%] flex-col justify-center gap-3 overflow-y-auto px-6 py-3 text-left">
        {/* `dense`: ver el comentario en ParticipanteTextos — este alto lo
            fija la fila de la grilla, no da margen de sobra como
            sheet/modal. */}
        <ParticipanteTextos participante={participante} dense dark />
      </div>
      <CerrarButton
        onClose={onClose}
        className="absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
      />
    </motion.div>
  )
}

export function ParticipantesSection() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language as Locale
  const isDesktop = useIsDesktop()
  const isFiveCol = useIsFiveColumns()
  const [selected, setSelected] = useState<Participante | null>(null)
  const selectedIndex = selected ? PARTICIPANTES.findIndex(p => p.id === selected.id) : -1

  return (
    <section id="participantes" className="relative w-full overflow-hidden scroll-mt-16 bg-stone-100 px-10 py-24 sm:px-16 sm:py-32 lg:px-24 lg:py-40">
      <ParticipantesBackground />
      <div className="relative z-10 mx-auto flex max-w-7xl flex-col gap-10">
        <div className="flex flex-col gap-4">
          <SlideInText
            text={t('participantes.titulo')}
            revealOnScroll
            className="font-mattone text-fluid-title font-bold tracking-tight text-brand-red uppercase"
          />
          <RevealOnScroll>
            <p className="max-w-2xl text-base leading-relaxed text-stone-600 md:text-lg lg:text-xl" style={labelStyle}>
              {t('participantes.parrafo1')}
            </p>
          </RevealOnScroll>
        </div>

        {/* 25 ponentes → grilla de 5 columnas (5×5 en desktop), sin el
            col-span/col-start manual que usaba la plantilla de referencia
            (11 miembros) para centrar una última fila incompleta: 25 entra
            parejo en 5. staggerChildren bajo (0.06) porque son 25 tarjetas:
            con el 0.12 por defecto la última no arrancaría hasta ~3s después
            de la primera; a 0.06 el total baja a ~1.5s. */}
        <RevealGroup
          className="relative grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 md:grid-cols-5"
          amount={0.05}
          staggerChildren={0.06}
        >
          {PARTICIPANTES.map(p => (
            <RevealItem key={p.id}>
              <ParticipanteCard
                id={p.id}
                nombre={p.nombre}
                cargo={p.cargo[locale] || t('participantes.cargoPendiente')}
                foto={fotoThumbnail(p)}
                onFotoClick={() => setSelected(p)}
              />
            </RevealItem>
          ))}

          {/* Solo con 5 columnas reales (ver useIsFiveColumns) — ahí es
              donde la cuenta fila/columna de ParticipanteExpandido tiene
              sentido. En 3 o 2 columnas (tablet/mobile) se sigue usando el
              modal/sheet de siempre, más abajo. */}
          <AnimatePresence>
            {selected && isFiveCol && selectedIndex >= 0 && (
              <ParticipanteExpandido
                key={selected.id}
                participante={selected}
                index={selectedIndex}
                onClose={() => setSelected(null)}
              />
            )}
          </AnimatePresence>
        </RevealGroup>
      </div>

      <AnimatePresence>
        {selected &&
          !isFiveCol &&
          (isDesktop ? (
            <ParticipanteModal participante={selected} onClose={() => setSelected(null)} />
          ) : (
            <ParticipanteSheet participante={selected} onClose={() => setSelected(null)} />
          ))}
      </AnimatePresence>
    </section>
  )
}
