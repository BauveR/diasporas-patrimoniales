import logoGobCan from '../../assets/Logo_GobCan_claim_blanco_mod1-01.png'
import logoCabildoTenerife from '../../assets/cabildo-de-tenerife [Converted]-01.png'
import logoTEA from '../../assets/tenerife-espacio-de-las-artes [Converted]-01.png'
import logoMuna from '../../assets/15-Logo-MUNA-Museos-de-Tenerife-Naturaleza-y-Arqueologia-750x750.png'
import { BreathingText } from './BreathingText'

// Tarjeta "Empezamos en unos minutos" — su propia capa (ver z-20 en
// Intro.tsx, por encima del wordmark z-10 y el canvas del orb), así su
// tamaño/posición se ajustan acá sin tocar ni los vectores ni el orb.
// Ancla: subida desde abajo, centrada con el vector (no con el viewport) —
// mover con `BOTTOM_OFFSET_CLASS`/`HORIZONTAL_CENTER_SHIFT_CLASS` de abajo
// si hace falta reubicarla.
const BOTTOM_OFFSET_CLASS = 'bottom-28 sm:bottom-36'
// El pan de cámara (CAMERA_SHIFT_X en IntroCanvas.tsx) corre el vector a la
// izquierda del centro del viewport; el wordmark lo compensa nudgeándose a
// la derecha con `translate-x-[16vw]` (ver Intro.tsx). Mismo valor,
// espejado, para centrar esta tarjeta con el vector en vez de con la
// pantalla entera.
const HORIZONTAL_CENTER_SHIFT_CLASS = 'translate-x-[16vw]'

export function IntroLiveBadge() {
  return (
    <div className={`pointer-events-none absolute inset-x-0 ${BOTTOM_OFFSET_CLASS} z-20 flex justify-center px-4`}>
      <style>{`
        @keyframes ilb-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.2; }
        }
        @media (prefers-reduced-motion: reduce) {
          .ilb-dot { animation: none !important; opacity: 1 !important; }
        }
      `}</style>
      {/* "Liquid glass": negro al 60% + blur, borde tenue para el filo de
          vidrio, sombra suave para que flote sobre el fondo del orb.
          rounded-3xl en vez de rounded-full: con la línea/segundo bloque de
          texto/logos ya no es una sola fila, es una tarjeta. */}
      {/* w-fit (no w-full/max-w-md fijo): la tarjeta crece al ancho que le
          pida su fila más ancha, en vez de forzar un ancho fijo que hacía
          envolver "Empezamos en unos minutos" a 2 líneas. max-w-[92vw] es
          solo el tope de seguridad en mobile. */}
      <div className={`flex w-fit max-w-[92vw] flex-col items-center gap-5 rounded-[67px] border border-white/15 bg-black/20 px-24 py-6 shadow-lg backdrop-blur-md sm:gap-6 ${HORIZONTAL_CENTER_SHIFT_CLASS}`}>
        <div className="mt-2 flex items-center gap-5 self-start sm:gap-7">
          <span
            className="ilb-dot h-[19px] w-[19px] shrink-0 rounded-full bg-red-500 shadow-[0_0_13px_5px_rgba(239,68,68,0.6)]"
            style={{ animation: 'ilb-blink 1.4s ease-in-out infinite' }}
          />
          <BreathingText
            className="font-mattone text-2xl font-bold tracking-widest whitespace-nowrap text-white uppercase sm:text-3xl"
            staggerDuration={0.08}
            transition={{ duration: 1.4, ease: 'easeInOut' }}
          >
            Empezamos en unos minutos
          </BreathingText>
        </div>

        <div className="h-px w-full bg-white/20" />

        {/* ml-10/sm:ml-12 = ancho del punto (19px) + su gap (gap-5=20px /
            gap-7=28px) de la fila de arriba — así el borde izquierdo de
            "Simposio Internacional" queda exactamente debajo de la "E" de
            "Empezamos", no del punto rojo. */}
        <div className="ml-10 self-start text-left text-white sm:ml-12">
          <p className="font-mattone text-[20px] leading-snug font-bold tracking-widest uppercase sm:text-[23px]" style={{ color: '#f28941' }}>
            Simposio Internacional
          </p>
          <p className="mt-1 text-[20px] leading-snug font-bold tracking-widest uppercase sm:text-[23px]">
            12 y 13 de noviembre de 2026
            <br />
            <span className="font-normal">TEA, Santa Cruz de Tenerife</span>
          </p>
        </div>

        <div className="ml-10 flex flex-wrap items-center justify-start gap-5 self-start sm:ml-12 sm:gap-7">
          <img src={logoGobCan} alt="Gobierno de Canarias" width={556} height={322} className="h-[50px] w-auto object-contain sm:h-[62px]" />
          <img src={logoCabildoTenerife} alt="Cabildo de Tenerife" width={170} height={206} className="h-[43px] w-auto object-contain sm:h-[56px]" />
          <img src={logoTEA} alt="Tenerife Espacio de las Artes" width={473} height={237} className="ml-6 h-[37px] w-auto object-contain sm:h-[50px]" />
          <img src={logoMuna} alt="MUNA — Museo de la Naturaleza y el Hombre" width={640} height={169} className="h-[31px] w-auto object-contain sm:h-[43px]" />
        </div>
      </div>
    </div>
  )
}
