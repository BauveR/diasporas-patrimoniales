// Segunda barra en scroll continuo, mismo patrón CSS-only que
// IntroTicker.tsx (2 grupos idénticos, translateX 0 ↔ -50%) pero en
// dirección contraria: el keyframe arranca en -50% y termina en 0 (en vez de
// 0 → -50%), así el texto entra por la izquierda y sale por la derecha,
// opuesto al ticker de abajo. Reemplaza al headline estático que había acá
// antes (párrafo con BreathingText) — ahora es otra línea en movimiento en
// vez de texto fijo.
const GROUP_COPIES = 4

// Apilado justo arriba de IntroTicker (bottom-20/py-[19px]/text-[22px] ≈
// 64px de alto mobile; bottom-28/py-[25px]/text-[25px] ≈ 80px sm) — mismo
// tipo de anclaje por abajo que esa barra, para quedar pegado a su borde
// superior sin gap. Ajustar acá si hace falta separarlos o reubicar esta.
const BOTTOM_OFFSET_CLASS = 'bottom-44 sm:bottom-56'

const Separator = () => <span className="mx-10 text-white/40 sm:mx-14">·</span>

function HeadlineCopy() {
  return (
    <span className="inline-flex shrink-0 items-center whitespace-nowrap">
      <span>Una mirada desde Canarias a la dispersión y restitución de los legados arqueológicos</span>
      <Separator />
    </span>
  )
}

function HeadlineGroup() {
  return (
    <span className="inline-flex shrink-0 items-center">
      {Array.from({ length: GROUP_COPIES }).map((_, i) => (
        <HeadlineCopy key={i} />
      ))}
    </span>
  )
}

export function IntroHeadlineTicker() {
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
      <div className="intro-headline-track flex w-max font-mattone text-base font-normal tracking-widest whitespace-nowrap text-white uppercase sm:text-xl">
        <HeadlineGroup />
        <HeadlineGroup />
      </div>
    </div>
  )
}
