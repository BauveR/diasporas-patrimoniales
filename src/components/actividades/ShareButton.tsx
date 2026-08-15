import { useState } from 'react'

const labelStyle = { fontFamily: "'Open Sans', sans-serif" }

type Props = {
  url: string
  title: string
  text: string
}

export function ShareButton({ url, title, text }: Props) {
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url })
        return
      } catch (err) {
        // El usuario canceló el share sheet a propósito — no hacer nada más
        if (err instanceof Error && err.name === 'AbortError') return
        // Cualquier otro fallo (bug del navegador, contexto no soportado, etc.) cae a copiar el enlace
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* clipboard no disponible */ }
  }

  return (
    <button
      onClick={handleShare}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-stone-200 text-[10px] tracking-widest uppercase text-stone-500 hover:border-stone-400 hover:text-stone-800 transition-colors cursor-pointer shrink-0"
      style={labelStyle}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
        <path d="M8.6 13.5 15.4 17.5M15.4 6.5 8.6 10.5" />
      </svg>
      {copied ? 'Enlace copiado' : 'Compartir'}
    </button>
  )
}
