import { Fragment } from 'react'
import { motion } from 'framer-motion'

// Adapted from a pasted react-bits-style snippet: dropped the Next.js
// `'use client'` directive (irrelevant in Vite), the demo wrapper component,
// and the hardcoded `text-2xl md:text-4xl font-bold text-center` classes in
// favor of a `className` prop so callers control size/alignment/weight.
//
// Also grouped letters by word instead of animating one flat array of
// characters: each letter is its own `inline-block` (needed for the
// per-glyph slide-in transform), and inline-block elements are each
// independently breakable by the browser's line-wrapping — animating flat
// caused short words ("la", "de") to split across two lines mid-word.
// Wrapping each word's letters in a `whitespace-nowrap` span keeps the word
// atomic for wrapping while the letters inside still animate individually;
// the space between word-groups stays a plain breakable text node.
type SlideInTextProps = {
  text: string
  className?: string
  delayStep?: number
}

export function SlideInText({ text, className = '', delayStep = 0.03 }: SlideInTextProps) {
  const words = text.split(' ')

  // Each word's starting position in the flat letter sequence, computed
  // purely (no reassigned outer variable) so the per-letter stagger delay
  // still counts continuously across the whole string rather than
  // restarting at 0 for every word.
  const wordOffsets = words.reduce<{ offsets: number[]; total: number }>(
    (acc, word) => {
      acc.offsets.push(acc.total)
      acc.total += word.length
      return acc
    },
    { offsets: [], total: 0 },
  ).offsets

  return (
    <h2 className={className}>
      {words.map((word, wordIndex) => (
        <Fragment key={wordIndex}>
          <span className="inline-block whitespace-nowrap">
            {word.split('').map((char, charIndex) => {
              const flatIndex = wordOffsets[wordIndex] + charIndex
              return (
                <motion.span
                  key={charIndex}
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: flatIndex * delayStep, ease: 'easeOut' }}
                  className="inline-block"
                >
                  {char}
                </motion.span>
              )
            })}
          </span>
          {wordIndex < words.length - 1 && ' '}
        </Fragment>
      ))}
    </h2>
  )
}
