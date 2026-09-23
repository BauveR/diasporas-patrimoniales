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

const labelStyle = { fontFamily: "'Open Sans', sans-serif" }
const titleStyle = { fontFamily: "'Google Sans Flex', sans-serif", fontVariationSettings: "'wght' 100" }

const today = new Date().toISOString().split('T')[0]

type Tab = 'todas' | 'proximas' | 'pasadas'

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
      {!inactiva && !isCancelada && (
        confirmando ? (
          <div className="flex gap-2 px-1" style={labelStyle}>
            <button
              onClick={handleLiberar}
              disabled={liberando}
              className="text-[10px] tracking-widest uppercase text-red-400 hover:text-red-600 transition-colors disabled:opacity-40 cursor-pointer"
            >
              {liberando ? '...' : 'Sí, liberar'}
            </button>
            <span className="text-stone-200 text-[10px]">·</span>
            <button
              onClick={() => setConfirmando(false)}
              disabled={liberando}
              className="text-[10px] tracking-widest uppercase text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
            >
              Mantener
            </button>
          </div>
        ) : (
          <div className="flex gap-2 px-1" style={labelStyle}>
            <button
              onClick={() => setConfirmando(true)}
              className="w-fit text-[10px] tracking-widest uppercase text-stone-500 hover:text-red-400 transition-colors cursor-pointer"
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
  const { user, signOut, inscripcionIds, inscripcionesLoading } = useAuth()
  const { actividades } = useDataContext()
  const navigate = useNavigate()
  const openActividadId = useOpenActividadId()
  const [tab, setTab] = useState<Tab>('todas')

  const inscritas  = actividades.filter(a => inscripcionIds.includes(a.id))
  const proximas   = inscritas.filter(a => a.fecha >= today && !a.cancelada)
  const pasadas    = inscritas.filter(a => a.fecha < today && !a.cancelada)
  const canceladas = inscritas.filter(a => !!a.cancelada)

  const visible = tab === 'proximas' ? proximas : tab === 'pasadas' ? [...pasadas, ...canceladas] : [...proximas, ...pasadas, ...canceladas]
  // Solo abre inline si el id pertenece a esta lista (y por lo tanto es
  // visible en la pestaña actual) — si viene de otra sección, esto no
  // encuentra nada y la grilla se muestra normal.
  const abierta = visible.find(a => a.id === openActividadId)

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'todas',    label: 'Todas',    count: inscritas.length },
    { key: 'proximas', label: 'Próximas', count: proximas.length  },
    { key: 'pasadas',  label: 'Pasadas',  count: pasadas.length + canceladas.length },
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

      {/* Hero header */}
      <div className="bg-stone-50 border-b border-stone-100 pt-24 pb-10 px-6 sm:px-8 lg:px-10">
        <div className="flex items-center gap-5">

          {/* Avatar */}
          <div className="shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center" style={{ ...titleStyle, backgroundColor: '#b19e7b' }}>
            <span className="text-white text-xl sm:text-2xl">
              {user ? getInitials(user) : '?'}
            </span>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-[10px] tracking-widest uppercase text-stone-400 mb-1">Mi cuenta</p>
            <h1 className="text-xl sm:text-2xl text-stone-900 uppercase tracking-tight truncate" style={titleStyle}>
              {user?.displayName ?? user?.email?.split('@')[0]}
            </h1>
            {!inscripcionesLoading && (
              <div className="flex flex-wrap gap-2 mt-2">
                {proximas.length > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-white text-[10px] tracking-widest uppercase" style={{ backgroundColor: '#50664d' }}>
                    {proximas.length} próxima{proximas.length !== 1 ? 's' : ''}
                  </span>
                )}
                {pasadas.length > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-500 text-[10px] tracking-widest uppercase">
                    {pasadas.length} pasada{pasadas.length !== 1 ? 's' : ''}
                  </span>
                )}
                {canceladas.length > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-400 text-[10px] tracking-widest uppercase">
                    {canceladas.length} cancelada{canceladas.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            )}
          </div>

          <button
            onClick={signOut}
            className="hidden sm:block shrink-0 px-5 py-2 rounded-xl border border-stone-200 text-[11px] tracking-widest uppercase text-stone-500 hover:bg-white transition-colors cursor-pointer"
          >
            Cerrar sesión
          </button>
        </div>

        <button
          onClick={signOut}
          className="sm:hidden mt-5 w-full py-2.5 rounded-xl border border-stone-200 text-[11px] tracking-widest uppercase text-stone-500 hover:bg-white transition-colors cursor-pointer"
        >
          Cerrar sesión
        </button>
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
                  style={tab === t.key ? { backgroundColor: '#595d8d' } : {}}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[11px] tracking-widest uppercase transition-colors cursor-pointer border ${
                    tab === t.key
                      ? 'text-white border-transparent'
                      : 'bg-white text-stone-500 border-stone-200 hover:border-stone-400'
                  }`}
                >
                  {t.label}
                  {t.count > 0 && (
                    <span className={`text-[10px] ${tab === t.key ? 'text-white/60' : 'text-stone-500'}`}>
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
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {visible.map(a => (
                          <GridCardWrapper
                            key={a.id}
                            actividadId={a.id}
                            uid={user!.uid}
                            inactiva={a.fecha < today || !!a.cancelada}
                          />
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
