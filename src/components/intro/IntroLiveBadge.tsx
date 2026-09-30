import { BreathingText } from './BreathingText'

// "Empezamos en unos minutos" — punto rojo parpadeante + texto respirando
// letra por letra, esquina superior derecha. Antes vivía dentro de una
// tarjeta "liquid glass" con línea/fecha/sede/logos debajo — esa parte se
// convirtió en IntroTicker.tsx (barra en scroll continuo abajo); acá sólo
// queda el indicador de "en vivo pronto".
export function IntroLiveBadge() {
  return (
    <div className="pointer-events-none absolute top-24 right-16 z-20 flex items-center gap-3 sm:top-28 sm:right-24">
      <style>{`
        @keyframes ilb-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.2; }
        }
        @media (prefers-reduced-motion: reduce) {
          .ilb-dot { animation: none !important; opacity: 1 !important; }
        }
      `}</style>
      <span
        className="ilb-dot h-3.5 w-3.5 shrink-0 rounded-full bg-red-500 shadow-[0_0_10px_4px_rgba(239,68,68,0.6)]"
        style={{ animation: 'ilb-blink 1.4s ease-in-out infinite' }}
      />
      <BreathingText
        className="font-mattone text-base font-bold tracking-widest whitespace-nowrap text-white uppercase sm:text-lg"
        staggerDuration={0.08}
        fromOpacity={0.7}
        fromScale={0.98}
        transition={{ duration: 1.4, ease: 'easeInOut' }}
      >
        Empezamos en unos minutos
      </BreathingText>
    </div>
  )
}
