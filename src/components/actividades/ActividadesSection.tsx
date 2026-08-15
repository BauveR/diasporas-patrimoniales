import { useMemo, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FilterBar } from './FilterBar'
import { FilterSheet, type FilterState } from './FilterSheet'
import { ActividadesSlider } from './ActividadesSlider'
import { ActividadesInactivas } from './ActividadesInactivas'
import { CardSkeleton } from './CardSkeleton'
import { useDataContext } from '../../contexts/DataContext'

const labelStyle = { fontFamily: "'Open Sans', sans-serif" }

export function ActividadesSection() {
  const {
    actividades, sedes,
    tematica, setTematica,
    isla, setIsla,
    sedeId, setSedeId,
    mes, setMes,
    dificultad, setDificultad,
    applyFilters,
  } = useDataContext()

  const [sheetOpen, setSheetOpen] = useState(false)
  const [ready, setReady] = useState(actividades.length > 0)

  useEffect(() => {
    if (actividades.length > 0 && !ready) {
      const t = setTimeout(() => setReady(true), 350)
      return () => clearTimeout(t)
    }
  }, [actividades.length, ready])

  const mesesDisponibles = useMemo(() => {
    const set = new Set(actividades.map(a => a.fecha.slice(0, 7)))
    return Array.from(set).sort()
  }, [actividades])

  const today = new Date().toISOString().slice(0, 10)

  const actividadesFiltradas = useMemo(() => {
    return actividades.filter(a => {
      if (tematica && a.tematica !== tematica) return false
      if (sedeId && a.sedeId !== sedeId) return false
      if (mes && !a.fecha.startsWith(mes)) return false
      if (dificultad && a.dificultad !== dificultad) return false
      if (isla) {
        const c = sedes.find(c => c.id === a.sedeId)
        if (!c || c.isla !== isla) return false
      }
      return true
    })
  }, [actividades, sedes, tematica, isla, sedeId, mes, dificultad])

  const esProximamente = (a: typeof actividadesFiltradas[number]) =>
    !!a.fechaAperturaInscripciones && a.fechaAperturaInscripciones > today

  const disponibles  = actividadesFiltradas.filter(a => !a.cancelada && !esProximamente(a) && a.plazasDisponibles > 0 && a.fecha >= today)
  const proximamente = actividadesFiltradas.filter(a => !a.cancelada && esProximamente(a) && a.fecha >= today)
  const inactivas     = actividadesFiltradas.filter(a => !a.cancelada && !esProximamente(a) && (a.plazasDisponibles === 0 || a.fecha < today))
  const canceladas    = actividadesFiltradas.filter(a => !!a.cancelada)

  const currentFilters: FilterState = { tematica, isla, sedeId, mes, dificultad }

  return (
    <section className="px-6 sm:px-8 lg:px-10 py-12 sm:py-16 bg-white">
      <div className="mb-8">
        <h2
          className="text-2xl sm:text-3xl uppercase tracking-widest leading-snug"
          style={{ fontFamily: "'Google Sans Flex', sans-serif", fontVariationSettings: "'wght' 100", color: '#cd6a26' }}
        >
          Rutas y actividades
        </h2>
      </div>

      <div className="mb-8">
        <FilterBar
          tematica={tematica}
          isla={isla}
          sedeId={sedeId}
          mes={mes}
          dificultad={dificultad}
          mesesDisponibles={mesesDisponibles}
          onTematica={setTematica}
          onIsla={setIsla}
          onSede={setSedeId}
          onMes={setMes}
          onDificultad={setDificultad}
          onOpenSheet={() => setSheetOpen(true)}
        />
      </div>

      {!ready ? (
        <div className="flex gap-5 overflow-hidden -mx-4 px-4 sm:mx-0 sm:px-0">
          {[0, 1, 2].map(i => (
            <div key={i} className="flex-shrink-0 w-[78vw] sm:w-72 lg:w-80">
              <CardSkeleton />
            </div>
          ))}
        </div>
      ) : actividades.length > 0 && actividadesFiltradas.length === 0 ? (
        <div className="py-20 text-center flex flex-col items-center gap-4">
          <p className="text-sm text-stone-400" style={labelStyle}>
            No hay actividades para los filtros seleccionados.
          </p>
          <button
            onClick={() => applyFilters({ tematica: null, isla: null, sedeId: null, mes: null, dificultad: null })}
            className="px-4 py-2 rounded-full border border-stone-200 text-[11px] text-stone-500 tracking-wide hover:border-stone-400 transition-colors"
            style={labelStyle}
          >
            Limpiar filtros
          </button>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.65 }}
        >
          <ActividadesSlider actividades={disponibles} />
          {proximamente.length > 0 && (
            <div className="mt-10">
              <ActividadesSlider
                actividades={proximamente}
                labelSingular="actividad próximamente"
                labelPlural="actividades próximamente"
              />
            </div>
          )}
          <ActividadesInactivas actividades={[...inactivas, ...canceladas]} />
        </motion.div>
      )}

      <FilterSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        filters={currentFilters}
        mesesDisponibles={mesesDisponibles}
        onApply={applyFilters}
      />
    </section>
  )
}
