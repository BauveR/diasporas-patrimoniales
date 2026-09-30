import logoGobCan from '../../assets/Logo_GobCan_claim_blanco_mod1-01.png'
import logoCabildoTenerife from '../../assets/cabildo-de-tenerife [Converted]-01.png'
import logoTEA from '../../assets/tenerife-espacio-de-las-artes [Converted]-01.png'
import logoMuna from '../../assets/15-Logo-MUNA-Museos-de-Tenerife-Naturaleza-y-Arqueologia-750x750.png'

// Marquee CSS puro (2 grupos idénticos uno al lado del otro, animando
// translateX 0 → -50%) en vez del enfoque anterior (react-bits'
// ScrollVelocity adaptado, moviendo `baseX` a mano con
// useAnimationFrame + midiendo el ancho de una copia por JS/ResizeObserver):
// ese enfoque dependía de medir el ancho real ya con los 4 logos cargados, y
// aun con ResizeObserver el loop seguía viéndose desincronizado (TEA
// encimándose con el "Simposio Internacional" del siguiente tramo). Acá no
// hace falta medir nada — al ser 2 grupos EXACTAMENTE iguales, -50% del
// ancho total del contenedor es, por definición, el ancho de un grupo, sin
// importar cuánto mida en píxeles ni cuándo terminen de cargar los logos.
// GROUP_COPIES repite el contenido varias veces dentro de cada grupo para
// que ni siquiera un monitor ultra-wide se quede sin contenido a la vista.
const GROUP_COPIES = 4

const Separator = () => <span className="mx-[38px] text-white/40 sm:mx-[50px]">·</span>

function TickerCopy() {
  return (
    <span className="inline-flex shrink-0 items-center whitespace-nowrap">
      <span>Simposio Internacional</span>
      <Separator />
      <span>12 y 13 de noviembre de 2026</span>
      <Separator />
      <span>TEA, Santa Cruz de Tenerife</span>
      <Separator />
      <span className="inline-flex items-center gap-[38px] sm:gap-[50px]">
        <img src={logoGobCan} alt="Gobierno de Canarias" width={556} height={322} className="h-[38px] w-auto object-contain sm:h-[44px]" />
        <img src={logoCabildoTenerife} alt="Cabildo de Tenerife" width={170} height={206} className="h-8 w-auto object-contain sm:h-[38px]" />
        <img src={logoTEA} alt="Tenerife Espacio de las Artes" width={473} height={237} className="h-8 w-auto object-contain sm:h-[38px]" />
        <img src={logoMuna} alt="MUNA — Museo de la Naturaleza y el Hombre" width={640} height={169} className="h-[25px] w-auto object-contain sm:h-8" />
      </span>
      <Separator />
    </span>
  )
}

function TickerGroup() {
  return (
    <span className="inline-flex shrink-0 items-center">
      {Array.from({ length: GROUP_COPIES }).map((_, i) => (
        <TickerCopy key={i} />
      ))}
    </span>
  )
}

export function IntroTicker() {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-20 z-20 overflow-hidden border-t border-white/10 bg-black/40 py-[19px] backdrop-blur-sm sm:bottom-28 sm:py-[25px]">
      <style>{`
        @keyframes intro-ticker-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .intro-ticker-track { animation: intro-ticker-scroll 380s linear infinite; }
        @media (prefers-reduced-motion: reduce) {
          .intro-ticker-track { animation: none; }
        }
      `}</style>
      <div className="intro-ticker-track flex w-max font-mattone text-[22px] font-bold tracking-widest whitespace-nowrap text-white uppercase sm:text-[25px]">
        <TickerGroup />
        <TickerGroup />
      </div>
    </div>
  )
}
