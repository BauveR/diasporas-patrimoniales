import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import type { Actividad } from '../data/actividades'
import type { Sede } from '../data/sedes'
import { subscribeActividades, subscribeSedes } from '../lib/db'

type DataContextValue = {
  actividades: Actividad[]
  sedes: Sede[]
  dataLoading: boolean
}

const DataContext = createContext<DataContextValue | null>(null)

let _actividades: Actividad[] = []
let _sedes: Sede[] = []

export function DataProvider({ children }: { children: ReactNode }) {
  const [actividades, setActividades] = useState<Actividad[]>(_actividades)
  const [sedes, setSedes] = useState<Sede[]>(_sedes)
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    let actLoaded = false
    let conjLoaded = false

    const unsub1 = subscribeActividades(data => {
      _actividades = data
      setActividades(data)
      actLoaded = true
      if (conjLoaded) setDataLoading(false)
    })
    const unsub2 = subscribeSedes(data => {
      _sedes = data
      setSedes(data)
      conjLoaded = true
      if (actLoaded) setDataLoading(false)
    })

    return () => { unsub1(); unsub2() }
  }, [])

  return (
    <DataContext.Provider value={{ actividades, sedes, dataLoading }}>
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
