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

// `cargos`: solo lo pasa la versión completa (ProgramaSection, !dense) —
// ahí cada ponente se muestra como nombre + su cargo/afiliación debajo, en
// vez de la píldora chica de siempre (no entra un cargo de una línea en
// una píldora). La versión compacta (paneles de inscripción, dense) sigue
// exactamente igual que antes: solo píldoras con el nombre.
function ParticipantesChips({ participantes, cargos, dark, chipsLight }: { participantes: string[]; cargos?: string[]; dark: boolean; chipsLight: boolean }) {
  // Los 3 moderadores (Jorge Onrubia, Isaac Sastre, Jared Carballo) todavía
  // no tienen ficha propia en participantes.ts — sin match, el nombre queda
  // como texto plano en vez de un link roto.
  // chipsLight: ProgramaSection pasa esto en su fondo oscuro nuevo — el
  // texto/las píldoras se quedan con el mismo gris claro sólido de siempre
  // en vez de pasar al translúcido que sí usa el panel desplegado
  // (ActividadExpandido/AmbosDiasExpandido, dark sin chipsLight).
  const borderClass = dark && !chipsLight ? 'border-white/10' : 'border-stone-100'

  if (cargos) {
    const nameClass = dark && !chipsLight
      ? 'text-stone-200 hover:text-brand-orange'
      : 'text-stone-700 hover:text-brand-red'
    const cargoClass = dark && !chipsLight ? 'text-stone-400' : 'text-stone-500'
    return (
      <div className={`mt-3 flex flex-col gap-3 border-t pt-3 ${borderClass}`}>
        {participantes.map((nombre, i) => {
          const participante = findParticipante(nombre)
          const cargo = cargos[i]
          return (
            <div key={nombre}>
              {participante ? (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); scrollToParticipante(participante.id) }}
                  className={`cursor-pointer text-xs font-semibold underline decoration-dotted underline-offset-2 transition-colors ${nameClass}`}
                  style={labelStyle}
                >
                  {nombre}
                </button>
              ) : (
                <span className={`text-xs font-semibold ${dark && !chipsLight ? 'text-stone-200' : 'text-stone-700'}`} style={labelStyle}>
                  {nombre}
                </span>
              )}
              {cargo && (
                <p className={`mt-0.5 text-[11px] leading-snug ${cargoClass}`} style={labelStyle}>
                  {cargo}
                </p>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className={`mt-3 flex flex-wrap gap-2 border-t pt-3 ${borderClass}`}>
      {participantes.map((nombre) => {
        const participante = findParticipante(nombre)
        const chipClass = dark && !chipsLight
          ? 'bg-white/10 text-stone-200 hover:bg-white/15 hover:text-brand-orange'
          : 'bg-stone-100 text-stone-700 hover:bg-stone-200 hover:text-brand-red'
        return participante ? (
          <button
            key={nombre}
            type="button"
            onClick={(e) => { e.stopPropagation(); scrollToParticipante(participante.id) }}
            className={`inline-flex cursor-pointer items-center rounded-md px-2.5 py-1 text-xs underline decoration-dotted underline-offset-2 transition-colors ${chipClass}`}
            style={labelStyle}
          >
            {nombre}
          </button>
        ) : (
          <span
            key={nombre}
            className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs ${dark ? 'bg-white/10 text-stone-200' : 'bg-stone-100 text-stone-700'}`}
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
  dark,
  chipsLight,
}: {
  item: ProgramaItem
  expanded: boolean
  onToggle: (id: string) => void
  isLast: boolean
  moderadorLabel: string
  dense: boolean
  dark: boolean
  chipsLight: boolean
}) {
  const { t } = useTranslation()
  // La hora y el título vienen de programaItems.<id> en cada locale.json (el
  // documento fuente trae texto propio por idioma, incluido el formato de
  // hora: "08:45" en ES/EN, "08h45" en FR/PT) — item.hora/item.titulo de
  // programa.ts quedan solo como defaultValue por si falta la clave.
  const hora = t(`programaItems.${item.id}.hora`, { defaultValue: item.hora })
  const titulo = t(`programaItems.${item.id}.titulo`, { defaultValue: item.titulo })
  // Solo en la versión completa (ProgramaSection, !dense) — la versión
  // compacta embebida en el panel de inscripción se queda como estaba,
  // sin descripción, a pedido.
  const descripcion = dense ? undefined : t(`programaItems.${item.id}.descripcion`, { defaultValue: item.descripcion ?? '' }) || undefined
  // Mismo criterio que `descripcion`: solo en la versión completa.
  const participantesCargo = dense || !item.participantesCargo
    ? undefined
    : t(`programaItems.${item.id}.participantesCargo`, { returnObjects: true, defaultValue: item.participantesCargo }) as string[]
  const expandable = Boolean(item.moderador || item.participantes?.length || descripcion)
  const headerId = `programa-header-${item.id}`
  const contentId = `programa-content-${item.id}`
  const moderadorParticipante = item.moderador ? findParticipante(item.moderador) : undefined

  return (
    <div className="relative">
      {!isLast && <div className={`absolute top-5 bottom-0 left-[5px] w-px ${dark ? 'bg-white/10' : 'bg-stone-200'}`} />}
      <div className={`absolute top-1.5 left-0 h-[11px] w-[11px] rounded-full border-2 ${dark ? 'border-stone-600 bg-stone-900' : 'border-stone-300 bg-white'}`} />

      <div className={dense ? 'pb-3 pl-8' : 'pb-8 pl-8'}>
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
                  className={`mt-1 text-sm leading-snug font-semibold transition-colors ${dark ? 'text-white group-hover:text-brand-orange' : 'text-stone-800 group-hover:text-brand-red'}`}
                  style={labelStyle}
                >
                  {titulo}
                </h4>
                {item.moderador && (
                  <p className={`mt-1 text-xs ${dark ? 'text-stone-400' : 'text-stone-500'}`} style={labelStyle}>
                    {moderadorLabel}{' '}
                    {moderadorParticipante ? (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); scrollToParticipante(moderadorParticipante.id) }}
                        className={`cursor-pointer underline decoration-dotted underline-offset-2 transition-colors ${dark ? 'hover:text-brand-orange' : 'hover:text-brand-red'}`}
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
            {expanded && (descripcion || (item.participantes && item.participantes.length > 0)) && (
              <div id={contentId} role="region" aria-labelledby={headerId}>
                {descripcion && (
                  <p
                    className={`mt-3 border-t pt-3 text-xs leading-relaxed ${dark && !chipsLight ? 'border-white/10 text-stone-300' : 'border-stone-100 text-stone-600'}`}
                    style={labelStyle}
                  >
                    {descripcion}
                  </p>
                )}
                {item.participantes && item.participantes.length > 0 && (
                  <ParticipantesChips participantes={item.participantes} cargos={participantesCargo} dark={dark} chipsLight={chipsLight} />
                )}
              </div>
            )}
          </div>
        ) : (
          <div>
            <p className="text-[11px] tracking-widest text-stone-400 uppercase" style={labelStyle}>
              {hora}
            </p>
            <p className={`mt-1 text-sm ${dark ? 'text-stone-400' : 'text-stone-600'}`} style={labelStyle}>
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
// `dark`: the modern black-card treatment of ActividadExpandido/
// AmbosDiasExpandido — recolors every row for a dark surface.
// `showDiaHeading`: defaults to `!dark` (unchanged behavior for the two
// existing dark callers, which skip this component's own "Día X" heading
// since they already show a richer day badge — day + date — above it) but
// ProgramaSection overrides it back to `true`: its own dark surface (see
// bg-stone-900 on the section) still needs this heading, there's no other
// day badge in that context.
// `chipsLight`: ProgramaSection also overrides this — its ParticipantesChips
// (the ponente pills) keep the plain light-gray look even on the dark
// surface, instead of the translucent-on-dark style the embedded panels use.
export function ProgramaTimeline({
  dia, items, dense = false, dark = false, showDiaHeading = !dark, chipsLight = false,
}: {
  dia: string
  items: ProgramaItem[]
  dense?: boolean
  dark?: boolean
  showDiaHeading?: boolean
  chipsLight?: boolean
}) {
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
      {showDiaHeading && (
        <RevealOnScroll>
          <h3 className={`font-mattone text-lg font-bold tracking-tight text-brand-orange uppercase ${dense ? 'mb-3' : 'mb-6'}`}>{dia}</h3>
        </RevealOnScroll>
      )}
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
              dark={dark}
              chipsLight={chipsLight}
            />
          </RevealItem>
        ))}
      </RevealGroup>
    </div>
  )
}
