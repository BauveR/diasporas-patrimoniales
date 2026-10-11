import { useEffect, useRef, type RefObject } from 'react'

const ENFOCABLES = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

// Comportamiento de teclado de una ventana modal (patrón "dialog" de WAI-ARIA):
//  - al abrir, el foco entra en la ventana (en el contenedor, para que el
//    lector de pantalla lea el título; Tab lleva al primer control);
//  - Escape la cierra;
//  - Tab y Mayús+Tab dan la vuelta dentro sin escaparse a la página de
//    detrás (antes se podía tabular por toda la home con el login abierto);
//  - al cerrar, el foco vuelve a donde estaba (ej. el botón "Login").
// El contenedor necesita tabIndex={-1}, role="dialog" y aria-modal.
export function useDialogoModal(ref: RefObject<HTMLElement | null>, alCerrar: () => void) {
  // Ref y no dependencia del efecto: alCerrar suele ser una función nueva en
  // cada render y no tiene que reiniciar el foco cada vez.
  const alCerrarRef = useRef(alCerrar)
  useEffect(() => { alCerrarRef.current = alCerrar })

  useEffect(() => {
    const contenedor = ref.current
    if (!contenedor) return
    const anterior = document.activeElement as HTMLElement | null
    contenedor.focus({ preventScroll: true })

    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        alCerrarRef.current()
        return
      }
      if (e.key !== 'Tab') return
      const controles = Array.from(contenedor.querySelectorAll<HTMLElement>(ENFOCABLES))
      if (controles.length === 0) { e.preventDefault(); return }
      const primero = controles[0]
      const ultimo = controles[controles.length - 1]
      const activo = document.activeElement
      if (e.shiftKey && (activo === primero || activo === contenedor)) {
        e.preventDefault()
        ultimo.focus()
      } else if (!e.shiftKey && (activo === ultimo || !contenedor.contains(activo))) {
        e.preventDefault()
        primero.focus()
      }
    }

    document.addEventListener('keydown', alTeclear)
    return () => {
      document.removeEventListener('keydown', alTeclear)
      if (anterior && document.contains(anterior)) anterior.focus({ preventScroll: true })
    }
  }, [ref])
}
