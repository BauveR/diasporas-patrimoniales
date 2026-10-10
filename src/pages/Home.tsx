import { lazy, Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import PointsToShapes from '../components/PointsToShapes'
import { AboutSection } from '../components/AboutSection'
import { InscripcionSection } from '../components/InscripcionSection'
import { SeoHead } from '../components/SeoHead'

// Debajo del pliegue (nadie las ve sin scrollear) — separarlas del bundle
// principal deja que el navegador las baje en paralelo en vez de sumarlas
// al único archivo que hay que parsear antes de que el hero sea
// interactivo. AboutSection/InscripcionSection se quedan eager: están a un
// scroll mínimo del hero, no vale la pena el fallback en blanco por lo poco
// que se adelantarían.
const SedeSection = lazy(() => import('../components/SedeSection').then(m => ({ default: m.SedeSection })))
const ParticipantesSection = lazy(() => import('../components/ParticipantesSection').then(m => ({ default: m.ParticipantesSection })))
const ProgramaSection = lazy(() => import('../components/ProgramaSection').then(m => ({ default: m.ProgramaSection })))

export function Home() {
  const { t } = useTranslation()

  // La posición al volver atrás/adelante la restaura App
  // (hooks/useScrollAlNavegar.ts), igual para todas las páginas.

  return (
    <main className="pt-navbar">
      <SeoHead title={t('meta.homeTitle')} description={t('meta.homeDescription')} />
      <PointsToShapes />

      <AboutSection />

      <InscripcionSection />

      {/* fallback={null}, no un spinner: cada sección ya revela su propio
          contenido con scroll-reveal (RevealOnScroll/RevealGroup) apenas
          entra en pantalla — un spinner acá solo agregaría un parpadeo
          entre "nada" y "nada animándose todavía". Boundaries separados
          (no uno solo envolviendo las 3): que Sede tarde un poco más no
          debe bloquear a Participantes/Programa si ya están listas. */}
      <Suspense fallback={null}>
        <SedeSection />
      </Suspense>

      <Suspense fallback={null}>
        <ParticipantesSection />
      </Suspense>

      <Suspense fallback={null}>
        <ProgramaSection />
      </Suspense>
    </main>
  )
}
