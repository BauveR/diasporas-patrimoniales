import { useTranslation } from 'react-i18next'
import { PARTICIPANTES, type Participante } from '../data/participantes'
import { SlideInText } from './SlideInText'
import { RevealOnScroll, RevealGroup, RevealItem } from './RevealOnScroll'

const labelStyle = { fontFamily: "'Open Sans', sans-serif" }

function ParticipanteCard({ nombre, cargo, foto }: Pick<Participante, 'nombre' | 'cargo' | 'foto'>) {
  return (
    <div className="group flex flex-col items-center text-center">
      <div className="mb-4 h-28 w-28 overflow-hidden rounded-full border border-transparent bg-stone-100 transition-colors duration-300 group-hover:border-[#9b2923] sm:h-32 sm:w-32">
        {foto ? (
          <img src={foto} alt={nombre} className="h-full w-full object-cover" />
        ) : (
          // Placeholder genérico — sin foto real todavía (ver participantes.ts).
          <div className="flex h-full w-full items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="h-12 w-12 text-stone-300">
              <circle cx="12" cy="8" r="3.2" />
              <path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6" />
            </svg>
          </div>
        )}
      </div>
      <h3 className="mb-1 text-sm font-semibold text-stone-800 transition-colors duration-300 group-hover:text-[#9b2923]" style={labelStyle}>
        {nombre}
      </h3>
      <span className="text-xs text-stone-400" style={labelStyle}>
        {cargo}
      </span>
    </div>
  )
}

export function ParticipantesSection() {
  const { t } = useTranslation()

  return (
    <section id="participantes" className="scroll-mt-16 w-full bg-stone-100 px-10 py-24 sm:px-16 sm:py-32 lg:px-24 lg:py-40">
      <div className="mx-auto flex max-w-7xl flex-col gap-10">
        <div className="flex flex-col gap-4">
          <SlideInText
            text={t('participantes.titulo')}
            revealOnScroll
            className="font-mattone text-3xl font-bold tracking-tight text-[#9b2923] uppercase md:text-4xl lg:text-5xl"
          />
          <RevealOnScroll>
            <p className="max-w-2xl text-base leading-relaxed text-stone-600 md:text-lg lg:text-xl" style={labelStyle}>
              {t('participantes.parrafo1')}
            </p>
          </RevealOnScroll>
        </div>

        {/* 24 entra parejo en 2/3/4/6 columnas — a diferencia de la
            plantilla de referencia (11 miembros), no hace falta el
            col-span/col-start manual que usaba para centrar una última fila
            incompleta. staggerChildren bajo (0.06) porque son 24 tarjetas:
            con el 0.12 por defecto la última no arrancaría hasta ~2.8s
            después de la primera; a 0.06 el total baja a ~1.4s. */}
        <RevealGroup
          className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
          amount={0.05}
          staggerChildren={0.06}
        >
          {PARTICIPANTES.map(p => (
            <RevealItem key={p.id}>
              <ParticipanteCard nombre={p.nombre} cargo={p.cargo} foto={p.foto} />
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  )
}
