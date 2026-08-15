import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AuthPage } from '../../pages/AuthPage'

export function AuthModal() {
  const navigate = useNavigate()
  const close = () => navigate(-1)

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
          className="relative w-[92vw] max-w-md bg-white rounded-2xl shadow-xl pointer-events-auto"
          onClick={e => e.stopPropagation()}
        >
          <button
            onClick={close}
            className="absolute top-4 right-4 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-white/80 hover:bg-white transition-colors shadow-sm cursor-pointer"
            aria-label="Cerrar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
          <AuthPage isModal />
        </div>
      </motion.div>
    </>
  )
}
