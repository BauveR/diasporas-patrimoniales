import { useEffect } from 'react'
import { useParams, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ShareButton } from '../components/actividades/ShareButton'
import { BookingWidget } from '../components/actividades/BookingWidget'
import { useDataContext } from '../contexts/DataContext'
import { googleMapsUrl } from '../data/sedes'
import { useActividadBooking } from '../hooks/useActividadBooking'
import { SITE_URL } from '../components/SeoHead'
import { labelStyle } from '../lib/styles'
import { formatFechaLarga } from '../utils/formatMes'
import { ikImage } from '../lib/imagekit'

const serifStyle = { fontFamily: "'Playfair Display', serif" }

// ── ActividadPage ─────────────────────────────────────────────────────────────

export function ActividadPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const fromApp = location.key !== 'default'
  const isModal = !!location.state?.background
  const fromPerfil = location.state?.from === 'perfil'
  const { actividades, sedes, dataLoading } = useDataContext()
  const actividad = actividades.find(a => a.id === Number(id))
  const booking = useActividadBooking(actividad)

  useEffect(() => {
    if (!actividad) return
    const prevTitle = document.title
    document.title = `${actividad.titulo} · Diásporas Patrimoniales`
    return () => { document.title = prevTitle }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actividad?.titulo])

  if (dataLoading) return null
  if (!actividad) return <Navigate to="/" replace />

  const today = new Date().toISOString().split('T')[0]
  const esPasada    = actividad.fecha < today
  const esCancelada = !!actividad.cancelada
  const noAbierto   = !!actividad.fechaAperturaInscripciones && actividad.fechaAperturaInscripciones > today

  const sede = sedes.find(c => c.id === actividad.sedeId)
  const fecha = formatFechaLarga(actividad.fecha)
  const plazasOcupadas = actividad.plazas - actividad.plazasDisponibles
  const pct = Math.round((plazasOcupadas / actividad.plazas) * 100)

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

  // ── Vista fromPerfil (modal estrecho) ───────────────────────────────────────
  if (fromPerfil && isModal) {
    return (
      <div className="flex flex-col" style={labelStyle}>
        <div className="px-6 pt-6 pb-4 flex flex-col gap-2">
          <h1 className="text-xl font-light text-stone-900 leading-snug" style={serifStyle}>
            {actividad.titulo}
          </h1>
          {sede && (
            <p className="text-[11px] text-stone-400">
              {sede.nombre} · {sede.isla}
            </p>
          )}
        </div>

        <div className="flex justify-center overflow-hidden bg-stone-50">
          <img src={ikImage(actividad.imagen, 1080)} alt={actividad.titulo} className="max-h-[50svh] w-auto object-contain" />
        </div>

        <div className="px-6 py-5 flex flex-col gap-6">
          {/* Sin popup de confirmación aparte: `booking.inscrito` viene de un
              listener de Firestore en tiempo real (ver useActividadBooking),
              así que BookingWidget pasa solo a su vista de "ya inscrito"
              (ticket verde + palomita animada) apenas se confirma — este
              fade+scale (keyed en `inscrito`) es lo único que marca el
              cambio. */}
          <AnimatePresence mode="wait">
            <motion.div
              key={booking.inscrito ? 'inscrito' : 'form'}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <BookingWidget {...widgetProps} compact />
            </motion.div>
          </AnimatePresence>

          <div>
            <p className="text-[10px] tracking-widest uppercase text-stone-400 mb-4">Detalles de la actividad</p>
            <div className="grid grid-cols-2 gap-y-5">
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-[10px] tracking-widest uppercase text-stone-400">Fecha</span>
                <span className="text-sm text-stone-800 capitalize wrap-break-word">{fecha}</span>
              </div>
              {actividad.hora && (
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-[10px] tracking-widest uppercase text-stone-400">Hora</span>
                  <span className="text-sm text-stone-800">{actividad.hora}</span>
                </div>
              )}
              {actividad.duracion && (
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-[10px] tracking-widest uppercase text-stone-400">Duración</span>
                  <span className="text-sm text-stone-800">{actividad.duracion}</span>
                </div>
              )}
            </div>
            {actividad.puntoEncuentro && (
              <div className="flex flex-col gap-0.5 mt-5">
                <span className="text-[10px] tracking-widest uppercase text-stone-400">Punto de encuentro</span>
                <span className="text-sm text-stone-800 leading-snug">{actividad.puntoEncuentro}</span>
              </div>
            )}
            {actividad.organizador && (
              <div className="flex flex-col gap-0.5 mt-5">
                <span className="text-[10px] tracking-widest uppercase text-stone-400">Organizador</span>
                <span className="text-sm text-stone-800">{actividad.organizador}</span>
                {actividad.contacto && (
                  <a
                    href={`mailto:${actividad.contacto}`}
                    className="text-[11px] text-stone-400 hover:text-stone-600 transition-colors"
                  >
                    {actividad.contacto}
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── Vista principal ──────────────────────────────────────────────────────────
  return (
    <main className={`${isModal ? 'pt-6' : 'pt-navbar min-h-screen'} bg-white`}>
      <div className="max-w-5xl mx-auto px-6 sm:px-8">

        {!isModal && (
          <div className="py-5">
            <button
              onClick={() => fromApp ? navigate(-1) : navigate('/')}
              className="inline-flex items-center gap-1.5 text-[11px] tracking-widest uppercase text-stone-400 hover:text-stone-700 transition-colors"
              style={labelStyle}
            >
              ← Volver
            </button>
          </div>
        )}

        <div className="mb-10 flex justify-center overflow-hidden rounded-2xl bg-stone-50">
          <img src={ikImage(actividad.imagen, 1080)} alt={actividad.titulo} className="max-h-[70svh] w-auto object-contain" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-12 pb-16">

          {/* Left */}
          <div className="flex flex-col gap-8 min-w-0">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-end gap-3">
                <ShareButton
                  url={`${SITE_URL}/actividades/${actividad.id}`}
                  title={actividad.titulo}
                  text={`${fecha}${sede ? ` · ${sede.nombre}, ${sede.isla}` : ''}`}
                />
              </div>
              <h1 className="text-3xl sm:text-4xl font-light text-stone-900 leading-snug" style={serifStyle}>
                {actividad.titulo}
              </h1>
            </div>
            <p className="text-base text-stone-600 leading-relaxed wrap-break-word whitespace-pre-line" style={labelStyle}>
              {actividad.descripcion}
            </p>
          </div>

          {/* Right */}
          <div className={`${!isModal ? 'lg:sticky lg:top-[calc(var(--spacing-navbar)+2rem)]' : ''} self-start flex flex-col gap-4`}>
            <AnimatePresence mode="wait">
              <motion.div
                key={booking.inscrito ? 'inscrito' : 'form'}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
              >
                <BookingWidget {...widgetProps} />
              </motion.div>
            </AnimatePresence>

            {sede && (
              <a
                href={googleMapsUrl(sede)}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-2xl border border-stone-200 p-5 flex flex-col gap-2 shadow-sm transition-colors hover:border-stone-300 hover:bg-stone-50"
                style={labelStyle}
              >
                <div className="flex items-center gap-2 mb-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-stone-400 shrink-0">
                    <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
                  </svg>
                  <span className="text-[10px] tracking-widest uppercase text-stone-400">Ubicación</span>
                </div>
                <p className="text-sm text-stone-800">{sede.nombre}</p>
                <p className="text-[11px] text-stone-400">{sede.municipio}, {sede.isla}</p>
                <p className="text-[10px] tracking-widest uppercase text-stone-400 underline underline-offset-2 mt-1">
                  Ver en Google Maps
                </p>
              </a>
            )}
          </div>

        </div>
      </div>
    </main>
  )
}
