import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import type { Actividad } from '../data/actividades'
import type { Sede } from '../data/sedes'
import { loadDb } from '../lib/firebaseLoaders'
import { AVISO_LENTO_MS, TIMEOUT_CONEXION_MS, cambiarAModoCompatibleAutomatico, reportarSiRecuperado } from '../lib/conexion'

type DataContextValue = {
  actividades: Actividad[]
  sedes: Sede[]
  dataLoading: boolean
  // Firebase no cargó, el listener falló o no hubo respuesta en
  // TIMEOUT_CONEXION_MS — la UI muestra ConexionError en vez de esperar.
  dataError: boolean
  // Aún cargando pasado AVISO_LENTO_MS ('lento'), o recargando sola en modo
  // compatible tras el primer fallo ('reconectando') — ver ConexionAviso.
  conexion: 'normal' | 'lento' | 'reconectando'
}

const DataContext = createContext<DataContextValue | null>(null)

let _actividades: Actividad[] = []
let _sedes: Sede[] = []

export function DataProvider({ children }: { children: ReactNode }) {
  const [actividades, setActividades] = useState<Actividad[]>(_actividades)
  const [sedes, setSedes] = useState<Sede[]>(_sedes)
  const [dataLoading, setDataLoading] = useState(true)
  const [dataError, setDataError] = useState(false)
  const [conexion, setConexion] = useState<DataContextValue['conexion']>('normal')

  useEffect(() => {
    let actLoaded = false
    let conjLoaded = false
    let cancelled = false
    let unsub1 = () => {}
    let unsub2 = () => {}

    const fallar = (err: unknown) => {
      if (cancelled || (actLoaded && conjLoaded)) return
      console.error('[DataContext] sin conexión con Firestore:', err)
      // Primer fallo de la pestaña: recarga sola en modo compatible. Solo
      // si eso ya se intentó, se muestra el aviso con "Reintentar".
      if (cambiarAModoCompatibleAutomatico()) setConexion('reconectando')
      else setDataError(true)
    }
    // Firestore no da error cuando un proxy corta la conexión: reintenta en
    // silencio. A AVISO_LENTO_MS se avisa suave; a TIMEOUT_CONEXION_MS se da
    // por fallido — y si los datos llegan después, `listo()` lo quita.
    const lento = setTimeout(() => {
      if (!actLoaded || !conjLoaded) setConexion(c => c === 'normal' ? 'lento' : c)
    }, AVISO_LENTO_MS)
    const timeout = setTimeout(() => {
      if (!actLoaded || !conjLoaded) fallar(new Error('timeout'))
    }, TIMEOUT_CONEXION_MS)
    const listo = () => {
      if (!actLoaded || !conjLoaded) return
      clearTimeout(lento)
      clearTimeout(timeout)
      setDataLoading(false)
      setDataError(false)
      setConexion('normal')
      reportarSiRecuperado()
    }

    // import() dinámico: ver lib/firebaseLoaders.ts.
    loadDb().then(({ subscribeActividades, subscribeSedes }) => {
      if (cancelled) return
      // Vacío y desde caché = Firestore pasó a "offline" sin haber recibido
      // nada del servidor (proxy institucional, red caída): es un fallo de
      // conexión, no "no hay jornadas". Antes contaba como cargado, cancelaba
      // el aviso y la sección de inscripción desaparecía sin explicación.
      unsub1 = subscribeActividades((data, { fromCache }) => {
        if (fromCache && data.length === 0) return fallar(new Error('offline: actividades vacías desde caché'))
        _actividades = data
        setActividades(data)
        actLoaded = true
        listo()
      }, fallar)
      unsub2 = subscribeSedes((data, { fromCache }) => {
        if (fromCache && data.length === 0) return fallar(new Error('offline: sedes vacías desde caché'))
        _sedes = data
        setSedes(data)
        conjLoaded = true
        listo()
      }, fallar)
    }, fallar)

    return () => { cancelled = true; clearTimeout(lento); clearTimeout(timeout); unsub1(); unsub2() }
  }, [])

  return (
    <DataContext.Provider value={{ actividades, sedes, dataLoading, dataError, conexion }}>
      {children}
    </DataContext.Provider>
  )
}

// Context + colocated hook is the standard pattern here — it only costs Fast
// Refresh granularity, not correctness.
// eslint-disable-next-line react-refresh/only-export-components
export function useDataContext() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useDataContext must be used within DataProvider')
  return ctx
}
