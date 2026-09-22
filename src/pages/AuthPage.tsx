import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { sendPasswordReset } from '../lib/auth'
import { useAuth } from '../contexts/AuthContext'
import { isValidEmail } from '../utils/validators'

const labelStyle = { fontFamily: "'Open Sans', sans-serif" }

// user-not-found and wrong-password map to the same message on purpose —
// distinguishing them tells an attacker which emails have accounts
// (enumeration). handleReset() below already avoids this same trap for the
// password-reset flow; this keeps login consistent with it.
const AUTH_ERRORS: Record<string, string> = {
  'auth/user-not-found':        'Email o contraseña incorrectos',
  'auth/wrong-password':        'Email o contraseña incorrectos',
  'auth/invalid-credential':    'Email o contraseña incorrectos',
  'auth/email-already-in-use':  'Este email ya está registrado',
  'auth/weak-password':         'La contraseña debe tener al menos 8 caracteres',
  'auth/invalid-email':         'Email inválido',
  'auth/popup-closed-by-user':  '',
  'auth/too-many-requests':     'Demasiados intentos. Espera unos minutos.',
}

function parseError(err: unknown): string {
  const code = (err as { code?: string }).code ?? ''
  return AUTH_ERRORS[code] ?? 'Algo salió mal, intenta de nuevo'
}

type View = 'login' | 'register' | 'reset'

type Props = { isModal?: boolean }

export function AuthPage({ isModal = false }: Props) {
  const { signIn, signUp, signInWithGoogle } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const fromApp = location.key !== 'default'

  const redirectAfterLogin = !!location.state?.redirectAfterLogin
  const returnTo = location.state?.returnTo as string | undefined
  const [view, setView] = useState<View>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  const handleSuccess = (role: string) => {
    if (returnTo) {
      navigate(returnTo, { replace: true })
    } else if (redirectAfterLogin || !fromApp) {
      navigate(role === 'admin' ? '/admin' : '/perfil', { replace: true })
    } else {
      navigate(-1)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!isValidEmail(email)) {
      setError('Introduce un email válido (revisa que el dominio esté bien escrito)')
      return
    }
    if (view === 'register' && password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres')
      return
    }
    setBusy(true)
    try {
      if (view === 'login') {
        const role = await signIn(email, password)
        handleSuccess(role)
      } else {
        const role = await signUp(name, email, password)
        handleSuccess(role)
      }
    } catch (err) {
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
    setBusy(true)
    try {
      const role = await signInWithGoogle()
      handleSuccess(role)
    } catch (err) {
      setError(parseError(err))
    } finally {
      setBusy(false)
    }
  }

  if (view === 'reset') {
    return (
      <div
        className={`flex flex-col gap-6 px-8 py-8 ${isModal ? '' : 'max-w-sm mx-auto pt-32'}`}
        style={labelStyle}
      >
        <div className="flex flex-col gap-1">
          <h2
            className="text-2xl font-thin text-stone-900 uppercase tracking-tight"
            style={{ fontFamily: "'Google Sans Flex', sans-serif", fontVariationSettings: "'wght' 100" }}
          >
            Recuperar contraseña
          </h2>
          <p className="text-xs text-stone-400 tracking-wide">
            Te enviaremos un enlace para restablecer tu contraseña
          </p>
        </div>

        {resetSent ? (
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-3">
              <p className="text-sm font-medium text-stone-800">
                Si existe una cuenta con ese email, recibirás un enlace para restablecer tu contraseña.
              </p>
              <ul className="flex flex-col gap-1.5">
                <li className="text-xs text-stone-400 flex gap-2">
                  <span>·</span>
                  <span>El enlace llegará en unos minutos. Revisa también tu carpeta de spam.</span>
                </li>
                <li className="text-xs text-stone-400 flex gap-2">
                  <span>·</span>
                  <span>Al hacer clic, podrás escribir tu nueva contraseña directamente.</span>
                </li>
                <li className="text-xs text-stone-400 flex gap-2">
                  <span>·</span>
                  <span>El enlace es de un solo uso y caduca en 1 hora.</span>
                </li>
                <li className="text-xs text-stone-400 flex gap-2">
                  <span>·</span>
                  <span>Una vez cambiada, vuelve aquí e inicia sesión con tu nueva contraseña.</span>
                </li>
              </ul>
            </div>
            <button
              type="button"
              onClick={() => { setView('login'); setResetSent(false); setError('') }}
              className="text-[11px] tracking-widest uppercase text-stone-400 hover:text-stone-700 transition-colors cursor-pointer text-left"
            >
              ← Volver al inicio de sesión
            </button>
          </div>
        ) : (
          <form onSubmit={handleReset} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] tracking-widest uppercase text-stone-400">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="tu@email.com"
                className="border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-800 placeholder:text-stone-300 focus:outline-none focus:border-stone-400 transition-colors"
              />
            </div>

            {error && <p className="text-xs text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={busy}
              className="w-full py-3.5 rounded-xl bg-stone-900 text-white text-[11px] tracking-widest uppercase hover:bg-stone-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {busy ? '...' : 'Enviar enlace'}
            </button>

            <button
              type="button"
              onClick={() => { setView('login'); setError('') }}
              className="text-[11px] tracking-widest uppercase text-stone-400 hover:text-stone-700 transition-colors cursor-pointer text-left"
            >
              ← Volver al inicio de sesión
            </button>
          </form>
        )}
      </div>
    )
  }

  return (
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
          {view === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
        </h2>
        <p className="text-xs text-stone-400 tracking-wide">
          {view === 'login'
            ? 'Accede para inscribirte en actividades'
            : 'Únete al simposio Diásporas Patrimoniales'}
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
        Continuar con Google
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-stone-100" />
        <span className="text-[11px] text-stone-400 tracking-widest uppercase">o</span>
        <div className="flex-1 h-px bg-stone-100" />
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {view === 'register' && (
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] tracking-widest uppercase text-stone-400">Nombre</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              maxLength={60}
              placeholder="Tu nombre completo"
              className="border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-800 placeholder:text-stone-300 focus:outline-none focus:border-stone-400 transition-colors"
            />
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] tracking-widest uppercase text-stone-400">Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            placeholder="tu@email.com"
            className="border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-800 placeholder:text-stone-300 focus:outline-none focus:border-stone-400 transition-colors"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[10px] tracking-widest uppercase text-stone-400">Contraseña</label>
            {view === 'login' && (
              <button
                type="button"
                onClick={() => { setView('reset'); setError(''); setResetSent(false) }}
                className="text-[10px] text-stone-400 hover:text-stone-600 underline underline-offset-2 transition-colors cursor-pointer"
              >
                ¿Olvidaste tu contraseña?
              </button>
            )}
          </div>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            className="border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-800 placeholder:text-stone-300 focus:outline-none focus:border-stone-400 transition-colors"
          />
        </div>

        {error && (
          <p className="text-xs text-red-500">{error}</p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full py-3.5 rounded-xl bg-stone-900 text-white text-[11px] tracking-widest uppercase hover:bg-stone-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          {busy ? '...' : view === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
        </button>
      </form>

      {/* Switch view */}
      <p className="text-center text-[11px] text-stone-400">
        {view === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
        <button
          type="button"
          onClick={() => { setView(view === 'login' ? 'register' : 'login'); setError('') }}
          className="text-stone-700 underline underline-offset-2 cursor-pointer"
        >
          {view === 'login' ? 'Crear cuenta' : 'Iniciar sesión'}
        </button>
      </p>
    </div>
  )
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
