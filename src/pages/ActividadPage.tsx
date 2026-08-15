import { useState, useEffect } from 'react'
import { useParams, Navigate, useNavigate, useLocation, Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { TEMATICA_COLORS } from '../data/tematicas'
import { DifficultyDots } from '../components/actividades/DifficultyDots'
import { ShareButton } from '../components/actividades/ShareButton'
import { useAuth } from '../contexts/AuthContext'
import { useDataContext } from '../contexts/DataContext'
import { inscribirse, liberarPlaza, getTelefonoForUser, SinPlazasError, YaLiberadaError, EventoCanceladoError, InscripcionNoAbiertaError } from '../lib/db'
import { isValidTelefono } from '../utils/validators'
import type { Actividad } from '../data/actividades'

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
          Sedes Históricas de Canarias
        </span>

        <svg width="96" height="96" viewBox="0 0 96 96" fill="none">
          <circle cx="48" cy="48" r="44" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />
          <circle
            cx="48" cy="48" r="44"
            stroke="white" strokeWidth="2" strokeLinecap="round"
            strokeDasharray="277" strokeDashoffset="277"
            transform="rotate(-90 48 48)"
            style={{ animation: 'chc-circle 0.65s ease forwards' }}
          />
          <path
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

// ── BookingWidget ─────────────────────────────────────────────────────────────

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

  if (esCancelada) {
    return (
      <div className={`rounded-2xl border border-red-200 bg-red-50 flex flex-col gap-2 ${compact ? 'p-5' : 'p-6 shadow-sm'}`} style={labelStyle}>
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
      <div className="flex justify-between text-[11px] text-stone-500 mb-2" style={labelStyle}>
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
        <div className="flex flex-col gap-3">
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
              <span className="text-[10px] tracking-widest uppercase text-white/80" style={labelStyle}>
                Inscripción confirmada
              </span>
            </div>
            <span
              className="w-fit px-2.5 py-0.5 rounded-full text-[9px] tracking-widest uppercase text-white font-bold"
              style={{ backgroundColor: TEMATICA_COLORS[actividad.tematica] }}
            >
              {actividad.tematica}
            </span>
            <p className="text-white text-sm leading-snug" style={labelStyle}>{actividad.titulo}</p>
          </div>
          <div className="px-6 py-4 border-t border-dashed border-stone-200 flex flex-col gap-0.5">
            <span className="text-[10px] tracking-widest uppercase text-stone-400" style={labelStyle}>Fecha</span>
            <span className="text-sm text-stone-800 capitalize" style={labelStyle}>{fecha}</span>
            {(actividad.hora || actividad.duracion) && (
              <span className="text-[11px] text-stone-400" style={labelStyle}>
                {[actividad.hora, actividad.duracion].filter(Boolean).join(' · ')}
              </span>
            )}
          </div>
          {actividad.puntoEncuentro && (
            <div className="px-6 py-4 border-t border-dashed border-stone-200 flex flex-col gap-0.5">
              <span className="text-[10px] tracking-widest uppercase text-stone-400" style={labelStyle}>Punto de encuentro</span>
              <span className="text-sm text-stone-800 leading-snug" style={labelStyle}>{actividad.puntoEncuentro}</span>
            </div>
          )}
          {actividad.organizador && (
            <div className="px-6 py-4 border-t border-dashed border-stone-200 flex flex-col gap-0.5">
              <span className="text-[10px] tracking-widest uppercase text-stone-400" style={labelStyle}>Organizador</span>
              <span className="text-sm text-stone-800" style={labelStyle}>{actividad.organizador}</span>
              {actividad.contacto && (
                <a
                  href={`mailto:${actividad.contacto}`}
                  className="text-[11px] text-stone-400 hover:text-stone-600 transition-colors truncate"
                  style={labelStyle}
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
            <p className="text-[11px] text-stone-500 text-center" style={labelStyle}>¿Liberar tu plaza?</p>
            <div className="flex gap-2">
              <button
                onClick={onLiberar}
                disabled={liberando}
                className="flex-1 py-3 rounded-xl bg-red-500 text-white text-[11px] tracking-widest uppercase hover:bg-red-600 transition-colors disabled:opacity-40 cursor-pointer"
                style={labelStyle}
              >
                {liberando ? '...' : 'Sí, liberar'}
              </button>
              <button
                onClick={() => setConfirmando(false)}
                disabled={liberando}
                className="flex-1 py-3 rounded-xl bg-stone-900 text-white text-[11px] tracking-widest uppercase hover:bg-stone-700 transition-colors disabled:opacity-40 cursor-pointer"
                style={labelStyle}
              >
                Mantener
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setConfirmando(true)}
            className="w-full py-2.5 rounded-xl bg-red-50 text-red-500 text-[10px] tracking-widest uppercase border border-red-200 hover:bg-red-100 transition-colors cursor-pointer"
            style={labelStyle}
          >
            Liberar plaza
          </button>
        )}
      </div>
    )
  }

  // Formulario de inscripción
  return (
    <div className={`rounded-2xl border border-stone-200 flex flex-col ${compact ? 'p-5 gap-4' : 'p-7 gap-5 shadow-sm'}`}>
      {plazasBar}

      {!compact && (
        <div>
          <p className="text-[10px] tracking-widest uppercase text-stone-400 mb-3" style={labelStyle}>
            Detalles de la actividad
          </p>
          <div className="grid grid-cols-2 gap-y-4 gap-x-4">
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-[10px] tracking-widest uppercase text-stone-400" style={labelStyle}>Fecha</span>
              <span className="text-sm text-stone-800 capitalize wrap-break-word" style={labelStyle}>{fecha}</span>
            </div>
            {actividad.hora && (
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-[10px] tracking-widest uppercase text-stone-400" style={labelStyle}>Hora</span>
                <span className="text-sm text-stone-800" style={labelStyle}>{actividad.hora}</span>
              </div>
            )}
            {actividad.duracion && (
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-[10px] tracking-widest uppercase text-stone-400" style={labelStyle}>Duración</span>
                <span className="text-sm text-stone-800" style={labelStyle}>{actividad.duracion}</span>
              </div>
            )}
            <div className="flex flex-col gap-1 min-w-0">
              <span className="text-[10px] tracking-widest uppercase text-stone-400" style={labelStyle}>Dificultad</span>
              <DifficultyDots dificultad={actividad.dificultad} />
            </div>
          </div>
        </div>
      )}

      {actividad.plazasDisponibles <= 5 && actividad.plazasDisponibles > 0 && (
        <p className="text-[11px] text-red-500" style={labelStyle}>
          ¡Solo quedan {actividad.plazasDisponibles} plazas!
        </p>
      )}

      {inscripcionError && (
        <p className="text-[11px] text-red-500" style={labelStyle}>{inscripcionError}</p>
      )}

      {noAbierto && actividad.fechaAperturaInscripciones && (
        <p className="text-[11px] text-stone-500" style={labelStyle}>
          Las inscripciones abren el {new Date(actividad.fechaAperturaInscripciones + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      )}

      {mostrandoTelefono ? (
        <div className="flex flex-col gap-2">
          <label className="text-[10px] tracking-widest uppercase text-stone-400" style={labelStyle}>
            Teléfono de contacto
          </label>
          <input
            type="tel"
            value={telefono}
            onChange={e => onTelefonoChange(e.target.value)}
            placeholder="612345678 o +34612345678"
            className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-stone-800 focus:outline-none focus:border-stone-400 transition-colors"
            style={labelStyle}
          />
          {telefonoError && (
            <p className="text-[11px] text-red-500" style={labelStyle}>{telefonoError}</p>
          )}
          <div className="flex gap-2">
            <button
              onClick={onConfirmarInscripcion}
              disabled={inscribiendo}
              className="flex-1 py-3 rounded-xl bg-stone-900 text-white text-[11px] tracking-widest uppercase hover:bg-stone-700 transition-colors disabled:opacity-40 cursor-pointer"
              style={labelStyle}
            >
              {inscribiendo ? '...' : 'Confirmar y continuar'}
            </button>
            <button
              onClick={onCancelarTelefono}
              disabled={inscribiendo}
              className="flex-1 py-3 rounded-xl border border-stone-200 text-stone-500 text-[11px] tracking-widest uppercase hover:bg-stone-50 transition-colors disabled:opacity-40 cursor-pointer"
              style={labelStyle}
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
          style={labelStyle}
        >
          {inscribiendo ? '...' : esPasada ? 'Actividad finalizada' : noAbierto ? 'Inscripciones aún no abiertas' : actividad.plazasDisponibles === 0 ? 'Sin plazas disponibles' : 'Inscribirme'}
        </button>
      )}

      <p className="text-[10px] text-stone-400 text-center" style={labelStyle}>
        Inscripción gratuita · Se requiere confirmación
      </p>
    </div>
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
  const { user, inscripcionIds } = useAuth()
  const { actividades, sedes, dataLoading } = useDataContext()
  const actividad = actividades.find(a => a.id === Number(id))

  useEffect(() => {
    if (!actividad) return
    const prevTitle = document.title
    document.title = `${actividad.titulo} · Sedes Históricas de Canarias`
    return () => { document.title = prevTitle }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actividad?.titulo])

  const inscrito = !!actividad && inscripcionIds.includes(actividad.id)
  const [inscribiendo, setInscribiendo] = useState(false)
  const [inscripcionError, setInscripcionError] = useState('')
  const [confirmando, setConfirmando] = useState(false)
  const [liberando, setLiberando] = useState(false)
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const [mostrandoTelefono, setMostrandoTelefono] = useState(false)
  const [telefono, setTelefono] = useState('')
  const [telefonoError, setTelefonoError] = useState('')

  // Precarga el teléfono guardado en el perfil (si existe) para no pedirlo de cero cada vez.
  // getTelefonoForUser is a synchronous in-memory lookup (the real Firestore
  // read it replaces was async), so the setState is deferred a tick — keeps
  // it out of the synchronous render/effect cycle rather than settling
  // immediately, same as the original network read would.
  useEffect(() => {
    if (!user) return
    const uid = user.uid
    Promise.resolve().then(() => {
      const guardado = getTelefonoForUser(uid)
      if (guardado) setTelefono(guardado)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid])

  const today = new Date().toISOString().split('T')[0]
  const esPasada    = actividad ? actividad.fecha < today : false
  const esCancelada = !!actividad?.cancelada
  const noAbierto   = !!actividad?.fechaAperturaInscripciones && actividad.fechaAperturaInscripciones > today

  const handleLiberar = async () => {
    if (!user || !actividad) return
    setLiberando(true)
    try {
      await liberarPlaza(actividad.id, user.uid)
      setConfirmando(false)
    } catch (err) {
      if (!(err instanceof YaLiberadaError)) throw err
    } finally {
      setLiberando(false)
    }
  }

  const handleRequestLogin = () => {
    navigate('/login', { state: { background: location } })
  }

  const handleCancelarTelefono = () => {
    setMostrandoTelefono(false)
    setTelefonoError('')
  }

  const handleConfirmarInscripcion = async () => {
    if (!user || !actividad) return
    if (!isValidTelefono(telefono)) {
      setTelefonoError('Introduce un teléfono válido (España o formato internacional +XX...)')
      return
    }
    setInscribiendo(true)
    setInscripcionError('')
    setTelefonoError('')
    try {
      await inscribirse(actividad.id, user.uid, user.email ?? '', user.displayName ?? '', telefono)
      setMostrandoTelefono(false)
      setShowSuccessPopup(true)
      // Fire-and-forget: enviar email de confirmación
      user.getIdToken().then(idToken => {
        const sede = sedes.find(c => c.id === actividad.sedeId)
        const fechaStr = new Date(actividad.fecha + 'T00:00:00').toLocaleDateString('es-ES', {
          weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
        })
        fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            idToken,
            email: user.email ?? '',
            nombre: user.displayName ?? 'participante',
            titulo: actividad.titulo,
            fecha: fechaStr,
            hora: actividad.hora,
            duracion: actividad.duracion,
            puntoEncuentro: actividad.puntoEncuentro,
            organizador: actividad.organizador,
            contacto: actividad.contacto,
            sedeNombre: sede?.nombre,
            sedeIsla: sede?.isla,
          }),
        }).catch(() => { /* silencioso — inscripción ya completada */ })
      }).catch(() => { /* silencioso */ })
    } catch (err) {
      if (err instanceof SinPlazasError) {
        setInscripcionError('Ya no quedan plazas disponibles.')
      } else if (err instanceof EventoCanceladoError) {
        setInscripcionError('Este evento ha sido cancelado.')
      } else if (err instanceof InscripcionNoAbiertaError) {
        setInscripcionError('Las inscripciones todavía no están abiertas para esta actividad.')
      } else {
        setInscripcionError('Error al procesar la inscripción. Inténtalo de nuevo.')
      }
    } finally {
      setInscribiendo(false)
    }
  }

  if (dataLoading) return null
  if (!actividad) return <Navigate to="/" replace />

  const sede = sedes.find(c => c.id === actividad.sedeId)
  const fecha = new Date(actividad.fecha + 'T00:00:00').toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
  const plazasOcupadas = actividad.plazas - actividad.plazasDisponibles
  const pct = Math.round((plazasOcupadas / actividad.plazas) * 100)

  const widgetProps = {
    actividad, fecha, pct,
    inscrito, esPasada, esCancelada, noAbierto,
    isLoggedIn: !!user,
    inscribiendo, inscripcionError,
    confirmando, setConfirmando,
    liberando,
    onLiberar: handleLiberar,
    onRequestLogin: handleRequestLogin,
    mostrandoTelefono, setMostrandoTelefono,
    telefono,
    onTelefonoChange: (v: string) => { setTelefono(v); setTelefonoError('') },
    telefonoError,
    onConfirmarInscripcion: handleConfirmarInscripcion,
    onCancelarTelefono: handleCancelarTelefono,
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

        <div className="relative overflow-hidden aspect-3/2">
          <img src={actividad.imagen} alt={actividad.titulo} className="w-full h-full object-cover" />
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
      {showSuccessPopup && (
        <InscripcionSuccessPopup
          titulo={actividad.titulo}
          onClose={() => setShowSuccessPopup(false)}
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

        <div className="relative overflow-hidden rounded-2xl aspect-16/7 mb-10">
          <img src={actividad.imagen} alt={actividad.titulo} className="w-full h-full object-cover" />
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
                  url={`https://sedeshistoricosdecanarias.com/actividades/${actividad.id}`}
                  title={actividad.titulo}
                  text={`${fecha}${sede ? ` · ${sede.nombre}, ${sede.isla}` : ''}`}
                />
              </div>
              <h1 className="text-3xl sm:text-4xl font-light text-stone-900 leading-snug" style={serifStyle}>
                {actividad.titulo}
              </h1>
            </div>
            <p className="text-base text-stone-600 leading-relaxed wrap-break-word" style={labelStyle}>
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
