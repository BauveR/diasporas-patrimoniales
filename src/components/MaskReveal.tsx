import type { ReactNode } from 'react'
import { motion } from 'framer-motion'

// Curva de las apariciones nuevas: arranca rápido y se posa despacio.
const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const

// Una línea que sube desde detrás de un corte invisible (la caja con
// overflow-hidden), como los títulos de lenis.dev. El padding/margen
// negativo vertical deja aire para tildes y descendentes, que si no
// quedarían recortados por la máscara.
//
// Por defecto anima al montar (el hero ya está a la vista);
// `revealOnScroll` la retiene hasta que entra en pantalla.
export function MaskLine({
  children,
  delay = 0,
  revealOnScroll = false,
  className = '',
}: {
  children: ReactNode
  delay?: number
  revealOnScroll?: boolean
  className?: string
}) {
  const trigger = revealOnScroll
    ? { whileInView: { y: '0%' }, viewport: { once: true, amount: 0.8 } }
    : { animate: { y: '0%' } }
  return (
    <span className={`-my-[0.15em] block overflow-hidden py-[0.15em] ${className}`}>
      <motion.span
        className="block"
        initial={{ y: '110%' }}
        {...trigger}
        transition={{ duration: 1.1, ease: EASE_OUT_EXPO, delay }}
      >
        {children}
      </motion.span>
    </span>
  )
}

// Aparición suave (sube un poco y se desvanece hacia dentro) para bloques
// que no son una sola línea: párrafos, botones, fila de logos.
export function FadeUp({
  children,
  delay = 0,
  revealOnScroll = false,
  className = '',
}: {
  children: ReactNode
  delay?: number
  revealOnScroll?: boolean
  className?: string
}) {
  const trigger = revealOnScroll
    ? { whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: 0.4 } }
    : { animate: { opacity: 1, y: 0 } }
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 16 }}
      {...trigger}
      transition={{ duration: 1, ease: EASE_OUT_EXPO, delay }}
    >
      {children}
    </motion.div>
  )
}
