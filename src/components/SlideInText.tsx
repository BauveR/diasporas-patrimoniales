import { Fragment } from 'react'
import { motion } from 'framer-motion'

// Reveals by word, not by letter: a per-letter stagger (the original
// react-bits-style version this was adapted from) reads as a mechanical
// typewriter effect once you watch it a few times — evenly spaced, identical
// timing on every glyph. Word-level stagger has far fewer, more varied
// beats, which alone reads calmer.
//
// Spring physics (position) + a plain eased fade/blur (opacity, blur) instead
// of one flat `easeOut` on everything: a spring gives words a small natural
// settle instead of stopping dead on arrival, while opacity/blur stay on a
// simple tween because spring's overshoot doesn't mean anything for those —
// motion.span applies these keyed by property, animating with its exact
// physics rather than a single compromise curve.
type SlideInTextProps = {
  text: string
  className?: string
  delayStep?: number
  startDelay?: number
}

export function SlideInText({ text, className = '', delayStep = 0.08, startDelay = 0 }: SlideInTextProps) {
  const words = text.split(' ')

  return (
    <h2 className={className}>
      {words.map((word, wordIndex) => (
        <Fragment key={wordIndex}>
          <motion.span
            initial={{ y: 14, opacity: 0, filter: 'blur(8px)' }}
            animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
            transition={{
              // `delay` only applies per property when repeated inside each
              // one — a shared top-level `delay` alongside per-property
              // overrides is silently ignored by framer-motion, which is
              // what made every word appear at once despite wordIndex *
              // delayStep looking correct above.
              y: { type: 'spring', stiffness: 120, damping: 16, mass: 1.1, delay: startDelay + wordIndex * delayStep },
              opacity: { duration: 0.7, ease: 'easeOut', delay: startDelay + wordIndex * delayStep },
              filter: { duration: 0.8, ease: 'easeOut', delay: startDelay + wordIndex * delayStep },
            }}
            className="inline-block whitespace-nowrap"
          >
            {word}
          </motion.span>
          {wordIndex < words.length - 1 && ' '}
        </Fragment>
      ))}
    </h2>
  )
}
