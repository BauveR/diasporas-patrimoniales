import { memo, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ProgramaItem } from '../data/programa'
import { findParticipante, participanteAnchorId } from '../data/participantes'
import { RevealOnScroll, RevealGroup, RevealItem } from './RevealOnScroll'

// Adaptado del componente "ProfessionalTimeline" que pasó el usuario:
// - Sin dark mode (el sitio no lo tiene) y paleta slate-* → stone-*/rojo
//   institucional (brand-red, token de @theme) para el contenido de cada
//   fila. Solo el encabezado de jornada ("Día 1"/"Día 2") usa el naranja
//   del botón "Inscribirme" (brand-orange), como acento puntual.
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

// Lleva a la ficha del nombre clickeado en la sección Participantes — solo
// funciona si esa sección está montada en la página actual (Home): hoy este
// panel también se abre embebido desde Perfil y desde la página completa de
// una actividad, donde Participantes no existe, así que ahí el clic no
// encuentra el elemento y no hace nada en silencio. Llevar ese caso a una
// navegación real de vuelta a Home queda para una iteración aparte.
function scrollToParticipante(id: number) {
  const el = document.getElementById(participanteAnchorId(id))
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  el.classList.add('ring-4', 'ring-brand-red', 'ring-offset-2')
  window.setTimeout(() => el.classList.remove('ring-4', 'ring-brand-red', 'ring-offset-2'), 1400)
}

function ParticipantesChips({ participantes }: { participantes: string[] }) {
  return (
    <div className="mt-3 flex flex-wrap gap-2 border-t border-stone-100 pt-3">
      {participantes.map((nombre) => {
        // Los 3 moderadores (Jorge Onrubia, Isaac Sastre, Jared Carballo)
        // todavía no tienen ficha propia en participantes.ts — sin match,
        // el nombre queda como texto plano en vez de un link roto.
        const participante = findParticipante(nombre)
        return participante ? (
          <button
            key={nombre}
            type="button"
            onClick={(e) => { e.stopPropagation(); scrollToParticipante(participante.id) }}
            className="inline-flex cursor-pointer items-center rounded-md bg-stone-100 px-2.5 py-1 text-xs text-stone-700 underline decoration-dotted underline-offset-2 transition-colors hover:bg-stone-200 hover:text-brand-red"
            style={labelStyle}
          >
            {nombre}
          </button>
        ) : (
          <span
            key={nombre}
            className="inline-flex items-center rounded-md bg-stone-100 px-2.5 py-1 text-xs text-stone-700"
            style={labelStyle}
          >
            {nombre}
          </span>
        )
      })}
    </div>
  )
}

const TimelineRow = memo(function TimelineRow({
  item,
  expanded,
  onToggle,
  isLast,
  moderadorLabel,
  dense,
}: {
  item: ProgramaItem
  expanded: boolean
  onToggle: (id: string) => void
  isLast: boolean
  moderadorLabel: string
  dense: boolean
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
  const moderadorParticipante = item.moderador ? findParticipante(item.moderador) : undefined

  return (
    <div className="relative">
      {!isLast && <div className="absolute top-5 bottom-0 left-[5px] w-px bg-stone-200" />}
      <div className="absolute top-1.5 left-0 h-[11px] w-[11px] rounded-full border-2 border-stone-300 bg-white" />

      <div className={dense ? 'pb-1 pl-8' : 'pb-8 pl-8'}>
        {expandable ? (
          // `role="button"` sobre un `div`, no un `<button>` real: el nombre
          // del moderador y los chips de participantes de abajo son ahora
          // ellos mismos botones clickeables (llevan a su ficha en
          // Participantes) — anidar un <button> real dentro de otro <button>
          // es HTML inválido. `onKeyDown` recupera la activación por
          // teclado (Enter/Espacio) que un <button> nativo da gratis.
          <div
            id={headerId}
            role="button"
            tabIndex={0}
            onClick={() => onToggle(item.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onToggle(item.id)
              }
            }}
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
                  className="mt-1 text-sm leading-snug font-semibold text-stone-800 transition-colors group-hover:text-brand-red"
                  style={labelStyle}
                >
                  {titulo}
                </h4>
                {item.moderador && (
                  <p className="mt-1 text-xs text-stone-500" style={labelStyle}>
                    {moderadorLabel}{' '}
                    {moderadorParticipante ? (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); scrollToParticipante(moderadorParticipante.id) }}
                        className="cursor-pointer underline decoration-dotted underline-offset-2 transition-colors hover:text-brand-red"
                      >
                        {item.moderador}
                      </button>
                    ) : (
                      item.moderador
                    )}
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
          </div>
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

// `dense`: used by ActividadExpandido (the registration panel) to fit the
// whole day's agenda without needing its own scroll — half the row spacing
// (pb-8→pb-4) and a tighter heading margin. Defaults to false so the actual
// Programa section (ProgramaSection.tsx) keeps its normal, more relaxed
// spacing; only the embedded copy needs to be tight.
export function ProgramaTimeline({ dia, items, dense = false }: { dia: string; items: ProgramaItem[]; dense?: boolean }) {
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
        <h3 className={`font-mattone text-lg font-bold tracking-tight text-brand-orange uppercase ${dense ? 'mb-3' : 'mb-6'}`}>{dia}</h3>
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
              dense={dense}
            />
          </RevealItem>
        ))}
      </RevealGroup>
    </div>
  )
}
