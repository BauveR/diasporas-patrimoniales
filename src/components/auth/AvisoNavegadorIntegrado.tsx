import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { enlaceAbrirEnChrome, type NavegadorIntegrado } from '../../utils/navegadorIntegrado'

// Aviso del login dentro del navegador de una app (ver
// utils/navegadorIntegrado.ts): cómo abrir la página en Safari/Chrome — con
// botón directo en Android y "Copiar enlace" en todos — y que el email con
// contraseña sí funciona aquí mismo, para no dejar a nadie sin salida.
export function AvisoNavegadorIntegrado({ nav }: { nav: NavegadorIntegrado }) {
  const { t } = useTranslation()
  const [copiado, setCopiado] = useState<'no' | 'si' | 'manual'>('no')
  const urlRef = useRef<HTMLInputElement>(null)
  const url = window.location.href

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopiado('si')
    } catch {
      // Algunas WebViews no dejan usar el portapapeles: se muestra el enlace
      // seleccionado para copiarlo a mano.
      setCopiado('manual')
      requestAnimationFrame(() => urlRef.current?.select())
    }
  }

  const boton = 'rounded-lg px-3 py-2 text-[11px] font-semibold tracking-widest uppercase cursor-pointer transition-colors'

  return (
    <div role="alert" className="flex flex-col gap-2.5 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3">
      <p className="text-sm font-semibold text-amber-900">{t('auth.navegadorApp.titulo')}</p>
      <p className="text-xs leading-relaxed text-stone-700">
        {nav.app ? t('auth.navegadorApp.texto', { app: nav.app }) : t('auth.navegadorApp.textoGenerico')}
      </p>
      <p className="text-xs leading-relaxed text-stone-700">
        {t(nav.android ? 'auth.navegadorApp.pasosAndroid' : 'auth.navegadorApp.pasosIos')}
      </p>
      <div className="flex flex-wrap gap-2">
        {nav.android && (
          <a href={enlaceAbrirEnChrome(url)} className={`${boton} bg-amber-900 text-white hover:bg-amber-800`}>
            {t('auth.navegadorApp.abrirChrome')}
          </a>
        )}
        <button type="button" onClick={copiar} className={`${boton} border border-amber-900/30 text-amber-900 hover:bg-amber-100`}>
          {t('auth.navegadorApp.copiar')}
        </button>
      </div>
      {copiado === 'si' && <p className="text-xs text-emerald-700">{t('auth.navegadorApp.copiado')}</p>}
      {copiado === 'manual' && (
        <input
          ref={urlRef}
          readOnly
          value={url}
          aria-label={t('auth.navegadorApp.enlace')}
          onFocus={e => e.target.select()}
          className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-xs text-stone-700"
        />
      )}
      <p className="text-xs leading-relaxed text-stone-600">{t('auth.navegadorApp.alternativa')}</p>
    </div>
  )
}
