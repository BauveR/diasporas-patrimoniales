// Scroll suave a una sección de Home (#sedes, #participantes, #programa)
// que aguanta los dos problemas reales de esta página:
//  - Participantes/Programa son lazy (Home.tsx): justo después de navegar,
//    el elemento puede todavía no existir → se reintenta hasta que aparezca.
//  - Mientras el scroll suave está en curso, imágenes lazy y bloques con
//    RevealOnScroll de más arriba terminan de cargar y empujan la sección
//    hacia abajo, así que el scroll "llega" a donde estaba la sección, no a
//    donde está → cuando se asienta se vuelve a medir y se corrige.
// Si la persona scrollea a mano en el medio, se deja de corregir.
// Devuelve una función de limpieza (para el cleanup de un useEffect).
export function scrollToSection(id: string): () => void {
  let cancelled = false
  const timers: ReturnType<typeof setTimeout>[] = []
  const later = (fn: () => void, ms: number) => { timers.push(setTimeout(fn, ms)) }

  const cancel = () => {
    cancelled = true
    timers.forEach(clearTimeout)
    window.removeEventListener('wheel', cancel)
    window.removeEventListener('touchstart', cancel)
  }
  window.addEventListener('wheel', cancel, { passive: true })
  window.addEventListener('touchstart', cancel, { passive: true })

  // Respeta el scroll-margin-top de la sección (ej. `scroll-mt-16` de
  // InscripcionSection), igual que lo haría scrollIntoView.
  const targetTop = (el: HTMLElement) => {
    const margin = parseFloat(getComputedStyle(el).scrollMarginTop) || 0
    const top = el.getBoundingClientRect().top + window.scrollY - margin
    const maxTop = document.documentElement.scrollHeight - window.innerHeight
    return Math.max(0, Math.min(top, maxTop))
  }

  let waits = 0
  let corrections = 0

  const check = (el: HTMLElement) => {
    if (cancelled) return
    const top = targetTop(el)
    if (Math.abs(top - window.scrollY) <= 4 || corrections++ >= 4) return cancel()
    window.scrollTo({ top, behavior: 'smooth' })
    later(() => check(el), 700)
  }

  const start = () => {
    if (cancelled) return
    const el = document.getElementById(id)
    if (!el) {
      if (waits++ < 30) later(start, 100)
      else cancel()
      return
    }
    window.scrollTo({ top: targetTop(el), behavior: 'smooth' })
    later(() => check(el), 900)
  }

  start()
  return cancel
}
