import { useTranslation } from 'react-i18next'
import { PROGRAMA_DIA_1, PROGRAMA_DIA_2 } from '../data/programa'
import { ProgramaTimeline } from './ProgramaTimeline'
import { SlideInText } from './SlideInText'
import { RevealOnScroll } from './RevealOnScroll'
import { labelStyle } from '../lib/styles'
import { DEFAULT_LOCALE, type Locale } from '../i18n/config'

// PDF del programa por idioma — alojados en Google Drive (compartidos como
// "cualquier persona con el enlace"). Se abren en el visor de Drive en una
// pestaña nueva.
const PROGRAMA_PDF: Record<Locale, string> = {
  es: 'https://drive.google.com/file/d/1Rb25GjzF5BJEdJdMfeY2fFGKcaMl5RG1/view?usp=sharing',
  en: 'https://drive.google.com/file/d/1B9a1HUEeFG__V64Mk3U8NvUzi1Rng62F/view?usp=sharing',
  fr: 'https://drive.google.com/file/d/14gpTI13WWrSnSg0vlIthqVZTGtBdeJih/view?usp=sharing',
  pt: 'https://drive.google.com/file/d/1gTrd4WkWTbbt0IDVFlyut6ReHGwLPlAB/view?usp=sharing',
}

export function ProgramaSection() {
  const { t, i18n } = useTranslation()
  const pdfHref = PROGRAMA_PDF[i18n.language as Locale] ?? PROGRAMA_PDF[DEFAULT_LOCALE]

  return (
    <section id="programa" className="scroll-mt-16 w-full bg-stone-900 px-10 py-24 sm:px-16 sm:py-32 lg:px-24 lg:py-40">
      <div className="mx-auto flex max-w-7xl flex-col gap-10">
        {/* Mismo grid 30/70 que AboutSection/InscripcionSection/
            ParticipantesSection: título y párrafo lado a lado desde lg:,
            apilados debajo de ese ancho. */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[30fr_70fr] lg:gap-16">
          <SlideInText
            text={t('programa.titulo')}
            revealOnScroll
            className="font-mattone text-fluid-title font-bold tracking-tight text-brand-red uppercase"
          />
          <RevealOnScroll>
            <p className="max-w-2xl text-sm leading-relaxed text-stone-300 md:text-base lg:text-lg" style={labelStyle}>
              {t('programa.parrafo')}
            </p>
            {/* Mismo estilo que el botón "Inscribirme" del hero. */}
            <a
              href={pdfHref}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-block w-fit rounded-full px-6 py-2.5 font-mattone text-xs font-bold tracking-widest text-white uppercase transition-opacity hover:opacity-80"
              style={{ backgroundColor: '#f04f23' }}
            >
              {t('programa.descargar')}
            </a>
          </RevealOnScroll>
        </div>

        {/* Dos líneas de tiempo, una por jornada — en columna en mobile/
            tablet, lado a lado desde `lg`. `dark`: recolorea horas/títulos a
            blanco para el nuevo fondo bg-stone-900 de la sección.
            `showDiaHeading`: a diferencia de los otros 2 llamadores de `dark`
            (ActividadExpandido/AmbosDiasExpandido, que ya muestran su propio
            badge de día), acá sigue haciendo falta el encabezado "Día 1/2".
            `chipsLight`: los chips de ponentes se quedan con el mismo gris
            claro de siempre en vez del translúcido que sí usan esos paneles. */}
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
          <ProgramaTimeline dia={t('programa.dia1')} items={PROGRAMA_DIA_1} dark showDiaHeading chipsLight />
          <ProgramaTimeline dia={t('programa.dia2')} items={PROGRAMA_DIA_2} dark showDiaHeading chipsLight />
        </div>
      </div>
    </section>
  )
}
