import { useTranslation } from 'react-i18next'
import { IntroCanvas } from '../components/intro/IntroCanvas'
import { IntroWordmark } from '../components/intro/IntroWordmark'
import { SeoHead } from '../components/SeoHead'

// Chrome-less full-screen route (see App.tsx: /intro renders without Navbar/
// Footer). Just the animated particle background and the wordmark, centered.
// Spanish only for now; a dedicated language-transition animation for this
// version comes later, in IntroWordmark.
export function Intro() {
  const { t } = useTranslation()

  return (
    <div className="fixed inset-0 overflow-hidden bg-black">
      <SeoHead title={t('meta.homeTitle')} description={t('meta.homeDescription')} />
      <IntroCanvas />
      {/* Wordmark nudged right of centre — the particle shape sits left (see
          CAMERA_SHIFT_X in IntroCanvas). `translate-x-[16vw]` is the nudge:
          raise it to push further right, lower to bring it back toward centre. */}
      <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center p-8">
        <IntroWordmark className="h-auto w-[min(80vw,60rem)] translate-x-[16vw]" />
      </div>
    </div>
  )
}
