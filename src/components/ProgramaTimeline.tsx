import { memo, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ProgramaItem } from '../data/programa'
import { RevealOnScroll, RevealGroup, RevealItem } from './RevealOnScroll'

// Adaptado del componente "ProfessionalTimeline" que pasó el usuario:
// - Sin dark mode (el sitio no lo tiene) y paleta slate-* → stone-*/rojo
//   institucional (#9b2923) para el contenido de cada fila. Solo el
//   encabezado de jornada ("Día 1"/"Día 2") usa el naranja del botón
//   "Inscribirme" (#f04f23), como acento puntual.
// - Sin el par icono+badge "type/duration" del original (pensado para un CV):
//   acá la hora ES el dato principal, así que va donde antes iban esos
//   badges.
// - Solo las filas con moderador/a o participantes son expandibles (paneles);
//   las de solo trámite (pausas, recepción) se muestran directo, sin chevron
//   ni click, porque no tienen nada que expandir.
// - Colapsado por defecto (el original expandía todo): con ~12 filas por día
//   acá, mostrar todo abierto de entrada sería una pared de texto.

const labelStyle = { fontFamily: "'Open Sans', sans-serif" }

const ChevronDown = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
)

function ParticipantesChips({ participantes }: { participantes: string[] }) {
  return (
    <div className="mt-3 flex flex-wrap gap-2 border-t border-stone-100 pt-3">
      {participantes.map((nombre) => (
        <span
          key={nombre}
          className="inline-flex items-center rounded-md bg-stone-100 px-2.5 py-1 text-xs text-stone-700"
          style={labelStyle}
        >
          {nombre}
        </span>
      ))}
    </div>
  )
}

const TimelineRow = memo(function TimelineRow({
  item,
  expanded,
  onToggle,
  isLast,
  moderadorLabel,
}: {
  item: ProgramaItem
  expanded: boolean
  onToggle: (id: string) => void
  isLast: boolean
  moderadorLabel: string
}) {
  const { t } = useTranslation()
  // La hora y el título vienen de programaItems.<id> en cada locale.json (el
  // documento fuente trae texto propio por idioma, incluido el formato de
  // hora: "08:45" en ES/EN, "08h45" en FR/PT) — item.hora/item.titulo de
  // programa.ts quedan solo como defaultValue por si falta la clave.
  const hora = t(`programaItems.${item.id}.hora`, { defaultValue: item.hora })
  const titulo = t(`programaItems.${item.id}.titulo`, { defaultValue: item.titulo })
  const expandable = Boolean(item.moderador || item.participantes?.length)
  const headerId = `programa-header-${item.id}`
  const contentId = `programa-content-${item.id}`

  return (
    <div className="relative">
      {!isLast && <div className="absolute top-5 bottom-0 left-[5px] w-px bg-stone-200" />}
      <div className="absolute top-1.5 left-0 h-[11px] w-[11px] rounded-full border-2 border-stone-300 bg-white" />

      <div className="pb-8 pl-8">
        {expandable ? (
          <button
            id={headerId}
            onClick={() => onToggle(item.id)}
            aria-expanded={expanded}
            aria-controls={contentId}
            className="group w-full cursor-pointer text-left"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] tracking-widest text-stone-400 uppercase" style={labelStyle}>
                  {hora}
                </p>
                <h4
                  className="mt-1 text-sm leading-snug font-semibold text-stone-800 transition-colors group-hover:text-[#9b2923]"
                  style={labelStyle}
                >
                  {titulo}
                </h4>
                {item.moderador && (
                  <p className="mt-1 text-xs text-stone-500" style={labelStyle}>
                    {moderadorLabel} {item.moderador}
                  </p>
                )}
              </div>
              <ChevronDown
                className={`mt-1 h-4 w-4 shrink-0 text-stone-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
              />
            </div>
            {expanded && item.participantes && item.participantes.length > 0 && (
              <div id={contentId} role="region" aria-labelledby={headerId}>
                <ParticipantesChips participantes={item.participantes} />
              </div>
            )}
          </button>
        ) : (
          <div>
            <p className="text-[11px] tracking-widest text-stone-400 uppercase" style={labelStyle}>
              {hora}
            </p>
            <p className="mt-1 text-sm text-stone-600" style={labelStyle}>
              {titulo}
            </p>
          </div>
        )}
      </div>
    </div>
  )
})

export function ProgramaTimeline({ dia, items }: { dia: string; items: ProgramaItem[] }) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set())

  const onToggle = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  return (
    <div>
      {/* Plain RevealOnScroll (not SlideInText) here: SlideInText always
          renders an <h2>, which would break the h2 (section title) → h3
          (day header) heading hierarchy the rest of the page follows. */}
      <RevealOnScroll>
        <h3 className="font-mattone mb-6 text-lg font-bold tracking-tight text-[#f04f23] uppercase">{dia}</h3>
      </RevealOnScroll>
      <RevealGroup amount={0.05} staggerChildren={0.08}>
        {items.map((item, i) => (
          <RevealItem key={item.id}>
            <TimelineRow
              item={item}
              expanded={expanded.has(item.id)}
              onToggle={onToggle}
              isLast={i === items.length - 1}
              moderadorLabel={t('programa.moderador')}
            />
          </RevealItem>
        ))}
      </RevealGroup>
    </div>
  )
}
