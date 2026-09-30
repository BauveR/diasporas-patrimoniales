import type { ElementType, HTMLAttributes } from 'react'
import { motion, type Transition, type Variants } from 'framer-motion'

// Adaptado de @fancy/breathing-text (fancycomponents.dev). La versión
// original anima `font-variation-settings` (peso/inclinación tipográfica)
// letra por letra — solo funciona con fuentes variables. Mattone acá está
// cargada como 2 pesos estáticos (@font-face Regular/Bold en index.css), no
// variable, así que en su lugar se anima opacity+scale por letra: mismo
// patrón de stagger + loop "mirror", efecto visible con cualquier fuente.
interface BreathingTextProps extends HTMLAttributes<HTMLElement> {
  children: string
  as?: ElementType
  /**
   * 'letter' (default) anima cada carácter — funciona bien para una frase
   * corta como una pastilla, pero un texto largo no tiene dónde cortar
   * línea (cada letra es un inline-block sin espacio real entre medio, así
   * que el navegador no puede saltar de línea). 'word' anima palabra por
   * palabra dejando los espacios como texto normal entre ellas, así el
   * párrafo sigue haciendo wrap como cualquier texto.
   */
  splitBy?: 'letter' | 'word'
  fromOpacity?: number
  toOpacity?: number
  fromScale?: number
  toScale?: number
  transition?: Transition
  staggerDuration?: number
  staggerFrom?: 'first' | 'last' | 'center' | number
  repeatDelay?: number
}

export function BreathingText({
  children,
  as = 'span',
  splitBy = 'letter',
  fromOpacity = 0.4,
  toOpacity = 1,
  fromScale = 0.94,
  toScale = 1,
  transition = { duration: 1.5, ease: 'easeInOut' },
  staggerDuration = 0.08,
  staggerFrom = 'first',
  repeatDelay = 0.1,
  className,
  ...props
}: BreathingTextProps) {
  const letterVariants: Variants = {
    initial: { opacity: fromOpacity, scale: fromScale },
    animate: (i: number) => ({
      opacity: toOpacity,
      scale: toScale,
      transition: {
        ...transition,
        repeat: Infinity,
        repeatType: 'mirror',
        delay: i * staggerDuration,
        repeatDelay,
      },
    }),
  }

  const getCustomIndex = (index: number, total: number) => {
    if (typeof staggerFrom === 'number') return Math.abs(index - staggerFrom)
    switch (staggerFrom) {
      case 'first':
        return index
      case 'last':
        return total - 1 - index
      case 'center':
      default:
        return Math.abs(index - Math.floor(total / 2))
    }
  }

  const ElementTag = as as ElementType<HTMLAttributes<HTMLElement>>

  if (splitBy === 'word') {
    const tokens = children.split(/(\s+)/).filter(t => t.length > 0)
    const totalWords = tokens.filter(t => !/^\s+$/.test(t)).length
    let wordIndex = 0
    return (
      <ElementTag className={className} {...props}>
        {tokens.map((token, i) => {
          if (/^\s+$/.test(token)) return token
          const idx = wordIndex++
          return (
            <motion.span
              key={i}
              className="inline-block"
              variants={letterVariants}
              initial="initial"
              animate="animate"
              custom={getCustomIndex(idx, totalWords)}
            >
              {token}
            </motion.span>
          )
        })}
      </ElementTag>
    )
  }

  const letters = children.split('')

  return (
    <ElementTag className={className} {...props}>
      {letters.map((letter, i) => (
        <motion.span
          key={i}
          className="inline-block whitespace-pre"
          aria-hidden="true"
          variants={letterVariants}
          initial="initial"
          animate="animate"
          custom={getCustomIndex(i, letters.length)}
        >
          {letter}
        </motion.span>
      ))}
      <span className="sr-only">{children}</span>
    </ElementTag>
  )
}
