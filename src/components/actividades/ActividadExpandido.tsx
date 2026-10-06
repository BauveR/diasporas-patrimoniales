import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion } from 'framer-motion'
import { PROGRAMA_DIA_1, PROGRAMA_DIA_2 } from '../../data/programa'
import { ProgramaTimeline } from '../ProgramaTimeline'
import { ShareButton } from './ShareButton'
import { BookingWidget } from './BookingWidget'
import { useDataContext } from '../../contexts/DataContext'
import { useActividadBooking } from '../../hooks/useActividadBooking'
import { SITE_URL } from '../SeoHead'
import type { Actividad } from '../../data/actividades'
import { labelStyle } from '../../lib/styles'
import { formatFechaLarga } from '../../utils/formatMes'
import { ikImage } from '../../lib/imagekit'

export function CerrarButton({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      onClick={onClose}
      aria-label="Cerrar"
      className="absolute top-4 right-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white shadow-sm transition-colors hover:bg-white/20 cursor-pointer"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M18 6 6 18M6 6l12 12" />
      </svg>
    </button>
  )
}

// El evento tiene exactamente 2 actividades — una por jornada (ver el mismo
// mapeo hardcodeado ya usado en ActividadCard.tsx para tituloTraducido) —
// así que id 1/2 identifican de forma estable e inequívoca qué timeline de
// programa.ts le corresponde a cada una. Sin match (ninguna actividad futura
// rompería esto hoy, pero por las dudas), se cae a `null` y el panel muestra
// la descripción libre en su lugar.
function getProgramaDia(actividadId: number) {
  if (actividadId === 1) return PROGRAMA_DIA_1
  if (actividadId === 2) return PROGRAMA_DIA_2
  return null
}

// Panel horizontal que "nace" dentro de la propia sección que lo abrió
// (InscripcionSection en Home, la grilla de "Mis inscripciones" en Perfil)
// en vez de un modal que cubre toda la pantalla — mismo espíritu que
// ParticipanteExpandido (ParticipantesSection.tsx): sin backdrop, sin
// position:fixed, ocupa el espacio de la propia sección. A diferencia de
// ese, no se ancla a una celda de grilla exacta (InscripcionSection no es
// una grilla CSS fija como la de participantes) — reemplaza directamente el
// contenido de tarjetas de la sección mientras está abierto, usando el
// ancho total de esa sección como lienzo.
//
// Contenido: en vez de `actividad.descripcion` (el texto libre con el
// programa del día entero pegado como un solo bloque — la razón por la que
// el panel crecía mucho más alto que la sección), el 70% izquierdo reusa
// directo <ProgramaTimeline> con los mismos datos que ya muestra la sección
// Programa — mismo componente, ya colapsado por defecto, nada duplicado ni
// desincronizado entre las dos secciones.
// `bare`: used by ActividadSheet (mobile bottom sheet, ActividadSheet.tsx) to
// embed this same content without its own rounded/bordered/shadowed box or
// close button — the sheet already provides both (drag handle + X), and
// double framing looked wrong nested inside another rounded container.
export function ActividadExpandido({ actividad, onClose, bare = false }: { actividad: Actividad; onClose: () => void; bare?: boolean }) {
  const { t } = useTranslation()
  const { sedes } = useDataContext()
  const booking = useActividadBooking(actividad)
  const sede = sedes.find(s => s.id === actividad.sedeId)

  const today = new Date().toISOString().slice(0, 10)
  const esPasada = actividad.fecha < today
  const esCancelada = !!actividad.cancelada
  const noAbierto = !!actividad.fechaAperturaInscripciones && actividad.fechaAperturaInscripciones > today
  const fecha = formatFechaLarga(actividad.fecha)
  const plazasOcupadas = actividad.plazas - actividad.plazasDisponibles
  const pct = Math.round((plazasOcupadas / actividad.plazas) * 100)

  const programaDia = getProgramaDia(actividad.id)
  const diaLabel = actividad.id === 2 ? t('programa.dia2') : t('programa.dia1')

  const widgetProps = {
    actividad, fecha, pct,
    esPasada, esCancelada, noAbierto,
    isLoggedIn: booking.isLoggedIn,
    inscrito: booking.inscrito,
    inscribiendo: booking.inscribiendo,
    inscripcionError: booking.inscripcionError,
    confirmando: booking.confirmando,
    setConfirmando: booking.setConfirmando,
    liberando: booking.liberando,
    onLiberar: booking.handleLiberar,
    onRequestLogin: booking.handleRequestLogin,
    mostrandoTelefono: booking.mostrandoTelefono,
    setMostrandoTelefono: booking.setMostrandoTelefono,
    avisoSesionIniciada: booking.avisoSesionIniciada,
    telefono: booking.telefono,
    onTelefonoChange: booking.onTelefonoChange,
    telefonoError: booking.telefonoError,
    aceptoTerminos: booking.aceptoTerminos,
    setAceptoTerminos: booking.setAceptoTerminos,
    onConfirmarInscripcion: booking.handleConfirmarInscripcion,
    onCancelarTelefono: booking.handleCancelarTelefono,
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={
        bare
          ? 'relative w-full bg-stone-900'
          : 'relative w-full overflow-hidden rounded-3xl bg-stone-900 shadow-xl sm:max-h-[75svh]'
      }
    >
      {!bare && <CerrarButton onClose={onClose} />}
      {/* 60/40 — programa del día a la izquierda, imagen + inscripción a la
          derecha. Cada columna scrollea por su cuenta (`overflow-y-auto`)
          dentro del `max-h` del panel en vez de estirar la sección entera
          cuando el día tiene muchos paneles — o al menos esa era la
          intención: `sm:h-full` (height:100%) no confiaba, en la práctica,
          en el alto ya recortado por el `max-h` del padre (medido en vivo:
          el padre quedaba en 637px pero este grid seguía midiendo 775px,
          como si `h-full` nunca hubiera recalculado contra el `max-height`
          del padre) — así que ninguna columna detectaba que necesitaba
          scrollear, y el `overflow-hidden` del panel recortaba el resto sin
          dejar forma de verlo. `sm:max-h-[75svh]` (mismo valor que el panel)
          + `sm:grid-rows-1` (Tailwind: `grid-template-rows: minmax(0,1fr)`)
          arregla ambas partes: el propio grid queda con un tope absoluto en
          vez de depender de un porcentaje, y `minmax(0, ...)` deja que la
          fila se achique por debajo de su alto de contenido en vez de
          crecer para acomodarlo — sin eso, un `max-height` en el grid solo
          movería el mismo recorte un nivel más abajo. */}
      <div className="grid grid-cols-1 sm:max-h-[75svh] sm:grid-rows-1 sm:grid-cols-[6fr_4fr]">
        <div className="order-2 overflow-y-auto p-6 sm:order-1 sm:p-8">
          <div className="mb-6 flex flex-col gap-1.5">
            <span
              className="w-fit rounded-lg bg-brand-red px-4 py-2 font-mattone text-sm font-bold tracking-wide text-white uppercase"
            >
              {actividad.titulo}
            </span>
            <span className="text-xs text-stone-400 capitalize" style={labelStyle}>
              {fecha}{actividad.hora ? ` · ${actividad.hora}` : ''}{actividad.duracion ? ` · ${actividad.duracion}` : ''}
            </span>
          </div>
          {programaDia ? (
            // `dense`: this panel has to fit the whole day's agenda in
            // max-h-[75svh] without its own scroll (see the grid comment
            // above) — half the row spacing buys back what the narrower `lg`
            // column costs in extra text-wrapped lines. ProgramaSection.tsx's
            // own (non-embedded) timeline keeps its relaxed default spacing.
            // `dark`: this panel now uses the black-card treatment — see
            // ProgramaTimeline's own `dark` prop comment.
            <ProgramaTimeline dia={diaLabel} items={programaDia} dense dark />
          ) : (
            <p className="text-sm text-stone-300 leading-relaxed wrap-break-word whitespace-pre-line" style={labelStyle}>
              {actividad.descripcion}
            </p>
          )}
        </div>

        <div className="order-1 flex flex-col gap-3 overflow-y-auto p-4 sm:order-2 sm:border-l sm:border-white/10 sm:p-4">
          {/* Mobile: altura fija chica (`h-24`, ~60% menos que el
              `aspect-[4/3]` de ancho completo que tenía antes) — en este
              panel la prioridad es el texto (badge, agenda, botón de
              inscripción), no la foto, así que ocupa lo mínimo arriba de
              todo eso. `sm:aspect-[3/2]`, no `sm:aspect-square`: a partir de
              `sm` sí vuelve a ser una foto real (más angosta que ancha
              completa), y cuadrado en esta columna, ya angosta de por sí
              (peor caso ~40% de una sección `lg`), comía buena parte del
              75svh compartido por gusto — 3:2 la deja más baja, ganando alto
              para el widget de reserva debajo. */}
          <div className="relative h-36 w-full shrink-0 overflow-hidden rounded-2xl bg-stone-800 sm:h-auto sm:aspect-[3/2]">
            <img
              src={ikImage(actividad.imagen, 800)}
              alt={actividad.titulo}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </div>

          <div className="flex flex-col gap-3">
            {/* Sin título acá — ya lo muestra el badge de la izquierda
                ("DÍA 1 — 12 DE NOVIEMBRE"), repetirlo era redundante. */}
            <div className="hidden flex-col gap-2 sm:flex">
              <div className="flex items-start justify-end gap-3">
                <ShareButton
                  url={`${SITE_URL}/actividades/${actividad.id}`}
                  title={actividad.titulo}
                  text={`${fecha}${sede ? ` · ${sede.nombre}, ${sede.isla}` : ''}`}
                  dark
                />
              </div>
              {sede && (
                <p className="text-[11px] text-stone-400" style={labelStyle}>
                  {sede.nombre} · {sede.isla}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-[10px] tracking-widest uppercase text-stone-400" style={labelStyle}>Fecha</span>
                <span className="font-mattone text-sm font-bold text-white capitalize wrap-break-word">{fecha}</span>
              </div>
              {actividad.hora && (
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-[10px] tracking-widest uppercase text-stone-400" style={labelStyle}>Hora</span>
                  <span className="font-mattone text-sm font-bold text-white">{actividad.hora}</span>
                </div>
              )}
            </div>

            {/* Sin popup de confirmación aparte: `inscrito` viene de un
                listener de Firestore en tiempo real (ver el comentario en
                useActividadBooking), así que apenas la inscripción se
                confirma, BookingWidget pasa solo a su propia vista de "ya
                inscrito" (ticket verde + ✓) — el fade+scale de acá abajo
                (keyed en `inscrito`) es lo único que marca el cambio, en
                vez de un modal que haya que cerrar aparte. */}
            <AnimatePresence mode="wait">
              <motion.div
                key={booking.inscrito ? 'inscrito' : 'form'}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
              >
                <BookingWidget {...widgetProps} compact dark />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
