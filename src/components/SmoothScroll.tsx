import { useEffect, useLayoutEffect, useRef } from 'react'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import { motion, useScroll } from 'framer-motion'

// Scroll suave del sitio (Lenis) + barra de progreso arriba del todo.
//
// Solo cambia cómo se siente el scroll de la ventana: la página sigue
// usando el scroll nativo (window.scrollY, `sticky`, anclas, lectores de
// pantalla), así que useScrollAlNavegar y scrollToSection funcionan igual
// que sin Lenis.
//  - Táctil sin tocar (syncTouch: false, el valor por defecto): en móvil,
//    y sobre todo dentro de Instagram/Facebook, el scroll sigue siendo el
//    del sistema.
//  - `allowNestedScroll`: la rueda sobre algo con scroll propio (tarjetas
//    desplegadas, modal de login, ficha de ponente) mueve ese elemento, no
//    la página — sin marcar cada uno con data-lenis-prevent.
//  - Sin Lenis con prefers-reduced-motion ni en /admin (tablas y
//    formularios: ahí prima la precisión).
// /intro no pasa por aquí: App la renderiza en su propia rama, sin esto.
export function SmoothScroll({ locationKey, enabled }: { locationKey: string; enabled: boolean }) {
  const lenisRef = useRef<Lenis | null>(null)

  useEffect(() => {
    if (!enabled || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const lenis = new Lenis({ autoRaf: true, allowNestedScroll: true })
    lenisRef.current = lenis
    return () => {
      lenis.destroy()
      lenisRef.current = null
    }
  }, [enabled])

  // Al navegar, se corta la inercia que quede de la rueda: si no, el salto
  // de useScrollAlNavegar (que corre justo después, en el layout effect de
  // App) quedaría pisado por la animación de Lenis hacia la posición vieja.
  useLayoutEffect(() => {
    const lenis = lenisRef.current
    if (!lenis) return
    lenis.stop()
    lenis.start()
  }, [locationKey])

  return <ScrollProgress />
}

// Línea fina en rojo de marca que crece con el scroll de la página.
function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[110] h-[2px] origin-left bg-brand-red"
      style={{ scaleX: scrollYProgress }}
    />
  )
}
