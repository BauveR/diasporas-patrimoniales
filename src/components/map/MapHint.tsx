import { useState } from 'react'

type Props = {
  visible: boolean
  active: boolean
}

export function MapHint({ visible, active }: Props) {
  const [dismissed, setDismissed] = useState(false)

  // Permanently dismiss the first time `active` becomes true — adjusted
  // directly during render (React's documented pattern) instead of in an
  // effect, guarded by `!dismissed` so it only ever fires once.
  if (active && !dismissed) setDismissed(true)

  if (dismissed || !visible) return null

  return (
    <div className="absolute inset-0 z-[1000] pointer-events-none flex items-center justify-center">
      <div className="absolute inset-0 bg-white/20 backdrop-blur-[1.5px]" />
      <div className="relative flex flex-col items-center gap-3">
        <span className="block w-3 h-3 rounded-full bg-stone-500 animate-pulse" />
        <span
          className="text-[10px] tracking-widest uppercase text-stone-500"
          style={{ fontFamily: "'Open Sans', sans-serif" }}
        >
          Click para activar
        </span>
      </div>
    </div>
  )
}
