import { useEffect } from 'react'
import { useParams, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { TEMATICA_COLORS } from '../data/tematicas'
import { DifficultyDots } from '../components/actividades/DifficultyDots'
import { ShareButton } from '../components/actividades/ShareButton'
import { BookingWidget } from '../components/actividades/BookingWidget'
import { useDataContext } from '../contexts/DataContext'
import { useActividadBooking } from '../hooks/useActividadBooking'
import { SITE_URL } from '../components/SeoHead'

const labelStyle = { fontFamily: "'Open Sans', sans-serif" }
const serifStyle = { fontFamily: "'Playfair Display', serif" }

// ── InscripcionSuccessPopup ───────────────────────────────────────────────────

function InscripcionSuccessPopup({ titulo, onClose }: { titulo: string; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] flex items-center justify-center p-6"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
      onClick={onClose}
    >
      <style>{`
        @keyframes chc-circle { to { stroke-dashoffset: 0; } }
        @keyframes chc-check  { to { stroke-dashoffset: 0; } }
        @media (prefers-reduced-motion: reduce) {
          .chc-circle-progress, .chc-check-path { animation: none !important; stroke-dashoffset: 0 !important; }
        }
      `}</style>
      <motion.div
        initial={{ scale: 0.88, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.88, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 22 }}
        className="rounded-3xl max-w-sm w-full flex flex-col items-center gap-6 px-8 py-10"
        style={{ backgroundColor: '#50664d' }}
        onClick={e => e.stopPropagation()}
      >
        <span
          className="text-[10px] tracking-[0.25em] uppercase text-center"
          style={{ ...labelStyle, color: 'rgba(255,255,255,0.55)' }}
        >
          Diásporas Patrimoniales
        </span>

        <svg width="96" height="96" viewBox="0 0 96 96" fill="none">
          <circle cx="48" cy="48" r="44" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />
          <circle
            className="chc-circle-progress"
            cx="48" cy="48" r="44"
            stroke="white" strokeWidth="2" strokeLinecap="round"
            strokeDasharray="277" strokeDashoffset="277"
            transform="rotate(-90 48 48)"
            style={{ animation: 'chc-circle 0.65s ease forwards' }}
          />
          <path
            className="chc-check-path"
            d="M28 48 L42 62 L70 30"
            stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"
            strokeDasharray="65" strokeDashoffset="65"
            style={{ animation: 'chc-check 0.4s ease 0.55s forwards' }}
          />
        </svg>

        <div className="flex flex-col items-center gap-2 text-center">
          <span
            className="text-[10px] tracking-[0.2em] uppercase"
            style={{ ...labelStyle, color: 'rgba(255,255,255,0.65)' }}
          >
            Inscripción confirmada
          </span>
          <p className="text-white text-lg leading-snug" style={serifStyle}>
            {titulo}
          </p>
        </div>

        <button
          onClick={onClose}
          className="mt-1 px-6 py-2.5 rounded-full text-[10px] tracking-widest uppercase cursor-pointer transition-colors hover:bg-white/20"
          style={{ ...labelStyle, backgroundColor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.75)' }}
        >
          Cerrar
        </button>
      </motion.div>
    </motion.div>
  )
}

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
  const fecha = new Date(actividad.fecha + 'T00:00:00').toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
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
    telefono: booking.telefono,
    onTelefonoChange: booking.onTelefonoChange,
    telefonoError: booking.telefonoError,
    onConfirmarInscripcion: booking.handleConfirmarInscripcion,
    onCancelarTelefono: booking.handleCancelarTelefono,
  }

  // ── Vista fromPerfil (modal estrecho) ───────────────────────────────────────
  if (fromPerfil && isModal) {
    return (
      <div className="flex flex-col" style={labelStyle}>
        <div className="px-6 pt-6 pb-4 flex flex-col gap-2">
          <span
            className="w-fit px-2.5 py-0.5 rounded-full text-[9px] tracking-widest uppercase text-white font-bold"
            style={{ backgroundColor: TEMATICA_COLORS[actividad.tematica] }}
          >
            {actividad.tematica}
          </span>
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
          <img src={actividad.imagen} alt={actividad.titulo} className="max-h-[50svh] w-auto object-contain" />
        </div>

        <div className="px-6 py-5 flex flex-col gap-6">
          <BookingWidget {...widgetProps} compact />

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
              <div className="flex flex-col gap-1 min-w-0">
                <span className="text-[10px] tracking-widest uppercase text-stone-400">Dificultad</span>
                <DifficultyDots dificultad={actividad.dificultad} />
              </div>
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
    <>
    <AnimatePresence>
      {booking.showSuccessPopup && (
        <InscripcionSuccessPopup
          titulo={actividad.titulo}
          onClose={() => booking.setShowSuccessPopup(false)}
        />
      )}
    </AnimatePresence>
    <main className={`${isModal ? 'pt-6' : 'pt-16 min-h-screen'} bg-white`}>
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
          <img src={actividad.imagen} alt={actividad.titulo} className="max-h-[70svh] w-auto object-contain" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-12 pb-16">

          {/* Left */}
          <div className="flex flex-col gap-8 min-w-0">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
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
              <h1 className="text-3xl sm:text-4xl font-light text-stone-900 leading-snug" style={serifStyle}>
                {actividad.titulo}
              </h1>
            </div>
            <p className="text-base text-stone-600 leading-relaxed wrap-break-word whitespace-pre-line" style={labelStyle}>
              {actividad.descripcion}
            </p>
          </div>

          {/* Right */}
          <div className={`${!isModal ? 'lg:sticky lg:top-24' : ''} self-start flex flex-col gap-4`}>
            <BookingWidget {...widgetProps} />

            {sede && (
              <div className="rounded-2xl border border-stone-200 p-5 flex flex-col gap-2 shadow-sm" style={labelStyle}>
                <div className="flex items-center gap-2 mb-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-stone-400 shrink-0">
                    <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
                  </svg>
                  <span className="text-[10px] tracking-widest uppercase text-stone-400">Ubicación</span>
                </div>
                <p className="text-sm text-stone-800">{sede.nombre}</p>
                <p className="text-[11px] text-stone-400">{sede.municipio}, {sede.isla}</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </main>
    </>
  )
}
