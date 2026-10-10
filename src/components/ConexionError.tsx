import { useTranslation } from 'react-i18next'
import { reintentarEnModoCompatible } from '../lib/conexion'
import { labelStyle } from '../lib/styles'

const CONTACTO = 'diasporaspatrimoniales@gmail.com'

// Aviso cuando Firebase/Firestore no responde (ver lib/conexion.ts) — en vez
// de dejar la pantalla en blanco o "Cargando..." para siempre. `oscuro`
// para fondos de color (sección de inscripción, perfil); claro por defecto.
export function ConexionError({ oscuro = false }: { oscuro?: boolean }) {
  const { t } = useTranslation()
  const texto = oscuro ? 'text-white' : 'text-stone-800'
  const suave = oscuro ? 'text-white/80' : 'text-stone-600'

  return (
    <div
      role="alert"
      className={`flex flex-col gap-4 rounded-2xl p-6 max-w-lg ${oscuro ? 'bg-black/25 border border-white/15' : 'bg-stone-50 border border-stone-200'}`}
      style={labelStyle}
    >
      <p className={`text-base font-semibold ${texto}`}>{t('conexion.titulo')}</p>
      <div className={`flex flex-col gap-2 text-sm leading-relaxed ${suave}`}>
        <p>{t('conexion.explicacion')}</p>
        <ul className="flex flex-col gap-1 pl-1">
          <li>· {t('conexion.opcionReintentar')}</li>
          <li>· {t('conexion.opcionRed')}</li>
          <li>
            · {t('conexion.opcionEscribir')}{' '}
            <a href={`mailto:${CONTACTO}`} className={`underline underline-offset-2 break-all ${texto}`}>{CONTACTO}</a>
          </li>
        </ul>
      </div>
      <button
        type="button"
        onClick={reintentarEnModoCompatible}
        className={`self-start px-6 py-3 rounded-xl text-[11px] font-semibold tracking-widest uppercase transition-colors cursor-pointer ${oscuro ? 'bg-white text-brand-red hover:bg-white/90' : 'bg-stone-900 text-white hover:bg-stone-700'}`}
      >
        {t('conexion.boton')}
      </button>
    </div>
  )
}

// Antes del error: "Está tardando más de lo normal…" o "Reconectando en
// modo compatible…" (ver DataContext `conexion`). Sin botón — todavía no
// hay nada que la persona tenga que hacer.
export function ConexionAviso({ estado, oscuro = false }: { estado: 'lento' | 'reconectando'; oscuro?: boolean }) {
  const { t } = useTranslation()
  return (
    <p role="status" className={`text-sm ${oscuro ? 'text-white/80' : 'text-stone-500'}`} style={labelStyle}>
      {t(estado === 'lento' ? 'conexion.lento' : 'conexion.reconectando')}
    </p>
  )
}
