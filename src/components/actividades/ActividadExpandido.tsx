import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion } from 'framer-motion'
import { TEMATICA_COLORS } from '../../data/tematicas'
import { PROGRAMA_DIA_1, PROGRAMA_DIA_2 } from '../../data/programa'
import { ProgramaTimeline } from '../ProgramaTimeline'
import { ShareButton } from './ShareButton'
import { BookingWidget } from './BookingWidget'
import { useDataContext } from '../../contexts/DataContext'
import { useActividadBooking } from '../../hooks/useActividadBooking'
import { SITE_URL } from '../SeoHead'
import type { Actividad } from '../../data/actividades'

const labelStyle = { fontFamily: "'Open Sans', sans-serif" }

function CerrarButton({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      onClick={onClose}
      aria-label="Cerrar"
      className="absolute top-4 right-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-stone-500 shadow-sm transition-colors hover:bg-white cursor-pointer"
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
export function ActividadExpandido({ actividad, onClose }: { actividad: Actividad; onClose: () => void }) {
  const { t } = useTranslation()
  const { sedes } = useDataContext()
  const booking = useActividadBooking(actividad)
  const sede = sedes.find(s => s.id === actividad.sedeId)

  const today = new Date().toISOString().slice(0, 10)
  const esPasada = actividad.fecha < today
  const esCancelada = !!actividad.cancelada
  const noAbierto = !!actividad.fechaAperturaInscripciones && actividad.fechaAperturaInscripciones > today
  const fecha = new Date(actividad.fecha + 'T00:00:00').toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
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
    telefono: booking.telefono,
    onTelefonoChange: booking.onTelefonoChange,
    telefonoError: booking.telefonoError,
    onConfirmarInscripcion: booking.handleConfirmarInscripcion,
    onCancelarTelefono: booking.handleCancelarTelefono,
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="relative w-full overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-xl sm:max-h-[75svh]"
    >
      <CerrarButton onClose={onClose} />
      {/* 60/40 — programa del día a la izquierda, imagen + inscripción a la
          derecha. Cada columna scrollea por su cuenta (`overflow-y-auto`)
          dentro del `max-h` del panel en vez de estirar la sección entera
          cuando el día tiene muchos paneles. */}
      <div className="grid grid-cols-1 sm:h-full sm:grid-cols-[6fr_4fr]">
        <div className="order-2 overflow-y-auto p-6 sm:order-1 sm:p-8">
          <div className="mb-4 flex items-start justify-between gap-3 sm:hidden">
            <span
              className="w-fit px-3 py-1 text-white font-bold text-[10px] tracking-widest uppercase rounded-full"
              style={{ ...labelStyle, backgroundColor: TEMATICA_COLORS[actividad.tematica] }}
            >
              {actividad.tematica}
            </span>
          </div>
          {programaDia ? (
            <ProgramaTimeline dia={diaLabel} items={programaDia} />
          ) : (
            <p className="text-sm text-stone-600 leading-relaxed wrap-break-word whitespace-pre-line" style={labelStyle}>
              {actividad.descripcion}
            </p>
          )}
        </div>

        <div className="order-1 flex flex-col gap-5 overflow-y-auto p-4 sm:order-2 sm:border-l sm:border-stone-100 sm:p-6">
          <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-2xl bg-stone-50 sm:aspect-square">
            <img
              src={actividad.imagen}
              alt={actividad.titulo}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </div>

          <div className="flex flex-col gap-5">
            {/* Sin título acá — ya lo muestra el propio encabezado del
                timeline a la izquierda ("DÍA 1 — 12 DE NOVIEMBRE"),
                repetirlo era redundante. */}
            <div className="hidden flex-col gap-2 sm:flex">
              <div className="flex items-start justify-between gap-3">
                <span
                  className="w-fit px-3 py-1 text-white font-bold text-[10px] tracking-widest uppercase rounded-full"
                  style={{ ...labelStyle, backgroundColor: TEMATICA_COLORS[actividad.tematica] }}
                >
                  {actividad.tematica}
                </span>
                <ShareButton
                  url={`${SITE_URL}/actividades/${actividad.id}`}
                  title={actividad.titulo}
                  text={`${fecha}${sede ? ` · ${sede.nombre}, ${sede.isla}` : ''}`}
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
                <span className="font-mattone text-sm font-bold text-stone-800 capitalize wrap-break-word">{fecha}</span>
              </div>
              {actividad.hora && (
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-[10px] tracking-widest uppercase text-stone-400" style={labelStyle}>Hora</span>
                  <span className="font-mattone text-sm font-bold text-stone-800">{actividad.hora}</span>
                </div>
              )}
            </div>

            <BookingWidget {...widgetProps} compact />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {booking.showSuccessPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 flex items-center justify-center rounded-3xl bg-black/40 p-6"
            onClick={() => booking.setShowSuccessPopup(false)}
          >
            <div
              className="rounded-2xl bg-white px-8 py-6 text-center shadow-xl"
              onClick={e => e.stopPropagation()}
            >
              <p className="text-sm font-semibold text-stone-800" style={labelStyle}>Inscripción confirmada ✓</p>
              <button
                onClick={() => booking.setShowSuccessPopup(false)}
                className="mt-3 text-[10px] tracking-widest uppercase text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
                style={labelStyle}
              >
                Cerrar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
