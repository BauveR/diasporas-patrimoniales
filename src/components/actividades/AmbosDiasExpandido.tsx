import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { PROGRAMA_DIA_1, PROGRAMA_DIA_2 } from '../../data/programa'
import { ProgramaTimeline } from '../ProgramaTimeline'
import { BookingWidget } from './BookingWidget'
import { CerrarButton } from './ActividadExpandido'
import { useDataContext } from '../../contexts/DataContext'
import { useAmbosDiasBooking } from '../../hooks/useAmbosDiasBooking'
import type { Actividad } from '../../data/actividades'
import { labelStyle } from '../../lib/styles'
import { formatFechaLarga } from '../../utils/formatMes'

// Mismo mapeo hardcodeado que ActividadExpandido.tsx (id 1/2 → jornada).
function getProgramaDia(actividadId: number) {
  if (actividadId === 1) return PROGRAMA_DIA_1
  if (actividadId === 2) return PROGRAMA_DIA_2
  return null
}

// Panel de la card combinada "Ambos días" — mismo "acomodo" que
// ActividadExpandido (grid 60/40: agenda a la izquierda, imagen +
// inscripción a la derecha), mostrando el programa compacto de LAS DOS
// jornadas apiladas en la columna izquierda en vez de una sola. La columna
// izquierda scrollea por su cuenta si las dos agendas juntas no entran en
// el `max-h` del panel — a diferencia de una sola jornada, acá no se buscó
// evitar el scroll a toda costa (son 2 días completos).
export function AmbosDiasExpandido({ dia1, dia2, onClose, bare = false }: { dia1: Actividad; dia2: Actividad; onClose: () => void; bare?: boolean }) {
  const { t } = useTranslation()
  const { sedes } = useDataContext()
  const sede = sedes.find(s => s.id === dia1.sedeId)
  const booking = useAmbosDiasBooking([dia1, dia2])

  const today = new Date().toISOString().slice(0, 10)
  const esPasada = dia1.fecha < today || dia2.fecha < today
  const esCancelada = !!dia1.cancelada || !!dia2.cancelada
  const noAbierto =
    (!!dia1.fechaAperturaInscripciones && dia1.fechaAperturaInscripciones > today) ||
    (!!dia2.fechaAperturaInscripciones && dia2.fechaAperturaInscripciones > today)

  const fmt = formatFechaLarga

  const combinedActividad: Actividad = {
    ...dia1,
    id: -1,
    titulo: t('inscripcion.ambosDias'),
    plazas: dia1.plazas,
    plazasDisponibles: Math.min(dia1.plazasDisponibles, dia2.plazasDisponibles),
    cancelada: esCancelada,
  }
  const plazasOcupadas = combinedActividad.plazas - combinedActividad.plazasDisponibles
  const pct = combinedActividad.plazas > 0 ? Math.round((plazasOcupadas / combinedActividad.plazas) * 100) : 0

  const widgetProps = {
    actividad: combinedActividad, fecha: fmt(dia1.fecha), pct,
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
    aceptoTerminos: booking.aceptoTerminos,
    setAceptoTerminos: booking.setAceptoTerminos,
    onConfirmarInscripcion: booking.handleConfirmarInscripcion,
    onCancelarTelefono: booking.handleCancelarTelefono,
  }

  const dias = [dia1, dia2]

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
      <div className="grid grid-cols-1 sm:max-h-[75svh] sm:grid-rows-1 sm:grid-cols-[6fr_4fr]">
        <div className="order-2 overflow-y-auto p-6 sm:order-1 sm:p-8">
          {dias.map((dia, i) => {
            const programaDia = getProgramaDia(dia.id)
            const diaLabel = dia.id === 2 ? t('programa.dia2') : t('programa.dia1')
            const fecha = fmt(dia.fecha)
            return (
              <div key={dia.id} className={i > 0 ? 'mt-8' : undefined}>
                <div className="mb-6 flex flex-col gap-1.5">
                  <span className="w-fit rounded-lg bg-brand-red px-4 py-2 font-mattone text-sm font-bold tracking-wide text-white uppercase">
                    {dia.titulo}
                  </span>
                  <span className="text-xs text-stone-400 capitalize" style={labelStyle}>
                    {fecha}{dia.hora ? ` · ${dia.hora}` : ''}{dia.duracion ? ` · ${dia.duracion}` : ''}
                  </span>
                </div>
                {programaDia ? (
                  <ProgramaTimeline dia={diaLabel} items={programaDia} dense dark />
                ) : (
                  <p className="text-sm text-stone-300 leading-relaxed wrap-break-word whitespace-pre-line" style={labelStyle}>
                    {dia.descripcion}
                  </p>
                )}
              </div>
            )
          })}
        </div>

        <div className="order-1 flex flex-col gap-3 overflow-y-auto p-4 sm:order-2 sm:border-l sm:border-white/10 sm:p-4">
          {/* Mobile: altura fija chica (`h-24`) en vez del `aspect-[4/3]` a
              ancho completo — mismo criterio que ActividadExpandido, la
              prioridad acá es el texto/agenda, no la foto. */}
          <div className="relative h-36 w-full shrink-0 overflow-hidden rounded-2xl bg-stone-800 sm:h-auto sm:aspect-[3/2]">
            <img
              src={dia1.imagen}
              alt={t('inscripcion.ambosDias')}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </div>

          <div className="flex flex-col gap-3">
            {sede && (
              <p className="hidden text-[11px] text-stone-400 sm:block" style={labelStyle}>
                {sede.nombre} · {sede.isla}
              </p>
            )}

            {booking.inscritoParcial ? (
              <p className="text-[13px] text-stone-400" style={labelStyle}>
                {t('inscripcion.yaInscritoParcial', {
                  jornada: t(booking.diasInscritos.includes(dia1.id) ? 'inscripcion.jornada1' : 'inscripcion.jornada2'),
                })}
              </p>
            ) : (
              <BookingWidget {...widgetProps} compact dark />
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
