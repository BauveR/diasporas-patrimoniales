import { useEffect, useRef, useState } from 'react'
import jsQR from 'jsqr'
import { acreditar, TokenInvalidoError } from '../../lib/db'

const labelStyle = { fontFamily: "'Open Sans', sans-serif" }

type Resultado =
  | { tipo: 'ok'; nombre: string }
  | { tipo: 'ya'; nombre: string; acreditadoEn: Date }
  | { tipo: 'invalido' }

const horaFormatter = new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit' })

// How long a just-decoded token is "locked out" from re-triggering acreditar()
// again — without this, a QR sitting in frame would re-fire on every single
// video frame (dozens of times a second) while the attendee holds their phone
// up to be scanned.
const RESCAN_LOCKOUT_MS = 2500

// No token per actividad needed here: the token itself already resolves to
// its actividad (see `_tokenIndex` in db.ts), so one scanner works for every
// event — no need to pick "which actividad am I checking in for" first.
export function AcreditarScanner() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const lastTokenRef = useRef<string | null>(null)
  const [camaraError, setCamaraError] = useState(false)
  const [resultado, setResultado] = useState<Resultado | null>(null)

  useEffect(() => {
    let stream: MediaStream | null = null
    let rafId = 0
    let cancelled = false

    async function handleToken(token: string) {
      try {
        const r = await acreditar(token)
        setResultado(
          r.yaAcreditado
            ? { tipo: 'ya', nombre: r.displayName, acreditadoEn: r.acreditadoEn }
            : { tipo: 'ok', nombre: r.displayName },
        )
      } catch (err) {
        if (!(err instanceof TokenInvalidoError)) throw err
        setResultado({ tipo: 'invalido' })
      }
      setTimeout(() => { lastTokenRef.current = null }, RESCAN_LOCKOUT_MS)
    }

    function tick() {
      const video = videoRef.current
      const canvas = canvasRef.current
      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
          const frame = ctx.getImageData(0, 0, canvas.width, canvas.height)
          const code = jsQR(frame.data, frame.width, frame.height)
          if (code?.data && code.data !== lastTokenRef.current) {
            lastTokenRef.current = code.data
            void handleToken(code.data)
          }
        }
      }
      rafId = requestAnimationFrame(tick)
    }

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        if (cancelled) {
          stream.getTracks().forEach(t => t.stop())
          return
        }
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }
        tick()
      } catch {
        setCamaraError(true)
      }
    }

    void start()

    return () => {
      cancelled = true
      cancelAnimationFrame(rafId)
      stream?.getTracks().forEach(t => t.stop())
    }
  }, [])

  return (
    <div className="flex flex-col items-center gap-5" style={labelStyle}>
      <div className="relative w-full max-w-sm aspect-square rounded-2xl overflow-hidden bg-stone-900">
        {camaraError ? (
          <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
            <p className="text-[11px] text-stone-300 tracking-widest uppercase">
              No se pudo acceder a la cámara. Revisá los permisos del navegador.
            </p>
          </div>
        ) : (
          <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {resultado && (
        <div
          className={`w-full max-w-sm rounded-2xl p-5 text-center ${
            resultado.tipo === 'ok' ? 'bg-green-50' : 'bg-red-50'
          }`}
        >
          {resultado.tipo === 'invalido' ? (
            <p className="text-[11px] tracking-widest uppercase text-red-500">Código no reconocido</p>
          ) : (
            <>
              <p className="text-sm text-stone-800 mb-1">{resultado.nombre}</p>
              <p className={`text-[11px] tracking-widest uppercase ${resultado.tipo === 'ya' ? 'text-red-500' : 'text-green-600'}`}>
                {resultado.tipo === 'ya' ? 'Denegado · QR ya usado' : 'Acreditado ✓'}
              </p>
              {resultado.tipo === 'ya' && (
                <p className="text-[10px] text-red-400 mt-1">
                  Entrada registrada a las {horaFormatter.format(resultado.acreditadoEn)}h — no dejar pasar de nuevo
                </p>
              )}
            </>
          )}
        </div>
      )}

      <p className="text-[10px] text-stone-400 text-center max-w-xs">
        Apuntá la cámara al código QR del asistente. Se acredita automáticamente al detectarlo.
      </p>
    </div>
  )
}
