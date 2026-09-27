// El check que antes solo vivía en el popup de confirmación de
// ActividadPage.tsx (InscripcionSuccessPopup, ya eliminado) — se reutiliza
// acá como la "palomita" de confirmación dentro de la propia tarjeta
// (BookingWidget), en vez de un popup aparte que había que cerrar.
// `chc-*` (nombres de las keyframes) quedan globales a propósito, igual que
// en el componente original: son las mismas en cada instancia, así que
// aunque el `<style>` se repita en el DOM si hay más de una tarjeta en
// pantalla, el CSS que inyecta es idéntico cada vez.
export function AnimatedCheckmark({ size = 28 }: { size?: number }) {
  return (
    <>
      <style>{`
        @keyframes chc-circle { to { stroke-dashoffset: 0; } }
        @keyframes chc-check  { to { stroke-dashoffset: 0; } }
        @media (prefers-reduced-motion: reduce) {
          .chc-circle-progress, .chc-check-path { animation: none !important; stroke-dashoffset: 0 !important; }
        }
      `}</style>
      <svg width={size} height={size} viewBox="0 0 96 96" fill="none" className="shrink-0">
        <circle cx="48" cy="48" r="44" stroke="rgba(255,255,255,0.25)" strokeWidth="5" />
        <circle
          className="chc-circle-progress"
          cx="48" cy="48" r="44"
          stroke="white" strokeWidth="5" strokeLinecap="round"
          strokeDasharray="277" strokeDashoffset="277"
          transform="rotate(-90 48 48)"
          style={{ animation: 'chc-circle 0.65s ease forwards' }}
        />
        <path
          className="chc-check-path"
          d="M28 48 L42 62 L70 30"
          stroke="white" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"
          strokeDasharray="65" strokeDashoffset="65"
          style={{ animation: 'chc-check 0.4s ease 0.55s forwards' }}
        />
      </svg>
    </>
  )
}
