import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import type { Actividad } from '../data/actividades'
import type { Sede } from '../data/sedes'
import { loadDb } from '../lib/firebaseLoaders'
import { AVISO_LENTO_MS, GRACIA_SIN_SERVIDOR_MS, TIMEOUT_CONEXION_MS, cambiarAModoCompatibleAutomatico, reportarSiRecuperado, sinInternet } from '../lib/conexion'

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
      // Sin internet en el dispositivo: el modo compatible no ayudaría (y
      // gastaría su único intento de la pestaña). ConexionError lo dice y
      // recarga sola al volver la conexión.
      if (sinInternet()) { setDataError(true); return }
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
    // Firestore se declaró offline sin datos (caché vacía): ver
    // GRACIA_SIN_SERVIDOR_MS. Se espera a su reintento; si al terminar la
    // gracia (contada desde que empezó la carga) siguen sin llegar, fallo.
    // Sin internet en el dispositivo no hay nada que esperar.
    const inicio = Date.now()
    let gracia: ReturnType<typeof setTimeout> | undefined
    const sinServidor = (motivo: string) => {
      if (sinInternet()) return fallar(new Error(`${motivo} (sin internet)`))
      if (gracia) return
      const resta = Math.max(0, GRACIA_SIN_SERVIDOR_MS - (Date.now() - inicio))
      gracia = setTimeout(() => fallar(new Error(motivo)), resta)
    }
    const listo = () => {
      if (!actLoaded || !conjLoaded) return
      clearTimeout(lento)
      clearTimeout(timeout)
      clearTimeout(gracia)
      setDataLoading(false)
      setDataError(false)
      setConexion('normal')
      reportarSiRecuperado()
    }

    // import() dinámico: ver lib/firebaseLoaders.ts.
    loadDb().then(({ subscribeActividades, subscribeSedes }) => {
      if (cancelled) return
      // Vacío y desde caché = Firestore pasó a "offline" sin haber recibido
      // nada del servidor (proxy institucional, red caída… o un corte de un
      // segundo): no es "no hay jornadas", pero tampoco un bloqueo seguro —
      // ver sinServidor() arriba. Antes contaba como cargado y la sección de
      // inscripción desaparecía; después, como fallo inmediato, y avisaba en
      // redes normales.
      unsub1 = subscribeActividades((data, { fromCache }) => {
        if (fromCache && data.length === 0) return sinServidor('offline: actividades vacías desde caché')
        _actividades = data
        setActividades(data)
        actLoaded = true
        listo()
      }, fallar)
      unsub2 = subscribeSedes((data, { fromCache }) => {
        if (fromCache && data.length === 0) return sinServidor('offline: sedes vacías desde caché')
        _sedes = data
        setSedes(data)
        conjLoaded = true
        listo()
      }, fallar)
    }, fallar)

    return () => { cancelled = true; clearTimeout(lento); clearTimeout(timeout); clearTimeout(gracia); unsub1(); unsub2() }
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
