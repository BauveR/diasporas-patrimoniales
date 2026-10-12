import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getLocaleFromPathname, localizePathname } from '../i18n/routing'
import { labelStyle } from '../lib/styles'

const CONSENT_KEY = 'consent_v1'

export function CookieBanner() {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const [visible, setVisible] = useState(() => !localStorage.getItem(CONSENT_KEY))

  const accept = () => {
    localStorage.setItem(CONSENT_KEY, 'true')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[9999] bg-white border-t border-stone-100 shadow-lg pb-[env(safe-area-inset-bottom,0px)]"
      role="dialog"
      aria-label={t('cookies.etiqueta')}
      style={labelStyle}
    >
      <div className="max-w-5xl mx-auto px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
        <p className="text-xs text-stone-500 leading-relaxed flex-1">
          {t('cookies.texto')}{' '}
          <Link to={localizePathname('/privacidad', getLocaleFromPathname(pathname))} className="underline underline-offset-2 text-stone-600 hover:text-stone-900 transition-colors">
            {t('cookies.politica')}
          </Link>
        </p>
        <button
          onClick={accept}
          className="shrink-0 px-6 py-2.5 rounded-xl bg-stone-900 text-white text-[11px] tracking-widest uppercase hover:bg-stone-700 transition-colors cursor-pointer"
        >
          {t('cookies.aceptar')}
        </button>
      </div>
    </div>
  )
}
