import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation } from 'react-router-dom'
import { getPlazasEstado, type Actividad } from '../../data/actividades'
import { labelStyle } from '../../lib/styles'
import { formatFechaDiaMes, formatFechaDiaMesAnio } from '../../utils/formatMes'
import { AnimatedCheckmark } from './AnimatedCheckmark'
import { getLocaleFromPathname } from '../../i18n/routing'
import { DEFAULT_LOCALE } from '../../i18n/config'


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
  // Inscripción hecha pero sin correo de confirmación (ver
  // lib/correoConfirmacion.ts): se avisa en vez de prometer un correo.
  correoNoEnviado?: boolean
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
  aceptoTerminos: boolean
  setAceptoTerminos: (v: boolean) => void
  onConfirmarInscripcion: () => void
  onCancelarTelefono: () => void
  // Se volvió del login lanzado desde "Inscribirme" (useActividadBooking):
  // el formulario ya viene abierto y esto muestra el aviso encima.
  avisoSesionIniciada?: boolean
  compact?: boolean
  // El fondo negro de la card desplegada (ActividadExpandido/
  // AmbosDiasExpandido) — desacoplado de `compact` a propósito: la vista
  // fromPerfil de ActividadPage.tsx también usa `compact` pero vive en un
  // modal claro, no en la card rediseñada.
  dark?: boolean
}

export function BookingWidget({
  actividad, fecha, pct,
  inscrito, esPasada, esCancelada, noAbierto, isLoggedIn,
  inscribiendo, inscripcionError,
  correoNoEnviado = false,
  confirmando, setConfirmando,
  liberando, onLiberar, onRequestLogin,
  mostrandoTelefono, setMostrandoTelefono,
  telefono, onTelefonoChange, telefonoError,
  aceptoTerminos, setAceptoTerminos,
  onConfirmarInscripcion, onCancelarTelefono,
  avisoSesionIniciada = false,
  compact = false,
  dark = false,
}: BookingWidgetProps) {
  // Con el prefijo del idioma actual: desde /en, "Ver mis actividades"
  // llevaba al perfil en español.
  const { t } = useTranslation()
  const locale = getLocaleFromPathname(useLocation().pathname)
  const perfilPath = locale === DEFAULT_LOCALE ? '/perfil' : `/${locale}/perfil`
  const privacidadPath = locale === DEFAULT_LOCALE ? '/privacidad' : `/${locale}/privacidad`
  // En modo compact, cada texto de acá abajo pierde su inline Open Sans (ver
  // los `style={textFont}` más abajo) y hereda Mattone Regular del wrapper
  // que lo envuelve — eso deja el modo no-compact (la página completa)
  // exactamente como estaba, ya que ahí `textFont` sigue siendo `labelStyle`.
  const textFont = compact ? undefined : labelStyle

  // Aviso de "falta aceptar la política": el botón de confirmar ya no se
  // deshabilita sin el checkbox (un botón gris no explica por qué no
  // funciona) — se deja clickear, y si falta la aceptación se resalta el
  // recuadro en rojo con un mensaje en vez de inscribir.
  const [avisoTerminos, setAvisoTerminos] = useState(false)
  const faltaAceptar = avisoTerminos && !aceptoTerminos

  if (esCancelada) {
    return (
      <div
        className={`rounded-2xl border flex flex-col gap-2 ${compact ? 'p-5 font-mattone font-normal' : 'p-6 shadow-sm'} ${dark ? 'border-red-900/50 bg-red-950/30' : 'border-red-200 bg-red-50'}`}
        style={textFont}
      >
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-red-400 shrink-0">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
          <span className="text-[10px] tracking-widest uppercase text-red-400">{t('reserva.cancelado')}</span>
        </div>
        <p className={`text-sm ${dark ? 'text-stone-300' : 'text-stone-500'}`}>{t('reserva.canceladoTexto')}</p>
      </div>
    )
  }

  const plazasEstado = getPlazasEstado(actividad)

  // En dark, el estado de plazas se muestra como una pastilla rellena (rojo
  // teja, o gris cuando está agotada) en vez de una línea de texto plana —
  // mismo lenguaje visual que el badge de día a la izquierda de la card.
  const plazasBar = dark ? (
    <div className="flex flex-col gap-2">
      <span
        className={`inline-flex self-start rounded-full px-3 py-1 text-[11px] font-bold tracking-wide text-white uppercase ${plazasEstado === 'agotada' ? 'bg-stone-700' : 'bg-brand-red'}`}
      >
        {t(`reserva.plazas.${plazasEstado}`)}
      </span>
      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div className="h-full rounded-full bg-brand-red transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  ) : (
    <div>
      <div className="text-[11px] text-stone-500 mb-2" style={textFont}>
        <span>{t(`reserva.plazas.${plazasEstado}`)}</span>
      </div>
      <div className="h-1.5 rounded-full bg-stone-100 overflow-hidden">
        <div className="h-full rounded-full bg-stone-400 transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )

  const avisoCorreo = (oscuro: boolean) => correoNoEnviado && (
    <p role="status" className={`rounded-xl px-3 py-2 text-[12px] leading-relaxed ${oscuro ? 'bg-amber-400/15 text-amber-200' : 'bg-amber-50 text-amber-900 border border-amber-200'}`} style={textFont}>
      {t('reserva.correoNoEnviado')}
    </p>
  )

  if (inscrito && !esPasada) {
    if (compact && dark) {
      const fechaCorta = formatFechaDiaMes(actividad.fecha)
      return (
        <div className="flex flex-col gap-4 font-mattone font-normal">
          <span
            className="inline-flex w-fit items-center gap-2 rounded-full py-1.5 pr-3 pl-1.5 text-[11px] font-bold tracking-wide text-white uppercase"
            style={{ backgroundColor: '#50664d' }}
          >
            <AnimatedCheckmark size={18} />
            <span>{t('reserva.confirmada')}</span>
          </span>

          <div className="flex flex-col gap-1.5">
            <h3 className="text-lg leading-snug font-bold text-white">{t('reserva.nosVemos', { fecha: fechaCorta })}</h3>
            {correoNoEnviado ? avisoCorreo(true) : (
              <p className="text-[13px] leading-relaxed text-stone-400">
                {t('reserva.correoEnviado')}
              </p>
            )}
          </div>

          {confirmando ? (
            <div className="flex flex-col gap-2">
              <p className="text-[11px] text-stone-400 text-center">{t('reserva.liberarPregunta')}</p>
              <div className="flex gap-2">
                <button
                  onClick={onLiberar}
                  disabled={liberando}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-[11px] tracking-widest uppercase hover:bg-red-600 transition-colors disabled:opacity-40 cursor-pointer"
                >
                  {liberando ? '...' : t('reserva.siLiberar')}
                </button>
                <button
                  onClick={() => setConfirmando(false)}
                  disabled={liberando}
                  className="flex-1 py-2.5 rounded-xl bg-white/10 text-white text-[11px] tracking-widest uppercase hover:bg-white/15 transition-colors disabled:opacity-40 cursor-pointer"
                >
                  {t('reserva.mantener')}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              <Link
                to={perfilPath}
                className="w-full py-3 rounded-xl bg-brand-orange text-white text-[11px] tracking-widest uppercase text-center block transition-opacity hover:opacity-90"
              >
                {t('reserva.verPerfil')}
              </Link>
              <button
                onClick={() => setConfirmando(true)}
                className="w-full py-2.5 rounded-xl border-[1.5px] border-brand-red text-white text-[11px] tracking-widest uppercase hover:bg-brand-red/10 transition-colors cursor-pointer"
              >
                {t('reserva.liberarPlaza')}
              </button>
            </div>
          )}
        </div>
      )
    }

    if (compact) {
      // Padding/gaps más chicos que el resto del modo compact a propósito:
      // esta rama (ya inscrito) apila header + barra de plazas + 2 botones
      // en 3 bloques separados por su propio padding — con los valores
      // "normales" de compact (px-5/py-4/gap-3) medía más alto que la rama
      // de formulario (un solo bloque) y era la que en la práctica seguía
      // pidiendo scroll dentro de ActividadExpandido incluso con el resto
      // ya ajustado.
      return (
        <div className="flex flex-col gap-1.5 font-mattone font-normal">
          <div className="rounded-2xl overflow-hidden border border-stone-200">
            <div className="px-4 py-1.5 flex items-center justify-center gap-2" style={{ backgroundColor: '#50664d' }}>
              <AnimatedCheckmark size={16} />
              <span className="text-[10px] tracking-widest uppercase text-white/80">{t('reserva.confirmada')}</span>
            </div>
            <div className="px-4 pt-2 pb-1.5">{plazasBar}</div>
            {confirmando ? (
              <div className="px-4 py-2 border-t border-stone-100 flex flex-col gap-1.5">
                <p className="text-[11px] text-stone-500 text-center">{t('reserva.liberarPregunta')}</p>
                <div className="flex gap-2">
                  <button
                    onClick={onLiberar}
                    disabled={liberando}
                    className="flex-1 py-2 rounded-xl bg-red-500 text-white text-[11px] tracking-widest uppercase hover:bg-red-600 transition-colors disabled:opacity-40 cursor-pointer"
                  >
                    {liberando ? '...' : t('reserva.siLiberar')}
                  </button>
                  <button
                    onClick={() => setConfirmando(false)}
                    disabled={liberando}
                    className="flex-1 py-2 rounded-xl bg-stone-900 text-white text-[11px] tracking-widest uppercase hover:bg-stone-700 transition-colors disabled:opacity-40 cursor-pointer"
                  >
                    {t('reserva.mantener')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="px-4 py-2 border-t border-stone-100 flex flex-col gap-1.5">
                <button
                  disabled
                  className="w-full py-1.5 rounded-xl text-white text-[11px] tracking-widest uppercase cursor-not-allowed opacity-90"
                  style={{ backgroundColor: '#50664d' }}
                >
                  {t('reserva.yaInscrito')}
                </button>
                <button
                  onClick={() => setConfirmando(true)}
                  className="w-full py-1.5 rounded-xl bg-red-50 text-red-500 text-[10px] tracking-widest uppercase border border-red-200 hover:bg-red-100 transition-colors cursor-pointer"
                >
                  {t('reserva.liberarPlaza')}
                </button>
              </div>
            )}
          </div>
          {avisoCorreo(false)}
          <p className="text-[10px] text-stone-400 text-center">{t('reserva.gratuita')}</p>
        </div>
      )
    }

    // Ticket completo (vista principal)
    return (
      <div className="flex flex-col gap-3">
        {avisoCorreo(false)}
        <div className="rounded-2xl overflow-hidden border border-stone-200 shadow-sm">
          <div className="px-6 py-5 flex flex-col gap-3" style={{ backgroundColor: '#50664d' }}>
            <div className="flex items-center gap-2">
              <AnimatedCheckmark size={22} />
              <span className="text-[10px] tracking-widest uppercase text-white/80" style={textFont}>
                {t('reserva.confirmada')}
              </span>
            </div>
            <p className="text-white text-sm leading-snug" style={textFont}>{actividad.titulo}</p>
          </div>
          <div className="px-6 py-4 border-t border-dashed border-stone-200 flex flex-col gap-0.5">
            <span className="text-[10px] tracking-widest uppercase text-stone-400" style={textFont}>{t('reserva.fecha')}</span>
            <span className="text-sm text-stone-800 capitalize" style={textFont}>{fecha}</span>
            {(actividad.hora || actividad.duracion) && (
              <span className="text-[11px] text-stone-400" style={textFont}>
                {[actividad.hora, actividad.duracion].filter(Boolean).join(' · ')}
              </span>
            )}
          </div>
          {actividad.puntoEncuentro && (
            <div className="px-6 py-4 border-t border-dashed border-stone-200 flex flex-col gap-0.5">
              <span className="text-[10px] tracking-widest uppercase text-stone-400" style={textFont}>{t('reserva.puntoEncuentro')}</span>
              <span className="text-sm text-stone-800 leading-snug" style={textFont}>{actividad.puntoEncuentro}</span>
            </div>
          )}
          {actividad.organizador && (
            <div className="px-6 py-4 border-t border-dashed border-stone-200 flex flex-col gap-0.5">
              <span className="text-[10px] tracking-widest uppercase text-stone-400" style={textFont}>{t('reserva.organizador')}</span>
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
          to={perfilPath}
          className="w-full py-3.5 rounded-xl text-[11px] tracking-widest uppercase text-white text-center block transition-opacity hover:opacity-90"
          style={{ ...labelStyle, backgroundColor: '#3f6395' }}
        >
          {t('reserva.verActividades')}
        </Link>

        {confirmando ? (
          <div className="flex flex-col gap-2">
            <p className="text-[11px] text-stone-500 text-center" style={textFont}>{t('reserva.liberarPregunta')}</p>
            <div className="flex gap-2">
              <button
                onClick={onLiberar}
                disabled={liberando}
                className="flex-1 py-3 rounded-xl bg-red-500 text-white text-[11px] tracking-widest uppercase hover:bg-red-600 transition-colors disabled:opacity-40 cursor-pointer"
                style={textFont}
              >
                {liberando ? '...' : t('reserva.siLiberar')}
              </button>
              <button
                onClick={() => setConfirmando(false)}
                disabled={liberando}
                className="flex-1 py-3 rounded-xl bg-stone-900 text-white text-[11px] tracking-widest uppercase hover:bg-stone-700 transition-colors disabled:opacity-40 cursor-pointer"
                style={textFont}
              >
                {t('reserva.mantener')}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setConfirmando(true)}
            className="w-full py-2.5 rounded-xl bg-red-50 text-red-500 text-[10px] tracking-widest uppercase border border-red-200 hover:bg-red-100 transition-colors cursor-pointer"
            style={textFont}
          >
            {t('reserva.liberarPlaza')}
          </button>
        )}
      </div>
    )
  }

  // Formulario de inscripción
  return (
    <div className={dark ? 'flex flex-col gap-4 font-mattone font-normal' : `rounded-2xl border border-stone-200 flex flex-col ${compact ? 'p-5 gap-4 font-mattone font-normal' : 'p-7 gap-5 shadow-sm'}`}>
      {plazasBar}

      {!compact && (
        <div>
          <p className="text-[10px] tracking-widest uppercase text-stone-400 mb-3" style={textFont}>
            {t('reserva.detalles')}
          </p>
          <div className="grid grid-cols-2 gap-y-4 gap-x-4">
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-[10px] tracking-widest uppercase text-stone-400" style={textFont}>{t('reserva.fecha')}</span>
              <span className="text-sm text-stone-800 capitalize wrap-break-word" style={textFont}>{fecha}</span>
            </div>
            {actividad.hora && (
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-[10px] tracking-widest uppercase text-stone-400" style={textFont}>{t('reserva.hora')}</span>
                <span className="text-sm text-stone-800" style={textFont}>{actividad.hora}</span>
              </div>
            )}
            {actividad.duracion && (
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-[10px] tracking-widest uppercase text-stone-400" style={textFont}>{t('reserva.duracion')}</span>
                <span className="text-sm text-stone-800" style={textFont}>{actividad.duracion}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {plazasEstado === 'pocas' && (
        <p className={`text-[11px] ${dark ? 'text-red-300' : 'text-red-500'}`} style={textFont}>
          {t('reserva.pocasAviso')}
        </p>
      )}

      {inscripcionError && (
        <p className={`text-[11px] ${dark ? 'text-red-300' : 'text-red-500'}`} style={textFont}>{t(inscripcionError)}</p>
      )}

      {noAbierto && actividad.fechaAperturaInscripciones && (
        <p className={`text-[11px] ${dark ? 'text-stone-400' : 'text-stone-500'}`} style={textFont}>
          {t('reserva.abren', { fecha: formatFechaDiaMesAnio(actividad.fechaAperturaInscripciones) })}
        </p>
      )}

      {mostrandoTelefono ? (
        <div className="flex flex-col gap-2">
          {avisoSesionIniciada && (
            <p role="status" className={`mb-1 flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs ${dark ? 'bg-emerald-500/15 text-emerald-200' : 'bg-emerald-50 text-emerald-800'}`} style={textFont}>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0" aria-hidden>
                <path d="M20 6 9 17l-5-5" />
              </svg>
              {t('reserva.sesionIniciada')}
            </p>
          )}
          <label className={`text-[10px] tracking-widest uppercase ${dark ? 'text-stone-400' : 'text-stone-400'}`} style={textFont}>
            {t('reserva.telefono')}
          </label>
          <input
            type="tel"
            value={telefono}
            onChange={e => onTelefonoChange(e.target.value)}
            placeholder={t('reserva.telefonoPlaceholder')}
            className={`w-full rounded-xl px-3 py-2.5 text-base focus:outline-none transition-colors ${dark ? 'border border-white/15 bg-white/5 text-white placeholder:text-stone-500 focus:border-white/30' : 'border border-stone-200 text-stone-800 focus:border-stone-400'}`}
            style={dark ? { ...textFont, color: '#ffffff', colorScheme: 'dark' } : textFont}
          />
          {telefonoError && (
            <p className={`text-[11px] ${dark ? 'text-red-300' : 'text-red-500'}`} style={textFont}>{t(telefonoError)}</p>
          )}
          {/* Todo el recuadro es el <label>: tocar en cualquier parte marca
              el checkbox, no solo el cuadradito — área táctil cómoda en
              móvil. */}
          <label
            className={`mt-1 flex items-center gap-3 rounded-xl border px-3.5 py-3 text-xs sm:text-[13px] leading-snug cursor-pointer transition-colors ${
              faltaAceptar
                ? (dark ? 'border-red-400 bg-red-500/10 text-red-200' : 'border-red-400 bg-red-50 text-red-700')
                : aceptoTerminos
                  ? (dark ? 'border-white/40 bg-white/10 text-white' : 'border-stone-500 bg-stone-50 text-stone-800')
                  : (dark ? 'border-white/20 text-stone-200 hover:border-white/40' : 'border-stone-300 text-stone-600 hover:border-stone-400')
            }`}
            style={textFont}
          >
            <input
              type="checkbox"
              checked={aceptoTerminos}
              onChange={e => { setAceptoTerminos(e.target.checked); if (e.target.checked) setAvisoTerminos(false) }}
              aria-invalid={faltaAceptar || undefined}
              aria-describedby={faltaAceptar ? `aviso-terminos-${actividad.id}` : undefined}
              className="h-5 w-5 shrink-0 cursor-pointer accent-brand-orange"
            />
            <span>
              {t('reserva.aceptoPre')}{' '}
              <Link to={privacidadPath} target="_blank" rel="noopener noreferrer" className={`underline underline-offset-2 ${dark ? 'hover:text-white' : 'hover:text-stone-900'}`}>
                {t('reserva.politica')}
              </Link>
            </span>
          </label>
          {faltaAceptar && (
            <p id={`aviso-terminos-${actividad.id}`} role="alert" className={`-mt-1 text-[11px] ${dark ? 'text-red-300' : 'text-red-500'}`} style={textFont}>
              {t('reserva.faltaAceptar')}
            </p>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (!aceptoTerminos) { setAvisoTerminos(true); return }
                onConfirmarInscripcion()
              }}
              disabled={inscribiendo}
              className={`flex-1 py-3 rounded-xl text-white text-[11px] tracking-widest uppercase transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${dark ? 'bg-brand-orange hover:opacity-90' : 'bg-stone-900 hover:bg-stone-700'}`}
              style={textFont}
            >
              {inscribiendo ? '...' : t('reserva.confirmar')}
            </button>
            <button
              onClick={() => { setAvisoTerminos(false); onCancelarTelefono() }}
              disabled={inscribiendo}
              className={`flex-1 py-3 rounded-xl text-[11px] tracking-widest uppercase transition-colors disabled:opacity-40 cursor-pointer ${dark ? 'border border-white/15 text-stone-300 hover:bg-white/5' : 'border border-stone-200 text-stone-500 hover:bg-stone-50'}`}
              style={textFont}
            >
              {t('reserva.cancelar')}
            </button>
          </div>
        </div>
      ) : (
        <button
          disabled={actividad.plazasDisponibles === 0 || inscribiendo || esPasada || noAbierto}
          onClick={() => { if (!isLoggedIn) onRequestLogin(); else setMostrandoTelefono(true) }}
          className={`w-full ${compact ? 'py-3' : 'py-3.5'} rounded-xl text-white text-[11px] tracking-widest uppercase transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${dark ? 'bg-brand-orange hover:opacity-90' : 'bg-stone-900 hover:bg-stone-700'}`}
          style={textFont}
        >
          {inscribiendo ? '...' : esPasada ? t('reserva.finalizada') : noAbierto ? t('reserva.noAbiertas') : actividad.plazasDisponibles === 0 ? t('reserva.sinPlazas') : t('reserva.inscribirme')}
        </button>
      )}

      <p className={`text-[10px] text-center ${dark ? 'text-stone-500' : 'text-stone-400'}`} style={textFont}>
        {t('reserva.gratuita')}
      </p>
    </div>
  )
}
