import { Link } from 'react-router-dom'
import { TEMATICA_COLORS } from '../../data/tematicas'
import { DifficultyDots } from './DifficultyDots'
import type { Actividad } from '../../data/actividades'

const labelStyle = { fontFamily: "'Open Sans', sans-serif" }

type BookingWidgetProps = {
  actividad: Actividad
  fecha: string
  pct: number
  inscrito: boolean
  esPasada: boolean
  esCancelada: boolean
  noAbierto: boolean
  isLoggedIn: boolean
  inscribiendo: boolean
  inscripcionError: string
  confirmando: boolean
  setConfirmando: (v: boolean) => void
  liberando: boolean
  onLiberar: () => void
  onRequestLogin: () => void
  mostrandoTelefono: boolean
  setMostrandoTelefono: (v: boolean) => void
  telefono: string
  onTelefonoChange: (v: string) => void
  telefonoError: string
  onConfirmarInscripcion: () => void
  onCancelarTelefono: () => void
  compact?: boolean
}

export function BookingWidget({
  actividad, fecha, pct,
  inscrito, esPasada, esCancelada, noAbierto, isLoggedIn,
  inscribiendo, inscripcionError,
  confirmando, setConfirmando,
  liberando, onLiberar, onRequestLogin,
  mostrandoTelefono, setMostrandoTelefono,
  telefono, onTelefonoChange, telefonoError,
  onConfirmarInscripcion, onCancelarTelefono,
  compact = false,
}: BookingWidgetProps) {
  // En modo compact, cada texto de acá abajo pierde su inline Open Sans (ver
  // los `style={textFont}` más abajo) y hereda Mattone Regular del wrapper
  // que lo envuelve — eso deja el modo no-compact (la página completa)
  // exactamente como estaba, ya que ahí `textFont` sigue siendo `labelStyle`.
  const textFont = compact ? undefined : labelStyle

  if (esCancelada) {
    return (
      <div className={`rounded-2xl border border-red-200 bg-red-50 flex flex-col gap-2 ${compact ? 'p-5 font-mattone font-normal' : 'p-6 shadow-sm'}`} style={textFont}>
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-red-400 shrink-0">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
          <span className="text-[10px] tracking-widest uppercase text-red-400">Evento cancelado</span>
        </div>
        <p className="text-sm text-stone-500">Este evento ha sido cancelado por los organizadores.</p>
      </div>
    )
  }

  const plazasBar = (
    <div>
      <div className="flex justify-between text-[11px] text-stone-500 mb-2" style={textFont}>
        <span>{actividad.plazasDisponibles} plazas disponibles</span>
        <span>{pct}% ocupado</span>
      </div>
      <div className="h-1.5 rounded-full bg-stone-100 overflow-hidden">
        <div className="h-full rounded-full bg-stone-400 transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )

  if (inscrito && !esPasada) {
    if (compact) {
      return (
        <div className="flex flex-col gap-3 font-mattone font-normal">
          <div className="rounded-2xl overflow-hidden border border-stone-200">
            <div className="px-5 py-3 flex items-center justify-center gap-2" style={{ backgroundColor: '#50664d' }}>
              <span className="text-white text-sm leading-none">✓</span>
              <span className="text-[10px] tracking-widest uppercase text-white/80">Inscripción confirmada</span>
            </div>
            <div className="px-5 pt-4 pb-3">{plazasBar}</div>
            {confirmando ? (
              <div className="px-5 py-4 border-t border-stone-100 flex flex-col gap-2">
                <p className="text-[11px] text-stone-500 text-center">¿Liberar tu plaza?</p>
                <div className="flex gap-2">
                  <button
                    onClick={onLiberar}
                    disabled={liberando}
                    className="flex-1 py-3 rounded-xl bg-red-500 text-white text-[11px] tracking-widest uppercase hover:bg-red-600 transition-colors disabled:opacity-40 cursor-pointer"
                  >
                    {liberando ? '...' : 'Sí, liberar'}
                  </button>
                  <button
                    onClick={() => setConfirmando(false)}
                    disabled={liberando}
                    className="flex-1 py-3 rounded-xl bg-stone-900 text-white text-[11px] tracking-widest uppercase hover:bg-stone-700 transition-colors disabled:opacity-40 cursor-pointer"
                  >
                    Mantener
                  </button>
                </div>
              </div>
            ) : (
              <div className="px-5 py-4 border-t border-stone-100 flex flex-col gap-2">
                <button
                  disabled
                  className="w-full py-3 rounded-xl text-white text-[11px] tracking-widest uppercase cursor-not-allowed opacity-90"
                  style={{ backgroundColor: '#50664d' }}
                >
                  Ya inscrito ✓
                </button>
                <button
                  onClick={() => setConfirmando(true)}
                  className="w-full py-2.5 rounded-xl bg-red-50 text-red-500 text-[10px] tracking-widest uppercase border border-red-200 hover:bg-red-100 transition-colors cursor-pointer"
                >
                  Liberar plaza
                </button>
              </div>
            )}
          </div>
          <p className="text-[10px] text-stone-400 text-center">Inscripción gratuita · Se requiere confirmación</p>
        </div>
      )
    }

    // Ticket completo (vista principal)
    return (
      <div className="flex flex-col gap-3">
        <div className="rounded-2xl overflow-hidden border border-stone-200 shadow-sm">
          <div className="px-6 py-5 flex flex-col gap-3" style={{ backgroundColor: '#50664d' }}>
            <div className="flex items-center gap-2">
              <span className="text-white text-base leading-none">✓</span>
              <span className="text-[10px] tracking-widest uppercase text-white/80" style={textFont}>
                Inscripción confirmada
              </span>
            </div>
            <span
              className="w-fit px-2.5 py-0.5 rounded-full text-[9px] tracking-widest uppercase text-white font-bold"
              style={{ backgroundColor: TEMATICA_COLORS[actividad.tematica] }}
            >
              {actividad.tematica}
            </span>
            <p className="text-white text-sm leading-snug" style={textFont}>{actividad.titulo}</p>
          </div>
          <div className="px-6 py-4 border-t border-dashed border-stone-200 flex flex-col gap-0.5">
            <span className="text-[10px] tracking-widest uppercase text-stone-400" style={textFont}>Fecha</span>
            <span className="text-sm text-stone-800 capitalize" style={textFont}>{fecha}</span>
            {(actividad.hora || actividad.duracion) && (
              <span className="text-[11px] text-stone-400" style={textFont}>
                {[actividad.hora, actividad.duracion].filter(Boolean).join(' · ')}
              </span>
            )}
          </div>
          {actividad.puntoEncuentro && (
            <div className="px-6 py-4 border-t border-dashed border-stone-200 flex flex-col gap-0.5">
              <span className="text-[10px] tracking-widest uppercase text-stone-400" style={textFont}>Punto de encuentro</span>
              <span className="text-sm text-stone-800 leading-snug" style={textFont}>{actividad.puntoEncuentro}</span>
            </div>
          )}
          {actividad.organizador && (
            <div className="px-6 py-4 border-t border-dashed border-stone-200 flex flex-col gap-0.5">
              <span className="text-[10px] tracking-widest uppercase text-stone-400" style={textFont}>Organizador</span>
              <span className="text-sm text-stone-800" style={textFont}>{actividad.organizador}</span>
              {actividad.contacto && (
                <a
                  href={`mailto:${actividad.contacto}`}
                  className="text-[11px] text-stone-400 hover:text-stone-600 transition-colors truncate"
                  style={textFont}
                >
                  {actividad.contacto}
                </a>
              )}
            </div>
          )}
        </div>

        <Link
          to="/perfil"
          className="w-full py-3.5 rounded-xl text-[11px] tracking-widest uppercase text-white text-center block transition-opacity hover:opacity-90"
          style={{ ...labelStyle, backgroundColor: '#3f6395' }}
        >
          Ver mis actividades
        </Link>

        {confirmando ? (
          <div className="flex flex-col gap-2">
            <p className="text-[11px] text-stone-500 text-center" style={textFont}>¿Liberar tu plaza?</p>
            <div className="flex gap-2">
              <button
                onClick={onLiberar}
                disabled={liberando}
                className="flex-1 py-3 rounded-xl bg-red-500 text-white text-[11px] tracking-widest uppercase hover:bg-red-600 transition-colors disabled:opacity-40 cursor-pointer"
                style={textFont}
              >
                {liberando ? '...' : 'Sí, liberar'}
              </button>
              <button
                onClick={() => setConfirmando(false)}
                disabled={liberando}
                className="flex-1 py-3 rounded-xl bg-stone-900 text-white text-[11px] tracking-widest uppercase hover:bg-stone-700 transition-colors disabled:opacity-40 cursor-pointer"
                style={textFont}
              >
                Mantener
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setConfirmando(true)}
            className="w-full py-2.5 rounded-xl bg-red-50 text-red-500 text-[10px] tracking-widest uppercase border border-red-200 hover:bg-red-100 transition-colors cursor-pointer"
            style={textFont}
          >
            Liberar plaza
          </button>
        )}
      </div>
    )
  }

  // Formulario de inscripción
  return (
    <div className={`rounded-2xl border border-stone-200 flex flex-col ${compact ? 'p-5 gap-4 font-mattone font-normal' : 'p-7 gap-5 shadow-sm'}`}>
      {plazasBar}

      {!compact && (
        <div>
          <p className="text-[10px] tracking-widest uppercase text-stone-400 mb-3" style={textFont}>
            Detalles de la actividad
          </p>
          <div className="grid grid-cols-2 gap-y-4 gap-x-4">
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-[10px] tracking-widest uppercase text-stone-400" style={textFont}>Fecha</span>
              <span className="text-sm text-stone-800 capitalize wrap-break-word" style={textFont}>{fecha}</span>
            </div>
            {actividad.hora && (
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-[10px] tracking-widest uppercase text-stone-400" style={textFont}>Hora</span>
                <span className="text-sm text-stone-800" style={textFont}>{actividad.hora}</span>
              </div>
            )}
            {actividad.duracion && (
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-[10px] tracking-widest uppercase text-stone-400" style={textFont}>Duración</span>
                <span className="text-sm text-stone-800" style={textFont}>{actividad.duracion}</span>
              </div>
            )}
            <div className="flex flex-col gap-1 min-w-0">
              <span className="text-[10px] tracking-widest uppercase text-stone-400" style={textFont}>Dificultad</span>
              <DifficultyDots dificultad={actividad.dificultad} />
            </div>
          </div>
        </div>
      )}

      {actividad.plazasDisponibles <= 5 && actividad.plazasDisponibles > 0 && (
        <p className="text-[11px] text-red-500" style={textFont}>
          ¡Solo quedan {actividad.plazasDisponibles} plazas!
        </p>
      )}

      {inscripcionError && (
        <p className="text-[11px] text-red-500" style={textFont}>{inscripcionError}</p>
      )}

      {noAbierto && actividad.fechaAperturaInscripciones && (
        <p className="text-[11px] text-stone-500" style={textFont}>
          Las inscripciones abren el {new Date(actividad.fechaAperturaInscripciones + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      )}

      {mostrandoTelefono ? (
        <div className="flex flex-col gap-2">
          <label className="text-[10px] tracking-widest uppercase text-stone-400" style={textFont}>
            Teléfono de contacto
          </label>
          <input
            type="tel"
            value={telefono}
            onChange={e => onTelefonoChange(e.target.value)}
            placeholder="612345678 o +34612345678"
            className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-base text-stone-800 focus:outline-none focus:border-stone-400 transition-colors"
            style={textFont}
          />
          {telefonoError && (
            <p className="text-[11px] text-red-500" style={textFont}>{telefonoError}</p>
          )}
          <div className="flex gap-2">
            <button
              onClick={onConfirmarInscripcion}
              disabled={inscribiendo}
              className="flex-1 py-3 rounded-xl bg-stone-900 text-white text-[11px] tracking-widest uppercase hover:bg-stone-700 transition-colors disabled:opacity-40 cursor-pointer"
              style={textFont}
            >
              {inscribiendo ? '...' : 'Confirmar y continuar'}
            </button>
            <button
              onClick={onCancelarTelefono}
              disabled={inscribiendo}
              className="flex-1 py-3 rounded-xl border border-stone-200 text-stone-500 text-[11px] tracking-widest uppercase hover:bg-stone-50 transition-colors disabled:opacity-40 cursor-pointer"
              style={textFont}
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <button
          disabled={actividad.plazasDisponibles === 0 || inscribiendo || esPasada || noAbierto}
          onClick={() => { if (!isLoggedIn) onRequestLogin(); else setMostrandoTelefono(true) }}
          className={`w-full ${compact ? 'py-3' : 'py-3.5'} rounded-xl bg-stone-900 text-white text-[11px] tracking-widest uppercase hover:bg-stone-700 transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer`}
          style={textFont}
        >
          {inscribiendo ? '...' : esPasada ? 'Actividad finalizada' : noAbierto ? 'Inscripciones aún no abiertas' : actividad.plazasDisponibles === 0 ? 'Sin plazas disponibles' : 'Inscribirme'}
        </button>
      )}

      <p className="text-[10px] text-stone-400 text-center" style={textFont}>
        Inscripción gratuita · Se requiere confirmación
      </p>
    </div>
  )
}
