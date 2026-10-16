import { BreathingText } from './BreathingText'
import { INTRO_IDIOMA_FADE_SECONDS, type INTRO_IDIOMAS } from '../../hooks/useIntroIdioma'

const TEXTOS: Record<(typeof INTRO_IDIOMAS)[number], string> = {
  es: 'Empezamos en unos minutos',
  fr: 'Nous commençons dans quelques minutes',
  pt: 'Começamos dentro de minutos',
  en: 'Starting in a few minutes',
}

// "Empezamos en unos minutos" — punto rojo parpadeante + texto respirando
// letra por letra, esquina superior derecha. Antes vivía dentro de una
// tarjeta "liquid glass" con línea/fecha/sede/logos debajo — esa parte se
// convirtió en IntroTicker.tsx (barra en scroll continuo abajo); acá sólo
// queda el indicador de "en vivo pronto".
//
// El texto pasa por los 4 idiomas del sitio al ritmo de useIntroIdioma
// (lo lleva Intro.tsx, compartido con IntroHeadlineTicker).
export function IntroLiveBadge({ lng, visible }: { lng: (typeof INTRO_IDIOMAS)[number]; visible: boolean }) {
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
      <span className="transition-opacity" style={{ opacity: visible ? 1 : 0, transitionDuration: `${INTRO_IDIOMA_FADE_SECONDS}s` }}>
        <BreathingText
          key={lng}
          className="font-mattone text-base font-bold tracking-widest whitespace-nowrap text-white uppercase sm:text-lg"
          staggerDuration={0.08}
          fromOpacity={0.7}
          fromScale={0.98}
          transition={{ duration: 1.4, ease: 'easeInOut' }}
        >
          {TEXTOS[lng]}
        </BreathingText>
      </span>
    </div>
  )
}
