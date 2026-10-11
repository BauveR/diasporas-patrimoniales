import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'
import { getLocaleFromPathname, localizePathname } from '../../i18n/routing'

// Segundos entre reenvíos: Firebase limita los envíos por cuenta y, sin
// espera, un doble clic gastaba el cupo y devolvía "demasiados intentos".
const ESPERA_REENVIO_S = 60

type Estado = 'inicial' | 'enviando' | 'enviado' | 'aunNo' | 'demasiados' | 'error'

// Aviso suave en Mi perfil para cuentas con contraseña sin verificar. No
// bloquea la inscripción (los filtros de correo institucionales a veces
// retrasan el enlace horas): solo recuerda verificar, permite reenviar y
// desaparece en cuanto Firebase la da por verificada — también al volver a
// esta pestaña tras pulsar el enlace en otra o en el móvil.
export function AvisoVerificacion() {
  const { t } = useTranslation()
  const { user, reenviarVerificacion, comprobarVerificacion } = useAuth()
  const location = useLocation()
  const [estado, setEstado] = useState<Estado>('inicial')
  const [espera, setEspera] = useState(0)

  const pendiente = !!user && user.conContrasena && !user.emailVerified

  useEffect(() => {
    if (espera <= 0) return
    const id = setTimeout(() => setEspera(s => s - 1), 1000)
    return () => clearTimeout(id)
  }, [espera])

  useEffect(() => {
    if (!pendiente) return
    const alVolver = () => {
      if (document.visibilityState === 'visible') comprobarVerificacion().catch(() => {})
    }
    document.addEventListener('visibilitychange', alVolver)
    return () => document.removeEventListener('visibilitychange', alVolver)
  }, [pendiente, comprobarVerificacion])

  if (!pendiente) return null

  const rutaPerfil = localizePathname('/perfil', getLocaleFromPathname(location.pathname))

  const reenviar = async () => {
    setEstado('enviando')
    try {
      await reenviarVerificacion(rutaPerfil)
      setEstado('enviado')
      setEspera(ESPERA_REENVIO_S)
    } catch (err) {
      setEstado((err as { code?: string }).code === 'auth/too-many-requests' ? 'demasiados' : 'error')
    }
  }

  const comprobar = async () => {
    try {
      const verificado = await comprobarVerificacion()
      if (!verificado) setEstado('aunNo')
    } catch {
      setEstado('error')
    }
  }

  const mensaje = {
    inicial: null,
    enviando: null,
    enviado: t('auth.verificacion.reenviado', { email: user.email }),
    aunNo: t('auth.verificacion.aunNo'),
    demasiados: t('auth.verificacion.demasiados'),
    error: t('auth.verificacion.error'),
  }[estado]

  const enlace = 'text-[11px] font-semibold tracking-widest uppercase underline underline-offset-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 disabled:no-underline'

  return (
    <div role="status" className="mb-8 flex flex-col gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
      <p className="font-mattone text-[11px] font-bold tracking-widest uppercase text-amber-900">
        {t('auth.verificacion.titulo')}
      </p>
      <p className="text-sm leading-relaxed text-stone-700">
        {t('auth.verificacion.texto', { email: user.email })}
      </p>
      <p className="text-xs text-stone-500">{t('auth.verificacion.noBloquea')}</p>
      {mensaje && (
        <p className={`text-xs ${estado === 'enviado' ? 'text-emerald-700' : 'text-red-600'}`}>{mensaje}</p>
      )}
      <div className="mt-1 flex flex-wrap gap-x-6 gap-y-2 text-amber-900">
        <button type="button" onClick={comprobar} className={enlace}>
          {t('auth.verificacion.yaVerifique')}
        </button>
        <button type="button" onClick={reenviar} disabled={estado === 'enviando' || espera > 0} className={enlace}>
          {estado === 'enviando'
            ? t('auth.verificacion.reenviando')
            : espera > 0
              ? t('auth.verificacion.reenviarEn', { s: espera })
              : t('auth.verificacion.reenviar')}
        </button>
      </div>
    </div>
  )
}
