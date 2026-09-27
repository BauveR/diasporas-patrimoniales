import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import type { AppUser } from '../lib/auth'
import { useAuth } from '../contexts/AuthContext'
import { useDataContext } from '../contexts/DataContext'
import { useOpenActividadId } from '../contexts/ActividadInlineContext'
import { liberarPlaza, YaLiberadaError } from '../lib/db'
import { ActividadCard } from '../components/actividades/ActividadCard'
import { ActividadExpandido } from '../components/actividades/ActividadExpandido'
import { ProfileCardCompact } from '../components/profile/ProfileCardCompact'
import { labelStyle } from '../lib/styles'

const today = new Date().toISOString().split('T')[0]

type Tab = 'todas' | 'proximas'

function getInitials(user: AppUser): string {
  if (user.displayName) {
    return user.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }
  return (user.email?.[0] ?? '?').toUpperCase()
}

type GridCardProps = {
  actividadId: number
  uid: string
  inactiva: boolean
}

function GridCardWrapper({ actividadId, uid, inactiva }: GridCardProps) {
  const { actividades } = useDataContext()
  const actividad = actividades.find(a => a.id === actividadId)
  const [confirmando, setConfirmando] = useState(false)
  const [liberando, setLiberando] = useState(false)

  if (!actividad) return null

  const handleLiberar = async () => {
    setLiberando(true)
    try {
      await liberarPlaza(actividadId, uid)
    } catch (err) {
      if (!(err instanceof YaLiberadaError)) throw err
    } finally {
      setLiberando(false)
      setConfirmando(false)
    }
  }

  const isCancelada = !!actividad.cancelada

  return (
    <div className="flex flex-col gap-2">
      <ActividadCard actividad={actividad} inactiva={inactiva || isCancelada} from="perfil" />
      {isCancelada && (
        <p className="text-[10px] tracking-widest uppercase text-red-400 px-1" style={labelStyle}>
          Evento cancelado
        </p>
      )}
      {/* Botones tipo pill, negro (bg-stone-900) en vez de texto plano — mismo
          lenguaje visual que los de BookingWidget en la card desplegada
          (ActividadExpandido), adaptado a fondo negro porque acá el fondo de
          la página es blanco, no oscuro como ahí. Sin `style={labelStyle}`:
          un inline style siempre gana por encima de una clase, así que
          pisaría el `font-mattone` de abajo (mismo motivo documentado en
          ParticipanteTextos). */}
      {!inactiva && !isCancelada && (
        confirmando ? (
          <div className="flex flex-col gap-1.5 px-1">
            <p className="text-center font-mattone text-xs font-bold text-stone-500">¿Liberar tu plaza?</p>
            <div className="flex gap-2">
              <button
                onClick={handleLiberar}
                disabled={liberando}
                className="flex-1 rounded-xl bg-red-500 py-2 font-mattone text-xs font-bold tracking-widest text-white uppercase transition-colors hover:bg-red-600 disabled:opacity-40 cursor-pointer"
              >
                {liberando ? '...' : 'Sí, liberar'}
              </button>
              <button
                onClick={() => setConfirmando(false)}
                disabled={liberando}
                className="flex-1 rounded-xl bg-stone-900 py-2 font-mattone text-xs font-bold tracking-widest text-white uppercase transition-colors hover:bg-stone-700 disabled:opacity-40 cursor-pointer"
              >
                Mantener
              </button>
            </div>
          </div>
        ) : (
          <div className="px-1">
            <button
              onClick={() => setConfirmando(true)}
              className="w-full rounded-xl bg-stone-900 py-2 font-mattone text-xs font-bold tracking-widest text-white uppercase transition-colors hover:bg-stone-700 cursor-pointer"
            >
              Liberar plaza
            </button>
          </div>
        )
      )}
    </div>
  )
}

export function ProfilePage() {
  const { user, inscripcionIds, inscripcionesLoading } = useAuth()
  const { actividades } = useDataContext()
  const navigate = useNavigate()
  const openActividadId = useOpenActividadId()
  const [tab, setTab] = useState<Tab>('todas')

  const inscritas  = actividades.filter(a => inscripcionIds.includes(a.id))
  const proximas   = inscritas.filter(a => a.fecha >= today && !a.cancelada)
  const pasadas    = inscritas.filter(a => a.fecha < today && !a.cancelada)
  const canceladas = inscritas.filter(a => !!a.cancelada)

  const visible = tab === 'proximas' ? proximas : [...proximas, ...pasadas, ...canceladas]
  // Solo abre inline si el id pertenece a esta lista (y por lo tanto es
  // visible en la pestaña actual) — si viene de otra sección, esto no
  // encuentra nada y la grilla se muestra normal.
  const abierta = visible.find(a => a.id === openActividadId)

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'todas',    label: 'Todas',    count: inscritas.length },
    { key: 'proximas', label: 'Próximas', count: proximas.length  },
  ]

  const makeLiberar = (actividadId: number) => async () => {
    if (!user) return
    try {
      await liberarPlaza(actividadId, user.uid)
    } catch (err) {
      if (!(err instanceof YaLiberadaError)) return
    }
  }

  return (
    <main className="min-h-screen bg-white" style={labelStyle}>

      {/* Hero header — fondo negro, texto blanco, avatar/etiqueta/nombre en
          Mattone Bold (antes Google Sans Flex vía `titleStyle`, ya no se usa
          en este archivo). */}
      <div className="bg-black border-b border-white/10 pt-[calc(var(--spacing-navbar)+2rem)] pb-10 px-6 sm:px-8 lg:px-10">
        <div className="flex items-center gap-5">

          {/* Avatar */}
          <div className="shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: '#b19e7b' }}>
            <span className="font-mattone font-bold text-white text-xl sm:text-2xl">
              {user ? getInitials(user) : '?'}
            </span>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="font-mattone font-bold text-[10px] tracking-widest uppercase text-white/50 mb-1">Mi cuenta</p>
            <h1 className="font-mattone font-bold text-xl sm:text-2xl text-white uppercase tracking-tight truncate">
              {user?.displayName ?? user?.email?.split('@')[0]}
            </h1>
            {!inscripcionesLoading && (
              <div className="flex flex-wrap gap-2 mt-2">
                {proximas.length > 0 && (
                  <span className="px-3 py-1 rounded-full text-white font-mattone text-xs font-bold tracking-widest uppercase" style={{ backgroundColor: '#50664d' }}>
                    {proximas.length} próxima{proximas.length !== 1 ? 's' : ''}
                  </span>
                )}
                {pasadas.length > 0 && (
                  <span className="px-3 py-1 rounded-full bg-white/10 text-white/70 font-mattone text-xs font-bold tracking-widest uppercase">
                    {pasadas.length} pasada{pasadas.length !== 1 ? 's' : ''}
                  </span>
                )}
                {canceladas.length > 0 && (
                  <span className="px-3 py-1 rounded-full bg-red-500/15 text-red-300 font-mattone text-xs font-bold tracking-widest uppercase">
                    {canceladas.length} cancelada{canceladas.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 sm:px-8 lg:px-10 py-8">

        {inscripcionesLoading ? (
          <div className="py-20 flex items-center justify-center">
            <p className="text-sm text-stone-500 tracking-widest uppercase">Cargando...</p>
          </div>

        ) : inscritas.length === 0 ? (
          <div className="flex flex-col items-center gap-5 py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-stone-300">
                <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
              </svg>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-[10px] tracking-widest uppercase text-stone-400">Sin actividades</p>
              <p className="text-sm text-stone-400 max-w-xs">Aún no te has inscrito en ninguna actividad</p>
            </div>
            <Link
              to="/#sedes"
              className="mt-2 px-6 py-2.5 rounded-xl bg-stone-900 text-white text-[11px] tracking-widest uppercase hover:bg-stone-700 transition-colors"
            >
              Explorar actividades
            </Link>
          </div>

        ) : (
          <>
            {/* Tabs */}
            <div className="flex gap-2 mb-8 flex-wrap">
              {tabs.map(t => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex items-center gap-1.5 px-5 py-2 rounded-full font-mattone text-xs font-bold tracking-widest uppercase transition-colors cursor-pointer border ${
                    tab === t.key
                      ? 'bg-brand-red text-white border-transparent'
                      : 'bg-white text-stone-500 border-stone-200 hover:border-stone-400'
                  }`}
                >
                  {t.label}
                  {t.count > 0 && (
                    <span className={`text-xs ${tab === t.key ? 'text-white/60' : 'text-stone-500'}`}>
                      {t.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {visible.length === 0 ? (
              <p className="text-sm text-stone-400 py-12 text-center">
                No hay actividades en esta sección
              </p>
            ) : (
              <>
                {/* Mobile: lista compacta */}
                <div className="flex flex-col divide-y divide-stone-100 sm:hidden">
                  {visible.map(a => (
                    <div key={a.id} className="py-4 first:pt-0 last:pb-0">
                      <ProfileCardCompact
                        actividad={a}
                        inactiva={a.fecha < today}
                        onLiberar={a.fecha >= today && !a.cancelada ? makeLiberar(a.id) : undefined}
                      />
                    </div>
                  ))}
                </div>

                {/* Tablet / Desktop: grid — con una actividad abierta, el
                    panel horizontal (ActividadExpandido) reemplaza la
                    grilla en vez de superponerse, igual criterio que
                    InscripcionSection. */}
                <div className="hidden sm:block">
                  <AnimatePresence mode="wait">
                    {abierta ? (
                      <ActividadExpandido
                        key={abierta.id}
                        actividad={abierta}
                        onClose={() => navigate(-1)}
                      />
                    ) : (
                      // flex-wrap + justify-center, no grid: con grid-cols
                      // fijas (1fr), una última fila incompleta (ej. 1 o 2
                      // tarjetas en la fila de 3) queda pegada a la
                      // izquierda — las columnas 1fr ocupan todo el ancho,
                      // así que justify-content no tiene ningún espacio
                      // sobrante para repartir. Con ancho fijo por tarjeta
                      // (via flex-basis) en vez de columnas elásticas, el
                      // espacio sobrante de una fila incompleta sí existe y
                      // justify-center lo reparte de verdad.
                      <div className="flex flex-wrap justify-center gap-6">
                        {visible.map(a => (
                          <div key={a.id} className="w-full sm:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)]">
                            <GridCardWrapper
                              actividadId={a.id}
                              uid={user!.uid}
                              inactiva={a.fecha < today || !!a.cancelada}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </main>
  )
}
