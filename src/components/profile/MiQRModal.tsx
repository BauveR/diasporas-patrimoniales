import { createPortal } from 'react-dom'
import { QRCodeSVG } from 'qrcode.react'

const labelStyle = { fontFamily: "'Open Sans', sans-serif" }

type Props = {
  token: string
  titulo: string
  onClose: () => void
}

// Portal to document.body with z-[9999] — same convention the sede drawer
// uses, to sit above the rest of the app's stacking contexts.
export function MiQRModal({ token, titulo, onClose }: Props) {
  return createPortal(
    <div
      className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-6"
      onClick={onClose}
      style={labelStyle}
    >
      <div
        className="bg-white rounded-2xl p-8 flex flex-col items-center gap-4 max-w-xs w-full"
        onClick={e => e.stopPropagation()}
      >
        <p className="text-[10px] tracking-widest uppercase text-stone-400 text-center">Tu entrada</p>
        <p className="text-sm text-stone-800 text-center line-clamp-2">{titulo}</p>
        <div className="p-3 border border-stone-100 rounded-xl">
          <QRCodeSVG value={token} size={200} level="M" />
        </div>
        <p className="text-[10px] text-stone-400 text-center">
          Mostrá este código en la entrada para acreditarte
        </p>
        <button
          onClick={onClose}
          className="mt-2 w-full py-2.5 rounded-xl border border-stone-200 text-[11px] tracking-widest uppercase text-stone-500 hover:bg-stone-50 transition-colors cursor-pointer"
        >
          Cerrar
        </button>
      </div>
    </div>,
    document.body,
  )
}
