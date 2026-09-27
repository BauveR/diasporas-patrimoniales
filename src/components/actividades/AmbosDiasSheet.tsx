import { createPortal } from 'react-dom'
import { AnimatePresence, motion, type PanInfo } from 'framer-motion'
import { AmbosDiasExpandido } from './AmbosDiasExpandido'
import type { Actividad } from '../../data/actividades'

// Mismo lenguaje visual y gesto de arrastre que ActividadSheet/ParticipanteSheet,
// pero sin depender de la ruta `/actividades/:id` (la card "Ambos días" no
// tiene una jornada real a la que apuntar) — se abre/cierra con estado local
// en InscripcionSection en vez de con el truco de `background` de react-router.
// Se monta siempre (gateado internamente por `open` + su propio
// AnimatePresence, mismo patrón que el sheet mobile de AdminPage.tsx) y hace
// `createPortal` a document.body: así el `position: fixed` queda relativo al
// viewport aunque InscripcionSection lo monte dentro de wrappers de
// framer-motion que le aplican `transform` a sus ancestros.
export function AmbosDiasSheet({ dia1, dia2, open, onClose }: { dia1: Actividad; dia2: Actividad; open: boolean; onClose: () => void }) {
  const handleDragEnd = (_e: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) => {
    if (info.offset.y > 120 || info.velocity.y > 500) onClose()
  }

  return createPortal(
    <AnimatePresence>
      {open && (
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
            className="fixed inset-x-0 bottom-0 z-[1600] max-h-[85svh] overflow-y-auto rounded-t-3xl bg-stone-900 shadow-xl pb-[env(safe-area-inset-bottom,0px)]"
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
              <div className="h-1.5 w-10 rounded-full bg-white/20" />
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="absolute top-4 right-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
            <div className="px-2 pb-4">
              <AmbosDiasExpandido dia1={dia1} dia2={dia2} onClose={onClose} bare />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  )
}
