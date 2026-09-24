import { useParams, useNavigate } from 'react-router-dom'
import { motion, type PanInfo } from 'framer-motion'
import { useDataContext } from '../../contexts/DataContext'
import { ActividadExpandido } from './ActividadExpandido'

// Tarjeta tipo iOS que sube desde abajo — mobile (< sm, ver ActividadModal).
// Mismo lenguaje visual y gesto de arrastre que ParticipanteSheet
// (ParticipantesSection.tsx): `drag="y"` + dragConstraints/dragElastic dejan
// arrastrarla hacia abajo para cerrarla, además del backdrop y el botón X.
// El contenido reusa ActividadExpandido en modo `bare` en vez de duplicar el
// layout: su grid ya es `grid-cols-1 sm:grid-cols-[6fr_4fr]`, así que a este
// ancho (siempre < sm acá) ya renderiza en una sola columna apilada.
export function ActividadSheet() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { actividades } = useDataContext()
  const actividad = actividades.find(a => a.id === Number(id))
  const onClose = () => navigate(-1)

  if (!actividad) return null

  const handleDragEnd = (_e: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) => {
    if (info.offset.y > 120 || info.velocity.y > 500) onClose()
  }

  return (
    <>
      <motion.div
        className="fixed inset-0 z-[1500] bg-black/40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
      />
      <motion.div
        className="fixed inset-x-0 bottom-0 z-[1600] max-h-[85svh] overflow-y-auto rounded-t-3xl bg-white shadow-xl pb-[env(safe-area-inset-bottom,0px)]"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 34 }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.6 }}
        onDragEnd={handleDragEnd}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1.5 w-10 rounded-full bg-stone-300" />
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute top-4 right-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-stone-100 text-stone-500 transition-colors hover:bg-stone-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
        <ActividadExpandido actividad={actividad} onClose={onClose} bare />
      </motion.div>
    </>
  )
}
