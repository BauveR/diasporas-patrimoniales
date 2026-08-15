import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence, type Transition } from 'framer-motion'
import type { Sede } from '../../data/sedes'
import { TEMATICA_COLORS } from '../../data/tematicas'
import { useIsDesktop } from '../../hooks/useIsDesktop'
import { useDataContext } from '../../contexts/DataContext'

type Props = {
  sede: Sede | null
  open: boolean
  onClose: () => void
  onNavigate?: () => void
}

const desktopTransition: Transition = { duration: 0.18, ease: 'easeOut' }
const mobileTransition: Transition = { type: 'spring', damping: 30, stiffness: 300 }

export function SedeDrawer({ sede, open, onClose, onNavigate }: Props) {
  const isDesktop = useIsDesktop()
  const { actividades: todasActividades } = useDataContext()
  const [bibOpen, setBibOpen] = useState(false)
  const [atTop, setAtTop] = useState(true)

  useEffect(() => {
    if (!open) return
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    return () => {
      document.documentElement.style.overflow = ''
      document.body.style.overflow = ''
    }
  }, [open])

  if (!sede) return null

  const actividades = todasActividades.filter(a => a.sedeId === sede.id)

  const cardVariants = isDesktop
    ? { initial: { opacity: 0, scale: 0.96 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.96 } }
    : { initial: { y: '100%' }, animate: { y: 0 }, exit: { y: '100%' } }

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-9998 bg-black/40 sm:flex sm:items-center sm:justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="
              bg-white flex flex-col overflow-hidden
              fixed bottom-0 left-0 right-0 rounded-t-3xl max-h-[90svh]
              sm:relative sm:bottom-auto sm:left-auto sm:right-auto
              sm:w-[92vw] sm:max-w-none sm:rounded-2xl sm:h-[90vh] sm:flex-row
            "
            variants={cardVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={isDesktop ? desktopTransition : mobileTransition}
            drag={isDesktop ? false : atTop ? 'y' : false}
            dragConstraints={isDesktop ? undefined : { top: 0 }}
            dragElastic={isDesktop ? undefined : { top: 0 }}
            onDragEnd={isDesktop ? undefined : (_, info) => { if (info.offset.y > 50 || info.velocity.y > 400) onClose() }}
            onClick={e => e.stopPropagation()}
          >
            {/* Handle + botón cierre — solo mobile */}
            {!isDesktop && (
              <div className="relative flex justify-center py-4 shrink-0 cursor-grab active:cursor-grabbing">
                <div className="w-10 h-1 rounded-full bg-stone-200" />
                <button
                  onClick={e => { e.stopPropagation(); onClose() }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full bg-stone-100 hover:bg-stone-200 transition-colors cursor-pointer"
                  aria-label="Cerrar"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            {/* ── DESKTOP: izquierda textos ── */}
            <div className="hidden sm:flex flex-col justify-between h-full w-[42%] shrink-0 px-16 py-14 overflow-y-auto">

              {/* Cabecera */}
              <div className="flex flex-col gap-6">
                <p
                  className="text-[10px] tracking-[0.25em] uppercase text-stone-400"
                  style={{ fontFamily: "'Open Sans', sans-serif" }}
                >
                  {sede.isla} — {sede.municipio}
                </p>

                <h2
                  className="text-4xl font-thin uppercase tracking-tight leading-tight"
                  style={{ fontFamily: "'Google Sans Flex', sans-serif", fontVariationSettings: "'wght' 100", color: '#b19e7b' }}
                >
                  {sede.nombre}
                </h2>

                <div className="w-8 h-px bg-stone-300" />

                <p
                  className="text-sm text-stone-500 leading-loose max-w-sm"
                  style={{ fontFamily: "'Open Sans', sans-serif" }}
                >
                  {sede.descripcion}
                </p>

                {/* Stat bar */}
                <div
                  className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-stone-400"
                  style={{ fontFamily: "'Open Sans', sans-serif" }}
                >
                  {[
                    `${actividades.length} actividad${actividades.length !== 1 ? 'es' : ''}`,
                    ...(sede.declaraciones ?? []),
                    ...(sede.fundacion ? [`Fundada en ${sede.fundacion}`] : []),
                  ].map((stat, i) => (
                    <span key={stat} className="flex items-center gap-3">
                      {i > 0 && <span aria-hidden className="text-stone-200">·</span>}
                      {stat}
                    </span>
                  ))}
                </div>
              </div>

              {/* Actividades mini-cards */}
              <div className="flex flex-col gap-4">
                <p
                  className="text-[10px] tracking-[0.25em] uppercase text-stone-400"
                  style={{ fontFamily: "'Open Sans', sans-serif" }}
                >
                  Actividades disponibles
                </p>
                <div
                  className="flex gap-4 overflow-x-auto pb-1"
                  style={{ scrollbarWidth: 'none' }}
                >
                  {actividades.map(act => (
                    <Link
                      key={act!.id}
                      to={`/actividades/${act!.id}`}
                      state={{ from: 'sedes' }}
                      onClick={onNavigate ?? onClose}
                      className="flex-none w-40 flex flex-col gap-2 group"
                    >
                      <div className="aspect-4/3 rounded-xl overflow-hidden">
                        <img
                          src={act!.imagen}
                          alt={act!.titulo}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <span
                        className="px-2 py-0.5 rounded-full text-[9px] tracking-widest uppercase text-white font-bold w-fit"
                        style={{ backgroundColor: TEMATICA_COLORS[act!.tematica] }}
                      >
                        {act!.tematica}
                      </span>
                      <p
                        className="text-xs text-stone-800 leading-snug line-clamp-2"
                        style={{ fontFamily: "'Open Sans', sans-serif" }}
                      >
                        {act!.titulo}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Bibliografía desktop */}
              {(sede.bibliografia?.length ?? 0) > 0 && (
                <div className="border border-stone-100 rounded-2xl overflow-hidden">
                  <button
                    onClick={() => setBibOpen(p => !p)}
                    className="w-full flex items-center justify-between px-5 py-3.5 text-left cursor-pointer hover:bg-stone-50 transition-colors"
                    style={{ fontFamily: "'Open Sans', sans-serif" }}
                  >
                    <span className="text-[10px] tracking-[0.25em] uppercase text-stone-400">Bibliografía</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
                      fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
                      className={`text-stone-300 shrink-0 transition-transform duration-200 ${bibOpen ? 'rotate-180' : ''}`}
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                  {bibOpen && (
                    <ul className="flex flex-col gap-2 px-5 pb-5 pt-1">
                      {sede.bibliografia!.map((ref, i) => (
                        <li key={i} className="text-[11px] text-stone-500 leading-relaxed" style={{ fontFamily: "'Open Sans', sans-serif" }}>
                          {ref.startsWith('http') ? (
                            <a href={ref} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 decoration-stone-300 hover:text-stone-700 break-all">
                              {ref}
                            </a>
                          ) : ref}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* ── DESKTOP: derecha imagen slide ── */}
            <div className="hidden sm:block flex-1 h-full relative overflow-hidden">
              <img
                src={sede.imagen}
                alt={sede.nombre}
                className="w-full h-full object-cover"
              />
              {/* Botón cerrar sobre la imagen */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-white/80 hover:bg-white transition-colors cursor-pointer shadow-sm"
                aria-label="Cerrar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* ── MOBILE: scroll único — imagen + contenido ── */}
            <div
              className="sm:hidden overflow-y-auto flex-1 overscroll-contain"
              onScroll={e => setAtTop(e.currentTarget.scrollTop === 0)}
            >

              {/* Imagen — scrollea con el contenido */}
              <div className="w-full aspect-video">
                <img src={sede.imagen} alt={sede.nombre} className="w-full h-full object-cover" />
              </div>

              <div className="flex flex-col gap-5 px-6 py-6">
                <p className="text-[10px] tracking-widest uppercase text-stone-400" style={{ fontFamily: "'Open Sans', sans-serif" }}>
                  {sede.isla} — {sede.municipio}
                </p>
                <h2
                  className="text-2xl font-thin uppercase tracking-tight leading-snug"
                  style={{ fontFamily: "'Google Sans Flex', sans-serif", fontVariationSettings: "'wght' 100", color: '#b19e7b' }}
                >
                  {sede.nombre}
                </h2>

                <div className="w-8 h-px bg-stone-200" />

                <p className="text-sm text-stone-500 leading-relaxed" style={{ fontFamily: "'Open Sans', sans-serif" }}>
                  {sede.descripcion}
                </p>

                {/* Stat bar */}
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-stone-400" style={{ fontFamily: "'Open Sans', sans-serif" }}>
                  {[
                    `${actividades.length} actividad${actividades.length !== 1 ? 'es' : ''}`,
                    ...(sede.declaraciones ?? []),
                    ...(sede.fundacion ? [`Fundada en ${sede.fundacion}`] : []),
                  ].map((stat, i) => (
                    <span key={stat} className="flex items-center gap-2">
                      {i > 0 && <span aria-hidden className="text-stone-200">·</span>}
                      {stat}
                    </span>
                  ))}
                </div>

                <div className="w-full h-px bg-stone-100" />

                <p className="text-[10px] tracking-widest uppercase text-stone-400" style={{ fontFamily: "'Open Sans', sans-serif" }}>
                  Actividades
                </p>

                {/* Mini-cards horizontal */}
                <div
                  className="flex gap-3 overflow-x-auto pb-2 -mx-6 px-6"
                  style={{ scrollbarWidth: 'none' }}
                >
                  {actividades.map(act => (
                    <Link
                      key={act!.id}
                      to={`/actividades/${act!.id}`}
                      state={{ from: 'sedes' }}
                      onClick={onNavigate ?? onClose}
                      className="flex-none w-36 flex flex-col gap-1.5 group"
                    >
                      <div className="aspect-4/3 rounded-xl overflow-hidden">
                        <img
                          src={act!.imagen}
                          alt={act!.titulo}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span
                        className="px-2 py-0.5 rounded-full text-[9px] tracking-widest uppercase text-white font-bold w-fit"
                        style={{ backgroundColor: TEMATICA_COLORS[act!.tematica] }}
                      >
                        {act!.tematica}
                      </span>
                      <p className="text-xs text-stone-800 leading-snug line-clamp-2" style={{ fontFamily: "'Open Sans', sans-serif" }}>
                        {act!.titulo}
                      </p>
                    </Link>
                  ))}
                </div>

                {/* Bibliografía mobile */}
                {(sede.bibliografia?.length ?? 0) > 0 && (
                  <div className="border border-stone-100 rounded-2xl overflow-hidden">
                    <button
                      onClick={() => setBibOpen(p => !p)}
                      className="w-full flex items-center justify-between px-5 py-3.5 text-left cursor-pointer hover:bg-stone-50 transition-colors"
                      style={{ fontFamily: "'Open Sans', sans-serif" }}
                    >
                      <span className="text-[10px] tracking-[0.25em] uppercase text-stone-400">Bibliografía</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
                        fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
                        className={`text-stone-300 shrink-0 transition-transform duration-200 ${bibOpen ? 'rotate-180' : ''}`}
                      >
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </button>
                    {bibOpen && (
                      <ul className="flex flex-col gap-2 px-5 pb-5 pt-1">
                        {sede.bibliografia!.map((ref, i) => (
                          <li key={i} className="text-[11px] text-stone-500 leading-relaxed" style={{ fontFamily: "'Open Sans', sans-serif" }}>
                            {ref.startsWith('http') ? (
                              <a href={ref} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 decoration-stone-300 hover:text-stone-700 break-all">
                                {ref}
                              </a>
                            ) : ref}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            </div>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
