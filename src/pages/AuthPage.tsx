import { useRef, useState, type ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { sendPasswordReset } from '../lib/auth'
import { useAuth } from '../contexts/AuthContext'
import { isValidEmail } from '../utils/validators'
import { evaluarContrasena, LONGITUD_MAXIMA, LONGITUD_MINIMA, type EvaluacionContrasena } from '../utils/passwordPolicy'
import { labelStyle } from '../lib/styles'
import { limpiarInscripcionPendiente } from '../lib/inscripcionPendiente'
import { getLocaleFromPathname } from '../i18n/routing'
import { DEFAULT_LOCALE } from '../i18n/config'

// user-not-found and wrong-password map to the same message on purpose —
// distinguishing them tells an attacker which emails have accounts
// (enumeration). handleReset() below already avoids this same trap for the
// password-reset flow; this keeps login consistent with it.
// Valores = claves de traducción (auth.errores.* en i18n/locales); el estado
// `error` guarda la clave y se traduce al pintar, así cambia con el idioma.
const AUTH_ERRORS: Record<string, string> = {
  'auth/user-not-found':        'auth.errores.credenciales',
  'auth/wrong-password':        'auth.errores.credenciales',
  'auth/invalid-credential':    'auth.errores.credenciales',
  'auth/email-already-in-use':  'auth.errores.emailRegistrado',
  'auth/weak-password':         'auth.errores.contrasenaCorta',
  'auth/invalid-email':         'auth.errores.emailMalFormado',
  'auth/popup-closed-by-user':  '',
  'auth/cancelled-popup-request': '',
  'auth/too-many-requests':     'auth.errores.demasiadosIntentos',
  // Ese email ya tiene cuenta con contraseña y se entró con Google
  // (Workspace institucional): no es un fallo de Google, hay que entrar con
  // la contraseña — ver accionesError().
  'auth/account-exists-with-different-credential': 'auth.errores.cuentaOtroMetodo',
  'auth/popup-blocked':         'auth.errores.popupBloqueado',
  'auth/network-request-failed': 'auth.errores.red',
  'auth/user-disabled':         'auth.errores.cuentaDesactivada',
}

function parseError(err: unknown): string {
  const code = (err as { code?: string }).code ?? ''
  return AUTH_ERRORS[code] ?? 'auth.errores.generico'
}

type View = 'login' | 'register' | 'reset' | 'bienvenida'

type Props = { isModal?: boolean }

export function AuthPage({ isModal = false }: Props) {
  const { t } = useTranslation()
  const { user, userRole, signIn, signUp, signInWithGoogle, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const fromApp = location.key !== 'default'

  const redirectAfterLogin = !!location.state?.redirectAfterLogin
  const returnTo = location.state?.returnTo as string | undefined
  const [view, setView] = useState<View>('login')
  const [name, setName] = useState('')
  const [apellidos, setApellidos] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  // Tras un intento de crear cuenta con la contraseña incompleta, los
  // requisitos que faltan pasan de gris a rojo.
  const [intentoRegistro, setIntentoRegistro] = useState(false)
  const [error, setError] = useState('')
  // Dónde se pinta el error: junto al botón de Google si vino de ahí, o
  // bajo el formulario. Antes un fallo de Google salía abajo del todo.
  const [errorDeGoogle, setErrorDeGoogle] = useState(false)
  // Desde que se pulsa "Entrar"/"Crear cuenta" hasta salir de esta pantalla:
  // `user` ya existe a mitad del proceso y no tiene que verse la vista de
  // "ya has iniciado sesión".
  const [entrando, setEntrando] = useState(false)
  const [busy, setBusy] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [cuentaNueva, setCuentaNueva] = useState(false)
  // Si Google falla o se cierra el popup sin entrar, lo más probable con un
  // correo institucional es que su Workspace bloquee apps externas — Google
  // lo avisa dentro del popup y aquí solo llega "popup cerrado", así que no
  // se puede distinguir. Se ofrece el registro con email a cualquier fallo.
  const [googleFallo, setGoogleFallo] = useState(false)
  const nameRef = useRef<HTMLInputElement>(null)

  // Desde el aviso de correo institucional o el recuadro de Google fallido:
  // a "Crear cuenta" con el cursor ya en el primer campo (Nombre).
  const irACrearCuenta = () => {
    setView('register')
    setError('')
    setGoogleFallo(false)
    requestAnimationFrame(() => nameRef.current?.focus())
  }

  const locale = getLocaleFromPathname(location.pathname)
  const prefix = locale === DEFAULT_LOCALE ? '' : `/${locale}`

  // Tres recorridos distintos:
  //  - returnTo (ProtectedRoute — ej. link a "Mi perfil" del email): directo
  //    a donde se quería ir.
  //  - "Login / Mi cuenta" del navbar (redirectAfterLogin) o /login abierto a
  //    mano: pantalla de bienvenida con las dos cosas que se hacen en el
  //    sitio — inscribirse o ver tus actividades. El admin va a /admin.
  //  - Botón "Inscribirme" de una tarjeta (sin flags): volver a la tarjeta,
  //    que reabre sola el formulario (lib/inscripcionPendiente.ts).
  // En los dos primeros se limpia la marca de inscripción pendiente: si
  // alguien abrió el login desde una tarjeta, lo cerró y después entró por
  // el navbar, esa tarjeta no tiene que abrirse sola más tarde.
  const handleSuccess = (role: string, esNueva: boolean) => {
    if (returnTo) {
      limpiarInscripcionPendiente()
      navigate(returnTo, { replace: true })
    } else if (redirectAfterLogin || !fromApp) {
      limpiarInscripcionPendiente()
      if (role === 'admin') {
        navigate('/admin', { replace: true })
      } else {
        setCuentaNueva(esNueva)
        setView('bienvenida')
      }
    } else {
      navigate(-1)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setGoogleFallo(false)
    if (!isValidEmail(email)) {
      setError('auth.errores.emailInvalido')
      return
    }
    // `required` deja pasar un campo con solo espacios.
    if (view === 'register' && (!name.trim() || !apellidos.trim())) {
      setError('auth.errores.nombreApellidos')
      return
    }
    // Solo al crear cuenta: las cuentas anteriores (mínimo 6 de Firebase,
    // luego 8) tienen que poder seguir entrando con la contraseña que ya
    // tienen, así que el login no valida nada del formato.
    if (view === 'register') {
      const ev = evaluarContrasena(password, email)
      if (!ev.valida) {
        setIntentoRegistro(true)
        setError(ev.comun ? 'auth.errores.contrasenaComun'
          : ev.contieneEmail ? 'auth.errores.contrasenaEmail'
          : 'auth.errores.contrasenaRequisitos')
        document.getElementById('auth-contrasena')?.focus()
        return
      }
    }
    if (view === 'register' && password !== password2) {
      setError('auth.errores.contrasenasNoCoinciden')
      return
    }
    setBusy(true)
    setEntrando(true)
    setErrorDeGoogle(false)
    try {
      if (view === 'login') {
        const role = await signIn(email, password)
        handleSuccess(role, false)
      } else {
        // Un solo displayName "Nombre Apellidos" — es lo que guardan el
        // perfil y el inscrito (cuyas reglas no admiten campos nuevos).
        const nombreCompleto = `${name} ${apellidos}`.trim().replace(/\s+/g, ' ')
        const role = await signUp(nombreCompleto, email, password)
        handleSuccess(role, true)
      }
    } catch (err) {
      setEntrando(false)
      setError(parseError(err))
    } finally {
      setBusy(false)
    }
  }

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await sendPasswordReset(email)
      setResetSent(true)
    } catch (err) {
      const code = (err as { code?: string }).code ?? ''
      if (code === 'auth/user-not-found') {
        setResetSent(true)
      } else {
        setError(parseError(err))
      }
    } finally {
      setBusy(false)
    }
  }

  const handleGoogle = async () => {
    setError('')
    setGoogleFallo(false)
    setBusy(true)
    setEntrando(true)
    try {
      const { role, isNewUser } = await signInWithGoogle()
      handleSuccess(role, isNewUser)
    } catch (err) {
      setEntrando(false)
      const clave = parseError(err)
      setError(clave)
      setErrorDeGoogle(true)
      if (clave === 'auth.errores.cuentaOtroMetodo') {
        // Ya tiene cuenta con contraseña: se le lleva al login con su email
        // escrito, no al recuadro de "crea tu cuenta" (ya la tiene).
        const emailGoogle = (err as { customData?: { email?: string } }).customData?.email
        if (emailGoogle) setEmail(emailGoogle)
        setView('login')
      } else {
        setGoogleFallo(true)
      }
    } finally {
      setBusy(false)
    }
  }

  // A iniciar sesión con el email ya escrito y el cursor en la contraseña.
  const irAIniciarSesion = () => {
    setView('login')
    setError('')
    setGoogleFallo(false)
    requestAnimationFrame(() => document.getElementById('auth-contrasena')?.focus())
  }

  const irARecuperar = () => {
    setView('reset')
    setError('')
    setResetSent(false)
  }

  // Cada error con su salida: nadie se queda en un mensaje sin saber qué
  // hacer después.
  const mensajeError = () => {
    if (!error) return null
    const enlace = 'text-[11px] tracking-widest uppercase text-stone-700 underline underline-offset-2 cursor-pointer'
    return (
      <div className="flex flex-col gap-2" role="alert">
        <p className="text-xs text-red-500">{t(error)}</p>
        {error === 'auth.errores.credenciales' && (
          <p className="text-xs text-stone-500">{t('auth.errores.credencialesAyuda')}</p>
        )}
        {(error === 'auth.errores.generico' || error === 'auth.errores.cuentaDesactivada') && (
          <p className="text-xs text-stone-500">
            {t('auth.errores.contacto')}{' '}
            <a href="mailto:diasporaspatrimoniales@gmail.com" className="underline underline-offset-2">diasporaspatrimoniales@gmail.com</a>
          </p>
        )}
        {error === 'auth.errores.emailRegistrado' && (
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <button type="button" onClick={irAIniciarSesion} className={enlace}>{t('auth.acciones.iniciarSesion')}</button>
            <button type="button" onClick={irARecuperar} className={enlace}>{t('auth.acciones.recuperar')}</button>
          </div>
        )}
        {error === 'auth.errores.cuentaOtroMetodo' && (
          <button type="button" onClick={irARecuperar} className={`self-start ${enlace}`}>{t('auth.acciones.olvideContrasena')}</button>
        )}
      </div>
    )
  }

  // /login con la sesión ya iniciada (botón "atrás", enlace guardado): en
  // vez del formulario otra vez — que permitía entrar con otra cuenta sin
  // haber salido — se dice con quién se está dentro y qué hacer.
  if (user && !entrando && (view === 'login' || view === 'register')) {
    const quien = user.displayName?.trim() || user.email || ''
    return (
      <PageShell isModal={isModal}>
      <div
        className={`flex flex-col gap-6 px-8 py-8 ${isModal ? '' : 'max-w-sm mx-auto pt-32'}`}
        style={labelStyle}
      >
        <div className="flex flex-col gap-2">
          <h2
            className="text-2xl font-thin text-stone-900 uppercase tracking-tight"
            style={{ fontFamily: "'Google Sans Flex', sans-serif", fontVariationSettings: "'wght' 100" }}
          >
            {t('auth.sesionIniciada.titulo')}
          </h2>
          <p className="text-sm text-stone-600">{t('auth.sesionIniciada.como', { quien })}</p>
        </div>
        <div className="flex flex-col gap-3">
          {userRole === 'admin' && (
            <button
              type="button"
              onClick={() => navigate(`${prefix}/admin`, { replace: true })}
              className="w-full rounded-xl bg-stone-900 px-5 py-4 text-left text-white transition-colors hover:bg-stone-700 cursor-pointer"
            >
              <span className="block font-mattone text-sm font-bold tracking-widest uppercase">{t('auth.sesionIniciada.admin')}</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => navigate(prefix ? `${prefix}#sedes` : '/#sedes', { replace: true })}
            className="w-full rounded-xl px-5 py-4 text-left text-white transition-opacity hover:opacity-90 cursor-pointer"
            style={{ backgroundColor: '#f04f23' }}
          >
            <span className="block font-mattone text-sm font-bold tracking-widest uppercase">{t('auth.bienvenida.inscribirme')}</span>
            <span className="mt-0.5 block text-xs text-white/85">{t('auth.bienvenida.inscribirmeSub')}</span>
          </button>
          <button
            type="button"
            onClick={() => navigate(`${prefix}/perfil`, { replace: true })}
            className="w-full rounded-xl border border-stone-300 px-5 py-4 text-left text-stone-900 transition-colors hover:border-stone-500 hover:bg-stone-50 cursor-pointer"
          >
            <span className="block font-mattone text-sm font-bold tracking-widest uppercase">{t('auth.bienvenida.misActividades')}</span>
            <span className="mt-0.5 block text-xs text-stone-500">{t('auth.bienvenida.misActividadesSub')}</span>
          </button>
        </div>
        <button
          type="button"
          onClick={() => { signOut().catch(err => console.error('[AuthPage] no se pudo cerrar sesión:', err)) }}
          className="self-start text-[11px] tracking-widest uppercase text-stone-500 underline underline-offset-2 hover:text-stone-800 cursor-pointer"
        >
          {t('auth.sesionIniciada.noSoyYo')}
        </button>
      </div>
      </PageShell>
    )
  }

  if (view === 'bienvenida') {
    const nombre = user?.displayName?.trim().split(/\s+/)[0] || name.trim().split(/\s+/)[0]
    // replace: el login no queda en el historial — "atrás" desde la
    // sección de inscripción o desde el perfil no vuelve a esta pantalla.
    return (
      <PageShell isModal={isModal}>
      <div
        className={`flex flex-col gap-6 px-8 py-8 ${isModal ? '' : 'max-w-sm mx-auto pt-32'}`}
        style={labelStyle}
      >
        <div className="flex flex-col gap-2">
          <div className="w-11 h-11 rounded-full bg-emerald-50 flex items-center justify-center" aria-hidden>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
          <h2
            className="mt-2 text-2xl font-thin text-stone-900 uppercase tracking-tight"
            style={{ fontFamily: "'Google Sans Flex', sans-serif", fontVariationSettings: "'wght' 100" }}
          >
            {t(cuentaNueva ? 'auth.bienvenida.cuentaCreada' : 'auth.bienvenida.holaDeNuevo')}
          </h2>
          <p className="text-sm text-stone-600">
            {nombre ? t('auth.bienvenida.saludoNombre', { nombre }) : t('auth.bienvenida.saludo')} {t('auth.bienvenida.queHacer')}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => navigate(prefix ? `${prefix}#sedes` : '/#sedes', { replace: true })}
            className="w-full rounded-xl px-5 py-4 text-left text-white transition-opacity hover:opacity-90 cursor-pointer"
            style={{ backgroundColor: '#f04f23' }}
          >
            <span className="block font-mattone text-sm font-bold tracking-widest uppercase">{t('auth.bienvenida.inscribirme')}</span>
            <span className="mt-0.5 block text-xs text-white/85">{t('auth.bienvenida.inscribirmeSub')}</span>
          </button>
          <button
            type="button"
            onClick={() => navigate(`${prefix}/perfil`, { replace: true })}
            className="w-full rounded-xl border border-stone-300 px-5 py-4 text-left text-stone-900 transition-colors hover:border-stone-500 hover:bg-stone-50 cursor-pointer"
          >
            <span className="block font-mattone text-sm font-bold tracking-widest uppercase">{t('auth.bienvenida.misActividades')}</span>
            <span className="mt-0.5 block text-xs text-stone-500">{t('auth.bienvenida.misActividadesSub')}</span>
          </button>
        </div>
      </div>
      </PageShell>
    )
  }

  if (view === 'reset') {
    return (
      <PageShell isModal={isModal}>
      <div
        className={`flex flex-col gap-6 px-8 py-8 ${isModal ? '' : 'max-w-sm mx-auto pt-32'}`}
        style={labelStyle}
      >
        <div className="flex flex-col gap-1">
          <h2
            className="text-2xl font-thin text-stone-900 uppercase tracking-tight"
            style={{ fontFamily: "'Google Sans Flex', sans-serif", fontVariationSettings: "'wght' 100" }}
          >
            {t('auth.reset.titulo')}
          </h2>
          <p className="text-xs text-stone-400 tracking-wide">
            {t('auth.reset.subtitulo')}
          </p>
        </div>

        {resetSent ? (
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-3">
              <p className="text-sm font-medium text-stone-800">
                {t('auth.reset.enviado')}
              </p>
              <ul className="flex flex-col gap-1.5">
                <li className="text-xs text-stone-400 flex gap-2">
                  <span>·</span>
                  <span>{t('auth.reset.punto1')}</span>
                </li>
                <li className="text-xs text-stone-400 flex gap-2">
                  <span>·</span>
                  <span>{t('auth.reset.punto2')}</span>
                </li>
                <li className="text-xs text-stone-400 flex gap-2">
                  <span>·</span>
                  <span>{t('auth.reset.punto3')}</span>
                </li>
                <li className="text-xs text-stone-400 flex gap-2">
                  <span>·</span>
                  <span>{t('auth.reset.punto4')}</span>
                </li>
              </ul>
            </div>
            <button
              type="button"
              onClick={() => { setView('login'); setResetSent(false); setError('') }}
              className="text-[11px] tracking-widest uppercase text-stone-400 hover:text-stone-700 transition-colors cursor-pointer text-left"
            >
              {t('auth.reset.volver')}
            </button>
          </div>
        ) : (
          <form onSubmit={handleReset} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] tracking-widest uppercase text-stone-400">{t('auth.email')}</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder={t('auth.emailPlaceholder')}
                className="border border-stone-200 rounded-xl px-4 py-3 text-base text-stone-800 placeholder:text-stone-300 focus:outline-none focus:border-stone-400 transition-colors"
              />
            </div>

            {error && <p className="text-xs text-red-500">{t(error)}</p>}

            <button
              type="submit"
              disabled={busy}
              className="w-full py-3.5 rounded-xl bg-stone-900 text-white text-[11px] tracking-widest uppercase hover:bg-stone-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {busy ? '...' : t('auth.reset.enviar')}
            </button>

            <button
              type="button"
              onClick={() => { setView('login'); setError('') }}
              className="text-[11px] tracking-widest uppercase text-stone-400 hover:text-stone-700 transition-colors cursor-pointer text-left"
            >
              {t('auth.reset.volver')}
            </button>
          </form>
        )}
      </div>
      </PageShell>
    )
  }

  return (
    <PageShell isModal={isModal}>
    <div
      className={`flex flex-col gap-6 px-8 py-8 ${isModal ? '' : 'max-w-sm mx-auto pt-32'}`}
      style={labelStyle}
    >
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h2
          className="text-2xl font-thin text-stone-900 uppercase tracking-tight"
          style={{ fontFamily: "'Google Sans Flex', sans-serif", fontVariationSettings: "'wght' 100" }}
        >
          {t(view === 'login' ? 'auth.titulo.login' : 'auth.titulo.registro')}
        </h2>
        <p className="text-xs text-stone-400 tracking-wide">
          {t(view === 'login' ? 'auth.subtitulo.login' : 'auth.subtitulo.registro')}
        </p>
      </div>

      {/* Google */}
      <button
        type="button"
        onClick={handleGoogle}
        disabled={busy}
        className="flex items-center justify-center gap-3 w-full py-3 rounded-xl border border-stone-200 text-sm text-stone-700 hover:bg-stone-50 transition-colors disabled:opacity-40 cursor-pointer"
      >
        <GoogleIcon />
        {t('auth.google')}
      </button>

      {errorDeGoogle && mensajeError()}

      {googleFallo && (
        <div className="flex flex-col gap-2 rounded-xl bg-stone-50 px-4 py-3">
          <p className="text-xs text-stone-600 leading-relaxed">
            {t('auth.googleFallo')}
          </p>
          <button
            type="button"
            onClick={irACrearCuenta}
            className="self-start text-[11px] tracking-widest uppercase text-stone-700 underline underline-offset-2 cursor-pointer"
          >
            {t('auth.crearCuentaFlecha')}
          </button>
        </div>
      )}

      {/* Divider */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-stone-100" />
          <span className="text-[11px] text-stone-400 tracking-widest uppercase">{t('auth.separador')}</span>
          <div className="flex-1 h-px bg-stone-100" />
        </div>
        {view === 'login' ? (
          <button
            type="button"
            onClick={irACrearCuenta}
            className="flex items-center justify-center gap-2 w-full rounded-xl bg-brand-red/10 px-4 py-2.5 text-sm font-medium text-brand-red hover:bg-brand-red/15 transition-colors cursor-pointer"
          >
            {t('auth.institucionalBoton')}
            <span aria-hidden>→</span>
          </button>
        ) : (
          <p className="flex items-center justify-center gap-2 rounded-xl bg-brand-red/10 px-4 py-2.5 text-sm font-medium text-brand-red">
            {t('auth.institucionalAviso')}
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="shrink-0 animate-bounce">
              <path d="M12 5v14" />
              <path d="m19 12-7 7-7-7" />
            </svg>
          </p>
        )}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {view === 'register' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5 min-w-0">
              <label htmlFor="auth-nombre" className="text-[10px] tracking-widest uppercase text-stone-400">{t('auth.nombre')}</label>
              <input
                id="auth-nombre"
                type="text"
                value={name}
                ref={nameRef}
                onChange={e => setName(e.target.value)}
                required
                maxLength={60}
                autoComplete="given-name"
                placeholder={t('auth.nombrePlaceholder')}
                className="border border-stone-200 rounded-xl px-4 py-3 text-base text-stone-800 placeholder:text-stone-300 focus:outline-none focus:border-stone-400 transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1.5 min-w-0">
              <label htmlFor="auth-apellidos" className="text-[10px] tracking-widest uppercase text-stone-400">{t('auth.apellidos')}</label>
              <input
                id="auth-apellidos"
                type="text"
                value={apellidos}
                onChange={e => setApellidos(e.target.value)}
                required
                maxLength={80}
                autoComplete="family-name"
                placeholder={t('auth.apellidosPlaceholder')}
                className="border border-stone-200 rounded-xl px-4 py-3 text-base text-stone-800 placeholder:text-stone-300 focus:outline-none focus:border-stone-400 transition-colors"
              />
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] tracking-widest uppercase text-stone-400">{t('auth.email')}</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            placeholder={t('auth.emailPlaceholder')}
            className="border border-stone-200 rounded-xl px-4 py-3 text-base text-stone-800 placeholder:text-stone-300 focus:outline-none focus:border-stone-400 transition-colors"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="auth-contrasena" className="text-[10px] tracking-widest uppercase text-stone-400">{t('auth.contrasena')}</label>
            {view === 'login' && (
              <button
                type="button"
                onClick={() => { setView('reset'); setError(''); setResetSent(false) }}
                className="text-[10px] text-stone-400 hover:text-stone-600 underline underline-offset-2 transition-colors cursor-pointer"
              >
                {t('auth.olvidaste')}
              </button>
            )}
          </div>
          <CampoContrasena
            id="auth-contrasena"
            value={password}
            onChange={setPassword}
            autoComplete={view === 'login' ? 'current-password' : 'new-password'}
            maxLength={view === 'register' ? LONGITUD_MAXIMA : undefined}
            describedBy={view === 'register' ? 'auth-contrasena-requisitos' : undefined}
          />
          {view === 'register' && (
            <RequisitosContrasena
              id="auth-contrasena-requisitos"
              ev={evaluarContrasena(password, email)}
              vacia={password.length === 0}
              intento={intentoRegistro}
            />
          )}
        </div>

        {view === 'register' && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="auth-contrasena2" className="text-[10px] tracking-widest uppercase text-stone-400">{t('auth.contrasenaRepetir')}</label>
            <CampoContrasena
              id="auth-contrasena2"
              value={password2}
              onChange={setPassword2}
              autoComplete="new-password"
              noCoincide={password2.length > 0 && password2 !== password}
            />
            {password2.length > 0 && password2 !== password && (
              <p id="auth-contrasena2-aviso" className="text-xs text-red-500">{t('auth.errores.contrasenasNoCoinciden')}</p>
            )}
          </div>
        )}

        {!errorDeGoogle && mensajeError()}

        <button
          type="submit"
          disabled={busy}
          className="w-full py-3.5 rounded-xl bg-stone-900 text-white text-[11px] tracking-widest uppercase hover:bg-stone-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          {busy ? '...' : t(view === 'login' ? 'auth.iniciarSesion' : 'auth.crearCuenta')}
        </button>
      </form>

      {/* Switch view */}
      <div className="flex flex-col gap-2">
        <p className="text-center text-xs text-stone-500">
          {t(view === 'login' ? 'auth.sinCuenta' : 'auth.conCuenta')}
        </p>
        <button
          type="button"
          onClick={() => { setView(view === 'login' ? 'register' : 'login'); setError(''); setGoogleFallo(false) }}
          className="w-full py-3.5 rounded-xl border border-brand-red/40 text-brand-red text-[11px] font-semibold tracking-widest uppercase hover:border-brand-red hover:bg-brand-red/5 transition-colors cursor-pointer"
        >
          {t(view === 'login' ? 'auth.crearCuenta' : 'auth.iniciarSesion')}
        </button>
      </div>
    </div>
    </PageShell>
  )
}

// Todo este formulario está diseñado para fondo blanco (texto stone-800/
// stone-400, bordes stone-200). En el modal (AuthModal) ese blanco lo pone
// la propia tarjeta; como página completa (/login — ej. el link a "Mi
// perfil" del email de confirmación sin sesión iniciada, vía
// ProtectedRoute) quedaba sobre el negro del <body> y el texto gris casi no
// se leía. Mismo fondo blanco a pantalla completa que Perfil/Privacidad.
// Campo de contraseña con el ojo para mostrarla/ocultarla. Al registrarse se
// usa dos veces (contraseña y repetirla); `noCoincide` marca el segundo en
// rojo mientras no sea igual al primero.
function CampoContrasena({ id, value, onChange, autoComplete, noCoincide = false, maxLength, describedBy }: {
  id: string
  value: string
  onChange: (v: string) => void
  autoComplete: string
  noCoincide?: boolean
  maxLength?: number
  describedBy?: string
}) {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative">
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        required
        autoComplete={autoComplete}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        placeholder="••••••••"
        aria-invalid={noCoincide || undefined}
        maxLength={maxLength}
        aria-describedby={noCoincide ? `${id}-aviso` : describedBy}
        className={`w-full border rounded-xl pl-4 pr-12 py-3 text-base text-stone-800 placeholder:text-stone-300 focus:outline-none transition-colors ${noCoincide ? 'border-red-300 focus:border-red-400' : 'border-stone-200 focus:border-stone-400'}`}
      />
      <button
        type="button"
        onClick={() => setVisible(v => !v)}
        aria-label={t(visible ? 'auth.ocultarContrasena' : 'auth.mostrarContrasena')}
        aria-pressed={visible}
        aria-controls={id}
        className="absolute inset-y-0 right-0 w-12 flex items-center justify-center text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
      >
        {visible ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M10.7 5.1A10.4 10.4 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-2.2 3.2" />
            <path d="M6.6 6.6C3.9 8.4 2 12 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.4-1.6" />
            <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
            <path d="m2 2 20 20" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  )
}

// Lista de requisitos visible desde el principio (se sabe qué se pide antes
// de escribir), con cada uno marcado en verde al cumplirse, más una barra de
// seguridad orientativa. Los avisos de contraseña común o con el email solo
// aparecen cuando ya cumple lo básico, para no amontonar mensajes.
function RequisitosContrasena({ id, ev, vacia, intento }: {
  id: string
  ev: EvaluacionContrasena
  vacia: boolean
  intento: boolean
}) {
  const { t } = useTranslation()
  const items = [
    { ok: ev.requisitos.longitud, texto: t('auth.requisitos.longitud', { n: LONGITUD_MINIMA }) },
    { ok: ev.requisitos.letra, texto: t('auth.requisitos.letra') },
    { ok: ev.requisitos.numero, texto: t('auth.requisitos.numero') },
  ]
  const nivel = { debil: 1, aceptable: 2, fuerte: 3 }[ev.fuerza]
  const colorBarra = { debil: 'bg-red-400', aceptable: 'bg-amber-400', fuerte: 'bg-emerald-500' }[ev.fuerza]
  const colorTexto = { debil: 'text-red-500', aceptable: 'text-amber-600', fuerte: 'text-emerald-600' }[ev.fuerza]
  const aviso = ev.comun ? 'auth.errores.contrasenaComun' : ev.contieneEmail ? 'auth.errores.contrasenaEmail' : null

  return (
    <div id={id} className="flex flex-col gap-2 pt-1">
      {!vacia && (
        <div className="flex items-center gap-3" aria-live="polite">
          <div className="flex flex-1 gap-1" aria-hidden="true">
            {[1, 2, 3].map(i => (
              <span key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= nivel ? colorBarra : 'bg-stone-200'}`} />
            ))}
          </div>
          <span className={`text-[11px] ${colorTexto}`}>
            {t('auth.fuerza.etiqueta')}: {t(`auth.fuerza.${ev.fuerza}`)}
          </span>
        </div>
      )}
      <p className="text-[11px] text-stone-500">{t('auth.requisitos.titulo')}</p>
      <ul className="flex flex-col gap-1">
        {items.map(({ ok, texto }) => {
          const falta = !ok && intento
          return (
            <li
              key={texto}
              className={`flex items-center gap-2 text-xs transition-colors ${ok ? 'text-emerald-700' : falta ? 'text-red-500' : 'text-stone-500'}`}
            >
              <span
                aria-hidden="true"
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${ok ? 'border-emerald-600 bg-emerald-600 text-white' : falta ? 'border-red-400' : 'border-stone-300'}`}
              >
                {ok && (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                )}
              </span>
              {texto}
              <span className="sr-only">— {t(ok ? 'auth.requisitos.cumplido' : 'auth.requisitos.pendiente')}</span>
            </li>
          )
        })}
      </ul>
      {aviso && (
        <p className="text-xs text-red-500" role="alert">{t(aviso)}</p>
      )}
    </div>
  )
}

function PageShell({ isModal, children }: { isModal: boolean; children: ReactNode }) {
  if (isModal) return <>{children}</>
  return <main className="min-h-screen bg-white">{children}</main>
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.8 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.5 6.5 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z"/>
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.5 6.5 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.3C29.3 35.3 26.8 36 24 36c-5.2 0-9.7-3.3-11.3-7.9l-6.5 5C9.6 39.6 16.3 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.3 4.1-4.2 5.5l6.2 5.3C37 39 44 34 44 24c0-1.2-.1-2.3-.4-3.5z"/>
    </svg>
  )
}
