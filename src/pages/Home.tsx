import { useEffect, useLayoutEffect } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import PointsToShapes from '../components/PointsToShapes'
import { MapSection } from '../components/map/MapSection'
import { SeoHead } from '../components/SeoHead'

const scrollPositions: Record<string, number> = {}

export function Home() {
  const location = useLocation()
  const navType = useNavigationType()
  const { t } = useTranslation()

  useLayoutEffect(() => {
    if (navType !== 'POP') return
    const saved = scrollPositions[location.key]
    if (saved !== undefined) window.scrollTo({ top: saved, behavior: 'instant' })
  }, [])

  useEffect(() => {
    if (!location.hash || navType === 'POP') return
    const id = location.hash.slice(1)
    const timer = setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    }, 260)
    return () => clearTimeout(timer)
  }, [location.hash, navType])

  useEffect(() => {
    const key = location.key
    const save = () => { scrollPositions[key] = window.scrollY }
    window.addEventListener('scroll', save, { passive: true })
    return () => window.removeEventListener('scroll', save)
  }, [location.key])

  return (
    <main className="pt-16">
      <SeoHead title={t('meta.homeTitle')} description={t('meta.homeDescription')} />
      <PointsToShapes />

      <section id="sedes" className="scroll-mt-16">
        <MapSection />
      </section>
    </main>
  )
}
