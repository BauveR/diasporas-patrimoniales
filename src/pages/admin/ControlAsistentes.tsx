import { useState, useEffect, useMemo } from 'react'
import type { Actividad } from '../../data/actividades'
import type { Sede } from '../../data/sedes'
import { getInscritos, liberarPlaza, YaLiberadaError, type InscritoData } from '../../lib/db'
import { labelStyle } from '../../lib/styles'
import { downloadCsv, toTsv } from '../../utils/csv'
import { formatMes } from '../../utils/formatMes'
import { SectionCard, Select } from './fields'
import { EditActividadDrawer } from './EditActividadDrawer'
import { ActivityCard } from './ActivityCard'

export function ControlAsistentes({ actividades, sedes }: { actividades: Actividad[]; sedes: Sede[] }) {
  const today    = new Date().toISOString().slice(0, 10)
  const proximas = actividades.filter(a => a.fecha >= today && !a.cancelada).sort((a, b) => a.fecha.localeCompare(b.fecha))
  const pasadas  = actividades.filter(a => a.fecha <  today || !!a.cancelada).sort((a, b) => b.fecha.localeCompare(a.fecha))

  const [showPasadas,      setShowPasadas]      = useState(false)
  const [selectedId,       setSelectedId]       = useState<number | null>(null)
  const [editingId,        setEditingId]        = useState<number | null>(null)
  const [inscritos,        setInscritos]        = useState<InscritoData[]>([])
  const [loadingInscritos, setLoadingInscritos] = useState(false)
  const [fetchError,       setFetchError]       = useState<string | null>(null)
  const [fetchedAt,        setFetchedAt]        = useState<{ id: number; count: number } | null>(null)
  const [query,            setQuery]            = useState('')
  const [mesFiltro,        setMesFiltro]        = useState('')
  const [copiado,          setCopiado]          = useState(false)
  // Quitar a un inscrito: primero se pide confirmación en su fila
  // (confirmandoUid), luego liberarPlaza() — la misma transacción que usa
  // el propio usuario al cancelar, así el inscrito y el contador de plazas
  // cambian juntos. Las reglas dejan al admin borrar el inscrito de otro.
  const [confirmandoUid,   setConfirmandoUid]   = useState<string | null>(null)
  const [quitandoUid,      setQuitandoUid]      = useState<string | null>(null)
  const [quitarError,      setQuitarError]      = useState<string | null>(null)

  const mesesDisponibles = useMemo(() => {
    const set = new Set(actividades.map(a => a.fecha.slice(0, 7)))
    return Array.from(set).sort()
  }, [actividades])

  const matchesFiltro = (a: Actividad) => {
    if (mesFiltro && !a.fecha.startsWith(mesFiltro)) return false
    if (!query.trim()) return true
    const q = query.trim().toLowerCase()
    const sede = sedes.find(c => c.id === a.sedeId)
    return a.titulo.toLowerCase().includes(q)
      || (sede?.nombre.toLowerCase().includes(q) ?? false)
      || (sede?.isla.toLowerCase().includes(q) ?? false)
  }

  const visible            = (showPasadas ? pasadas : proximas).filter(matchesFiltro)
  const selectedActividad  = actividades.find(a => a.id === selectedId)
  const editingActividad   = actividades.find(a => a.id === editingId)
  const selectedCount      = selectedActividad
    ? selectedActividad.plazas - selectedActividad.plazasDisponibles
    : 0
  const selectedFecha      = selectedActividad
    ? new Date(selectedActividad.fecha + 'T00:00:00').toLocaleDateString('es-ES', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : ''

  const fetchInscritos = async (id: number, count: number) => {
    setLoadingInscritos(true)
    setFetchError(null)
    try {
      const data = await getInscritos(id)
      setInscritos(data)
      setFetchedAt({ id, count })
    } catch {
      setFetchError('Error al cargar inscritos. Inténtalo de nuevo.')
    } finally {
      setLoadingInscritos(false)
    }
  }

  useEffect(() => {
    if (!selectedId) return
    if (fetchedAt?.id === selectedId && fetchedAt?.count === selectedCount) return
    const id = selectedId
    const count = selectedCount
    // Deferred a tick so the fetch (and its immediate setLoadingInscritos)
    // runs outside the effect's own synchronous call stack.
    queueMicrotask(() => { fetchInscritos(id, count) })
  }, [selectedId, selectedCount])

  const handleQuitar = async (uid: string) => {
    if (!selectedId) return
    setQuitandoUid(uid)
    setQuitarError(null)
    try {
      await liberarPlaza(selectedId, uid)
    } catch (err) {
      // Ya no estaba (lo canceló el propio usuario mientras tanto): mismo
      // resultado final, se quita de la lista igual.
      if (!(err instanceof YaLiberadaError)) {
        setQuitarError('No se pudo quitar al inscrito. Inténtalo de nuevo.')
        setQuitandoUid(null)
        return
      }
    }
    setInscritos(prev => prev.filter(i => i.uid !== uid))
    setConfirmandoUid(null)
    setQuitandoUid(null)
  }

  const handleSelect = (id: number) => {
    setConfirmandoUid(null)
    setQuitarError(null)
    setEditingId(null)
    setSelectedId(prev => prev === id ? null : id)
  }

  const handleEdit = (id: number) => {
    setSelectedId(null)
    setEditingId(prev => prev === id ? null : id)
  }

  const inscritosRows = (): string[][] => [
    ['Nombre', 'Email', 'Teléfono', 'Inscrito el', 'Acepta política de privacidad', 'Versión aceptada'],
    ...inscritos.map(i => [
      i.displayName || '',
      i.email,
      i.telefono || '',
      i.inscritoEn ? i.inscritoEn.toLocaleDateString('es-ES') : '',
      i.aceptoTerminos ? 'Sí' : 'No',
      i.terminosVersion || '',
    ]),
  ]

  const handleDescargarCsv = () => {
    if (!selectedActividad) return
    const slug = selectedActividad.titulo.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    downloadCsv(`inscritos-${slug}.csv`, inscritosRows())
  }

  const handleCopiar = async () => {
    try {
      await navigator.clipboard.writeText(toTsv(inscritosRows()))
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch { /* clipboard no disponible */ }
  }

  const tabs = [
    { label: `Próximas (${proximas.length})`, active: !showPasadas, onClick: () => setShowPasadas(false) },
    { label: `Pasadas (${pasadas.length})`,   active: showPasadas,  onClick: () => setShowPasadas(true)  },
  ]

  return (
    <div className="flex flex-col gap-6">

      <EditActividadDrawer
        actividad={editingActividad ?? null}
        sedes={sedes}
        onClose={() => setEditingId(null)}
      />

      {/* Panel de inscritos */}
      {selectedActividad && (
        <div className="bg-stone-900 rounded-2xl border border-white/10 p-6" style={labelStyle}>
          <div className="flex items-start justify-between mb-5 gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] tracking-widest uppercase text-stone-400 mb-1">Inscritos</p>
              <p className="text-sm text-white truncate">{selectedActividad.titulo}</p>
              <p className="text-[11px] text-stone-400 mt-0.5 capitalize">
                {selectedFecha} · {selectedCount} {selectedCount === 1 ? 'inscrito' : 'inscritos'}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {inscritos.length > 0 && (
                <>
                  <button
                    onClick={handleCopiar}
                    className="px-3 py-1.5 rounded-full border border-white/15 text-[10px] tracking-widest uppercase text-stone-300 hover:border-white/30 hover:text-white transition-colors cursor-pointer whitespace-nowrap"
                  >
                    {copiado ? 'Copiado ✓' : 'Copiar'}
                  </button>
                  <button
                    onClick={handleDescargarCsv}
                    className="px-3 py-1.5 rounded-full border border-white/15 text-[10px] tracking-widest uppercase text-stone-300 hover:border-white/30 hover:text-white transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Descargar CSV
                  </button>
                </>
              )}
              <button
                onClick={() => setSelectedId(null)}
                className="shrink-0 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
                aria-label="Cerrar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {loadingInscritos ? (
            <p className="text-[11px] text-stone-400 py-2">Cargando...</p>
          ) : fetchError ? (
            <p className="text-[11px] text-red-400 py-2">{fetchError}</p>
          ) : inscritos.length === 0 ? (
            <p className="text-[11px] text-stone-500 py-2">Sin inscritos aún</p>
          ) : (
            <div className="overflow-x-auto">
              {quitarError && <p className="text-[11px] text-red-400 pb-2">{quitarError}</p>}
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[10px] tracking-widest uppercase text-stone-400 border-b border-white/10">
                    <th className="font-normal py-2 pr-4">Nombre</th>
                    <th className="font-normal py-2 pr-4">Email</th>
                    <th className="font-normal py-2 pr-4">Teléfono</th>
                    <th className="font-normal py-2 pr-4">Política de privacidad</th>
                    <th className="font-normal py-2"><span className="sr-only">Acciones</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {inscritos.map(i => (
                    <tr key={i.uid}>
                      <td className="py-2.5 pr-4 text-sm text-stone-200 whitespace-nowrap">{i.displayName || '—'}</td>
                      <td className="py-2.5 pr-4 text-[11px] text-stone-400 whitespace-nowrap">{i.email}</td>
                      <td className="py-2.5 pr-4 text-[11px] text-stone-400 whitespace-nowrap">{i.telefono || '—'}</td>
                      <td className="py-2.5 pr-4 text-[11px] whitespace-nowrap">
                        {i.aceptoTerminos ? (
                          <span className="text-[#7a9a74]">✓ Aceptada{i.terminosVersion ? ` (${i.terminosVersion})` : ''}</span>
                        ) : (
                          <span className="text-stone-500">— Sin registro</span>
                        )}
                      </td>
                      <td className="py-2.5 text-right whitespace-nowrap">
                        {confirmandoUid === i.uid ? (
                          <div className="inline-flex gap-2 items-center">
                            <span className="text-[10px] text-stone-300">¿Quitar y liberar su plaza?</span>
                            <button
                              onClick={() => setConfirmandoUid(null)}
                              disabled={quitandoUid === i.uid}
                              className="text-[10px] text-stone-400 hover:text-stone-200 disabled:opacity-40 cursor-pointer"
                            >
                              No
                            </button>
                            <button
                              onClick={() => handleQuitar(i.uid)}
                              disabled={quitandoUid === i.uid}
                              className="px-3 py-1 rounded-lg bg-red-500 text-white text-[10px] tracking-widest uppercase hover:bg-red-600 disabled:opacity-40 cursor-pointer"
                            >
                              {quitandoUid === i.uid ? '...' : 'Sí, quitar'}
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setConfirmandoUid(i.uid); setQuitarError(null) }}
                            disabled={quitandoUid !== null}
                            aria-label={`Quitar a ${i.displayName || i.email}`}
                            className="px-3 py-1 rounded-full border border-white/15 text-[10px] tracking-widest uppercase text-stone-400 hover:border-red-400 hover:text-red-400 disabled:opacity-40 transition-colors cursor-pointer"
                          >
                            Quitar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Grid de eventos */}
      <SectionCard title="Eventos">
        <div className="flex gap-2 mb-5">
          {tabs.map(t => (
            <button
              key={t.label}
              onClick={t.onClick}
              className={`px-3 py-1 rounded-full text-[10px] tracking-widest uppercase transition-colors border cursor-pointer ${
                t.active ? 'text-white border-transparent bg-brand-red' : 'text-stone-400 border-white/15 hover:border-white/30'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {actividades.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <div className="relative flex-1">
              <svg
                xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 pointer-events-none"
              >
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Buscar por título, sede o isla…"
                style={{ colorScheme: 'dark' }}
                className="w-full border border-white/15 rounded-xl pl-8 pr-8 py-2 text-base text-white bg-white/5 focus:outline-none focus:border-brand-orange transition-colors placeholder:text-stone-500"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white transition-colors cursor-pointer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            {mesesDisponibles.length > 0 && (
              <div className="sm:w-56 shrink-0">
                <Select value={mesFiltro} onChange={setMesFiltro}>
                  <option value="">Todos los meses</option>
                  {mesesDisponibles.map(m => <option key={m} value={m}>{formatMes(m)}</option>)}
                </Select>
              </div>
            )}
          </div>
        )}

        {visible.length === 0 ? (
          <p className="text-sm text-stone-400 py-4 text-center">Sin actividades</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {visible.map(a => (
              <ActivityCard
                key={a.id}
                actividad={a}
                selected={a.id === selectedId}
                onClick={() => handleSelect(a.id)}
                onEdit={() => handleEdit(a.id)}
              />
            ))}
          </div>
        )}
      </SectionCard>

    </div>
  )
}
