import logoGobCan from '../../assets/Logo_GobCan_claim_blanco_mod1-01.webp'
import logoCabildoTenerife from '../../assets/cabildo-de-tenerife [Converted]-01.webp'
import logoTEA from '../../assets/tenerife-espacio-de-las-artes [Converted]-01.webp'
import logoMuna from '../../assets/15-Logo-MUNA-Museos-de-Tenerife-Naturaleza-y-Arqueologia-750x750.webp'
import logoPatrimonioCultural from '../../assets/patrimonio cultural de canarias.webp'
import { useTranslation } from 'react-i18next'
import { INTRO_IDIOMAS, INTRO_IDIOMA_FADE_SECONDS } from '../../hooks/useIntroIdioma'

type Lng = (typeof INTRO_IDIOMAS)[number]

// Marquee CSS puro (2 grupos idénticos uno al lado del otro, animando
// translateX 0 → -50%) en vez del enfoque anterior (react-bits'
// ScrollVelocity adaptado, moviendo `baseX` a mano con
// useAnimationFrame + midiendo el ancho de una copia por JS/ResizeObserver):
// ese enfoque dependía de medir el ancho real ya con los logos cargados, y
// aun con ResizeObserver el loop seguía viéndose desincronizado (TEA
// encimándose con el "Simposio Internacional" del siguiente tramo). Acá no
// hace falta medir nada — al ser 2 grupos EXACTAMENTE iguales, -50% del
// ancho total del contenedor es, por definición, el ancho de un grupo, sin
// importar cuánto mida en píxeles ni cuándo terminen de cargar los logos.
// GROUP_COPIES repite el contenido varias veces dentro de cada grupo para
// que ni siquiera un monitor ultra-wide se quede sin contenido a la vista.
const GROUP_COPIES = 4

const Separator = () => <span className="mx-[33px] text-white/40 sm:mx-[44px]">·</span>

// "Simposio Internacional" en los 4 idiomas, al ritmo de useIntroIdioma
// (igual que el badge y la franja de la frase). Las 4 versiones van
// apiladas en la misma celda de grid y solo se ve la activa: el hueco mide
// siempre lo que la más larga, así el resto de la franja (logos incluidos)
// no salta al cambiar de idioma.
function Simposio({ lng, visible }: { lng: Lng; visible: boolean }) {
  const { t } = useTranslation()
  return (
    <span className="inline-grid">
      {INTRO_IDIOMAS.map((l) => (
        <span
          key={l}
          className="col-start-1 row-start-1 text-center transition-opacity"
          style={{ opacity: l === lng && visible ? 1 : 0, transitionDuration: `${INTRO_IDIOMA_FADE_SECONDS}s` }}
          aria-hidden={l !== lng}
        >
          {t('hero.simposio', { lng: l })}
        </span>
      ))}
    </span>
  )
}

function TickerCopy({ fecha, lng, visible }: { fecha: boolean; lng: Lng; visible: boolean }) {
  return (
    <span className="inline-flex shrink-0 items-center whitespace-nowrap">
      <Simposio lng={lng} visible={visible} />
      <Separator />
      {fecha && (
        <>
          <span>12 y 13 de noviembre de 2026</span>
          <Separator />
        </>
      )}
      <span>TEA, Santa Cruz de Tenerife</span>
      <Separator />
      <span className="inline-flex items-center gap-[33px] sm:gap-[44px]">
        {/* Mismos 5 logos, orden y proporciones que la fila del hero
            (PointsToShapes): alturas de allí en cqw escaladas a px tomando
            Cabildo como referencia, y luego toda la franja al 88% (−20%, +10%);
            después todos menos Patrimonio Cultural +25%. */}
        <img src={logoGobCan} alt="Gobierno de Canarias" width={556} height={322} className="h-[47px] w-auto object-contain sm:h-[56px]" />
        <img src={logoPatrimonioCultural} alt="Patrimonio Cultural de Canarias" width={700} height={350} className="h-[26px] w-auto object-contain sm:h-[31px]" />
        <img src={logoCabildoTenerife} alt="Cabildo de Tenerife" width={170} height={206} className="h-[36px] w-auto object-contain sm:h-[42px]" />
        <img src={logoTEA} alt="Tenerife Espacio de las Artes" width={473} height={237} className="h-[32px] w-auto object-contain sm:h-[40px]" />
        <img src={logoMuna} alt="MUNA — Museo de la Naturaleza y el Hombre" width={640} height={169} className="h-[24px] w-auto object-contain sm:h-[28px]" />
      </span>
      <Separator />
    </span>
  )
}

function TickerGroup({ fecha, lng, visible }: { fecha: boolean; lng: Lng; visible: boolean }) {
  return (
    <span className="inline-flex shrink-0 items-center">
      {Array.from({ length: GROUP_COPIES }).map((_, i) => (
        <TickerCopy key={i} fecha={fecha} lng={lng} visible={visible} />
      ))}
    </span>
  )
}

// `fecha`: el frame decide si se muestra (IntroLayout.fecha). `lng` y
// `visible`: idioma de "Simposio Internacional" (useIntroIdioma).
export function IntroTicker({ fecha = true, lng, visible }: { fecha?: boolean; lng: Lng; visible: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-32 z-20 overflow-hidden border-t border-white/10 bg-black/40 py-[17px] backdrop-blur-sm sm:bottom-44 sm:py-[22px]">
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
      <div className="intro-ticker-track flex w-max font-mattone text-[20px] font-bold tracking-widest whitespace-nowrap text-white uppercase sm:text-[22px]">
        <TickerGroup fecha={fecha} lng={lng} visible={visible} />
        <TickerGroup fecha={fecha} lng={lng} visible={visible} />
      </div>
    </div>
  )
}
