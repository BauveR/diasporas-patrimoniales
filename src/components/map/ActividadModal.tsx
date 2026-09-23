import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ActividadPage } from '../../pages/ActividadPage'

export function ActividadModal() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from
  const close = () => navigate(-1)

  // Desktop/tablet ya no pasa por acá: InscripcionSection ('actividades',
  // el default de ActividadCard) y la grilla de Perfil ('perfil') renderizan
  // su propio panel inline (ActividadExpandido) dentro de la sección que los
  // abrió — ver ActividadInlineContext. Este modal de pantalla completa
  // sigue existiendo solo para la lista compacta de Perfil en mobile
  // (ProfileCardCompact, 'perfil-mobile'), donde no hay una versión inline
  // equivalente todavía.
  if (from === 'actividades' || from === 'perfil') return null

  const fromPerfil = from === 'perfil-mobile'

  return (
    <>
      <motion.div
        className="fixed inset-0 z-[1500] bg-black/40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={close}
      />
      <motion.div
        className="fixed inset-0 z-[1600] flex items-center justify-center pointer-events-none"
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        <div
          className={`relative w-[92vw] ${fromPerfil ? 'max-w-sm' : 'max-w-4xl'} max-h-[90svh] overflow-y-auto bg-white rounded-2xl shadow-xl pointer-events-auto`}
          onClick={e => e.stopPropagation()}
        >
          <button
            onClick={close}
            className="absolute top-4 right-4 z-10 w-11 h-11 flex items-center justify-center rounded-full bg-white/80 hover:bg-white transition-colors shadow-sm cursor-pointer"
            aria-label="Cerrar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
          <ActividadPage />
        </div>
      </motion.div>
    </>
  )
}
