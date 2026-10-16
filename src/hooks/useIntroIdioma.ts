import { useEffect, useState } from 'react'
import { getIntroSuperCycle, type OrbTuning } from '../lib/introTuning'

// Mismo orden de idiomas que el wordmark de /intro (ES → FR → PT → EN).
export const INTRO_IDIOMAS = ['es', 'fr', 'pt', 'en'] as const
export const INTRO_IDIOMA_FADE_SECONDS = 0.6

// Reloj de idioma compartido por el badge y la franja de la frase en
// /intro: el tramo del superciclo en que se ven (de `visibleFromSeconds` a
// `visibleBeforeEndSeconds` antes del final, ver IntroCycleFade) se reparte
// en 4 partes iguales, una por idioma. Arranca al montar, igual que el fade
// CSS de IntroCycleFade, así que van a la par. `visible` baja a false
// durante el fundido corto de cada cambio.
export function useIntroIdioma(orbTuning: OrbTuning, visibleFromSeconds: number, visibleBeforeEndSeconds: number) {
  const [idioma, setIdioma] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const cycle = getIntroSuperCycle(orbTuning)
    const tramo = (cycle - visibleFromSeconds - visibleBeforeEndSeconds) / INTRO_IDIOMAS.length
    const inicio = performance.now()
    let actual = 0
    let timeout: ReturnType<typeof setTimeout> | undefined
    const id = setInterval(() => {
      const t = ((performance.now() - inicio) / 1000) % cycle
      const siguiente = Math.min(INTRO_IDIOMAS.length - 1, Math.max(0, Math.floor((t - visibleFromSeconds) / tramo)))
      if (siguiente === actual) return
      actual = siguiente
      setVisible(false)
      timeout = setTimeout(() => {
        setIdioma(siguiente)
        setVisible(true)
      }, INTRO_IDIOMA_FADE_SECONDS * 1000)
    }, 200)
    return () => {
      clearInterval(id)
      clearTimeout(timeout)
    }
  }, [orbTuning, visibleFromSeconds, visibleBeforeEndSeconds])

  return { lng: INTRO_IDIOMAS[idioma], visible }
}
