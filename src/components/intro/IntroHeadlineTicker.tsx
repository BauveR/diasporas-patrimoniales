import { useTranslation } from 'react-i18next'
import { INTRO_IDIOMA_FADE_SECONDS, type INTRO_IDIOMAS } from '../../hooks/useIntroIdioma'

// Segunda barra en scroll continuo, mismo patrón CSS-only que
// IntroTicker.tsx (2 grupos idénticos, translateX 0 ↔ -50%) pero en
// dirección contraria: el keyframe arranca en -50% y termina en 0 (en vez de
// 0 → -50%), así el texto entra por la izquierda y sale por la derecha,
// opuesto al ticker de abajo. Reemplaza al headline estático que había acá
// antes (párrafo con BreathingText) — ahora es otra línea en movimiento en
// vez de texto fijo.
//
// La frase va en el idioma que marca useIntroIdioma (lo lleva Intro.tsx,
// compartido con IntroLiveBadge): todas las copias cambian a la vez con un
// fundido corto, sin cortar el scroll. Textos: `hero.headline` de cada
// idioma, los mismos del hero del sitio.

const GROUP_COPIES = 4

// Apilada por encima de IntroTicker, con el mismo hueco de ~32px que
// tenían antes: la franja de abajo arranca a bottom-32 (128px) y mide ~68px
// en mobile; a sm:bottom-44 (176px) y ~78px desde sm. Ajustar acá si se
// mueve o cambia de tamaño esa franja.
const BOTTOM_OFFSET_CLASS = 'bottom-[228px] sm:bottom-[286px]'

const Separator = () => <span className="mx-10 text-white/40 sm:mx-14">·</span>

function HeadlineCopy({ texto }: { texto: string }) {
  return (
    <span className="inline-flex shrink-0 items-center whitespace-nowrap">
      <span>{texto}</span>
      <Separator />
    </span>
  )
}

function HeadlineGroup({ texto }: { texto: string }) {
  return (
    <span className="inline-flex shrink-0 items-center">
      {Array.from({ length: GROUP_COPIES }).map((_, i) => (
        <HeadlineCopy key={i} texto={texto} />
      ))}
    </span>
  )
}

export function IntroHeadlineTicker({ lng, visible }: { lng: (typeof INTRO_IDIOMAS)[number]; visible: boolean }) {
  const { t } = useTranslation()
  const texto = t('hero.headline', { lng })
  return (
    <div className={`pointer-events-none absolute inset-x-0 ${BOTTOM_OFFSET_CLASS} z-10 overflow-hidden px-8`}>
      <style>{`
        @keyframes intro-headline-scroll {
          from { transform: translateX(-50%); }
          to { transform: translateX(0); }
        }
        .intro-headline-track { animation: intro-headline-scroll 320s linear infinite; }
        @media (prefers-reduced-motion: reduce) {
          .intro-headline-track { animation: none; }
        }
      `}</style>
      <div className="transition-opacity" style={{ opacity: visible ? 1 : 0, transitionDuration: `${INTRO_IDIOMA_FADE_SECONDS}s` }}>
      <div className="intro-headline-track flex w-max font-mattone text-sm font-normal tracking-widest whitespace-nowrap text-white uppercase sm:text-base">
        <HeadlineGroup texto={texto} />
        <HeadlineGroup texto={texto} />
      </div>
      </div>
    </div>
  )
}
