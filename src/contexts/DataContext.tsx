import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import type { Tematica } from '../data/tematicas'
import type { Dificultad, Actividad } from '../data/actividades'
import type { Sede } from '../data/sedes'
import type { FilterState } from '../components/actividades/FilterSheet'
import { subscribeActividades, subscribeSedes } from '../lib/db'

type DataContextValue = {
  actividades: Actividad[]
  sedes: Sede[]
  dataLoading: boolean
  tematica: Tematica | null
  setTematica: (v: Tematica | null) => void
  isla: string | null
  setIsla: (v: string | null) => void
  sedeId: number | null
  setSedeId: (v: number | null) => void
  mes: string | null
  setMes: (v: string | null) => void
  dificultad: Dificultad | null
  setDificultad: (v: Dificultad | null) => void
  applyFilters: (f: FilterState) => void
}

const DataContext = createContext<DataContextValue | null>(null)

let _actividades: Actividad[] = []
let _sedes: Sede[] = []

export function DataProvider({ children }: { children: ReactNode }) {
  const [actividades, setActividades] = useState<Actividad[]>(_actividades)
  const [sedes, setSedes] = useState<Sede[]>(_sedes)
  const [dataLoading, setDataLoading] = useState(true)

  const [tematica, setTematica] = useState<Tematica | null>(null)
  const [isla, setIsla] = useState<string | null>(null)
  const [sedeId, setSedeId] = useState<number | null>(null)
  const [mes, setMes] = useState<string | null>(null)
  const [dificultad, setDificultad] = useState<Dificultad | null>(null)

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

  const applyFilters = (f: FilterState) => {
    setTematica(f.tematica)
    setIsla(f.isla)
    setSedeId(f.sedeId)
    setMes(f.mes)
    setDificultad(f.dificultad)
  }

  return (
    <DataContext.Provider value={{
      actividades, sedes, dataLoading,
      tematica, setTematica,
      isla, setIsla,
      sedeId, setSedeId,
      mes, setMes,
      dificultad, setDificultad,
      applyFilters,
    }}>
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
