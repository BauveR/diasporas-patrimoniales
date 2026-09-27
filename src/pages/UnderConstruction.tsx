import logoDiasporas from '../assets/diasporas patrimoniales-04 2.png'
import ParticleText from '../components/ParticleText'
import { useIsDesktop } from '../hooks/useIsDesktop'

const labelStyle = { fontFamily: "'Open Sans', sans-serif" }

export function UnderConstruction() {
  const isDesktop = useIsDesktop()

  return (
    <main
      className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center sm:gap-3"
      style={{ background: 'linear-gradient(135deg, #000000 0%, #9b2923 55%, #f04f23 100%)' }}
    >
      <img src={logoDiasporas} alt="Diásporas Patrimoniales" className="h-24 w-auto object-contain sm:h-50.5" />

      <div className="flex w-full flex-col items-center gap-6">
        {isDesktop ? (
          <div className="h-40 w-full max-w-xl sm:h-48 sm:max-w-3xl md:h-56 md:max-w-4xl lg:h-64 lg:max-w-5xl">
            <ParticleText
              text="SITIO EN CONSTRUCCIÓN"
              color="#ffffff"
              highlightColor="#ffffff"
              fontSize="clamp(2rem, 9vw, 5.5rem)"
              fontWeight={800}
              fontFamily="'Open Sans', sans-serif"
              particleSize={2.2}
              density={2}
              scatter={45}
              gatherDuration={1600}
              stagger={420}
              pointerRepel={20}
              repelRadius={60}
              idleDrift={0.8}
              trigger="mount"
              glow
            />
          </div>
        ) : (
          // Same string, split across two shorter lines: at mobile widths a
          // single 22-character line forces the auto-fit font size (bounded
          // by container width) down small enough that individual particle
          // dots stop reading as letters. Two lines halve the longest word
          // count per line, so the width-bound floor lands much higher.
          <div className="flex w-full flex-col items-center">
            {['SITIO EN', 'CONSTRUCCIÓN'].map((line, index) => (
              <div key={line} className={`h-28 w-full max-w-xl ${index === 1 ? '-mt-6' : ''}`}>
                <ParticleText
                  text={line}
                  color="#ffffff"
                  highlightColor="#ffffff"
                  fontSize="clamp(2.5rem, 15vw, 4rem)"
                  fontWeight={800}
                  fontFamily="'Open Sans', sans-serif"
                  particleSize={1.4}
                  density={2}
                  scatter={25}
                  gatherDuration={1600}
                  stagger={420}
                  pointerRepel={20}
                  repelRadius={60}
                  idleDrift={0.8}
                  trigger="mount"
                  glow
                />
              </div>
            ))}
          </div>
        )}
        <p className="text-sm text-white/80 sm:-mt-10 sm:text-base md:-mt-12 lg:-mt-14" style={labelStyle}>
          Estamos trabajando en algo nuevo. Vuelve pronto.
        </p>
      </div>
    </main>
  )
}
