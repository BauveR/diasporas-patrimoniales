import { motion, type Variants } from 'framer-motion'
import type { CSSProperties, ReactNode } from 'react'

// Same visual language as SlideInText.tsx (`y`/opacity) but animating a
// whole block as one unit instead of splitting it into words — right for
// body copy, cards, and panels, where per-word motion would read as a
// gimmick rather than a reveal. `whileInView`/`viewport` use
// IntersectionObserver under the hood (framer-motion, already a
// dependency), same mechanism as SlideInText's own `revealOnScroll` mode.
//
// Matched directly to apple.com/es/os/ipados's own hero-marquee reveal
// (pulled its shipped CSS: `.marquee-wrapper{transform:translate3d(-50%,
// 60px,0);transition:opacity 600ms ease-out,transform 600ms ease-out}` →
// `.reveal{transform:translate3d(-50%,0,0)}`) — 60px translate, 600ms,
// plain `ease-out`, opacity+transform only, **no blur**. The blur we had
// here before is what made an even bigger AOS-style reveal (100px/400ms)
// read as flashier than Apple's, not the distance or duration.
const revealVariants: Variants = {
  hidden: { y: 60, opacity: 0 },
  show: ({ delay = 0 }: { delay?: number } = {}) => ({
    y: 0,
    opacity: 1,
    transition: { duration: 0.6, ease: 'easeOut', delay },
  }),
}

type RevealOnScrollProps = {
  children: ReactNode
  className?: string
  style?: CSSProperties
  delay?: number
  amount?: number
}

// Single fade+rise block, triggered once when it scrolls into view.
export function RevealOnScroll({ children, className, style, delay = 0, amount = 0.3 }: RevealOnScrollProps) {
  return (
    <motion.div
      className={className}
      style={style}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount }}
      variants={revealVariants}
      custom={{ delay }}
    >
      {children}
    </motion.div>
  )
}

type RevealGroupProps = {
  children: ReactNode
  className?: string
  style?: CSSProperties
  amount?: number
  // Default (120ms) sits in the common 80-150ms range for a cascading
  // reveal — below ~100ms consecutive items read as simultaneous instead of
  // sequential. Large grids (24 participant cards) still need a smaller
  // value passed in so the last item isn't left waiting seconds.
  staggerChildren?: number
}

// Wraps a grid/list of repeated items (participant cards, timeline rows).
// Children must be <RevealItem> — they inherit the "show" state from this
// parent's single viewport observer instead of each running their own.
export function RevealGroup({ children, className, style, amount = 0.15, staggerChildren = 0.12 }: RevealGroupProps) {
  const containerVariants: Variants = { hidden: {}, show: { transition: { staggerChildren } } }
  return (
    <motion.div className={className} style={style} initial="hidden" whileInView="show" viewport={{ once: true, amount }} variants={containerVariants}>
      {children}
    </motion.div>
  )
}

export function RevealItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div className={className} variants={revealVariants}>
      {children}
    </motion.div>
  )
}
