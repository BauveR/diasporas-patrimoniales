import { useState, type MouseEvent } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'

import { useAuth } from '../contexts/AuthContext'
import { useIsDesktop } from '../hooks/useIsDesktop'
import { ALL_LOCALES, DEFAULT_LOCALE } from '../i18n/config'
import { getLocaleFromPathname, localizePathname } from '../i18n/routing'
import logoDiasporas from '../assets/diasporas patrimoniales-04 2.webp'
import { labelStyle } from '../lib/styles'

const NAVBAR_BG = '#000000'

type NavEntry = { label: string; to?: string; href?: string }

// Built from `t()` (not a module-level constant) so the labels re-resolve
// whenever the active language changes; the section-anchor links append the
// hash directly to the prefix instead of via a leading slash, to avoid a
// double slash before "#sedes" that would otherwise leave a trailing slash
// on the path React Router has to match (e.g. "/en/#sedes" vs "/en#sedes").
function getNavLinks(t: TFunction, prefix: string): NavEntry[] {
  const anchor = (id: string) => (prefix ? `${prefix}#${id}` : `/#${id}`)
  return [
    { label: t('nav.inicio'),        to: prefix || '/' },
    { label: t('nav.registro'),      to: anchor('sedes') },
    { label: t('nav.participantes'), to: anchor('participantes') },
    { label: t('nav.programa'),      to: anchor('programa') },
    // A diferencia de los 3 links de arriba, el footer no vive solo en
    // Home.tsx — <Footer/> se monta en App.tsx por fuera de <Routes>, así
    // que existe en el DOM sin importar la página actual. No hace falta
    // navegar a ningún lado para llegar a él, solo hacer scroll — por eso
    // usa `href` (anchor puro) en vez de `to` (ruta de react-router).
    { label: t('nav.contacto'),      href: '#footer' },
  ]
}

function LanguageSwitcher({ mobile, onNavigate }: { mobile?: boolean; onNavigate?: () => void }) {
  const location = useLocation()
  const currentLocale = getLocaleFromPathname(location.pathname)

  return (
    <div className={mobile ? 'flex items-center gap-2 py-4' : 'flex items-center gap-2'} style={labelStyle}>
      {ALL_LOCALES.map((loc, i) => (
        <span key={loc} className="flex items-center gap-2">
          {i > 0 && <span className="text-white/30" aria-hidden>·</span>}
          <Link
            to={localizePathname(location.pathname, loc)}
            onClick={onNavigate}
            aria-current={loc === currentLocale ? 'true' : undefined}
            className={`text-[10px] font-bold tracking-widest uppercase transition-colors ${loc === currentLocale ? 'text-white' : 'text-white/50 hover:text-white'}`}
          >
            {loc}
          </Link>
        </span>
      ))}
    </div>
  )
}

const linkClass =
  'relative font-mattone text-[11px] font-bold tracking-widest uppercase text-white/70 hover:text-white transition-colors duration-200 whitespace-nowrap ' +
  'after:absolute after:-bottom-1 after:left-0 after:h-px after:w-0 after:bg-white after:transition-all after:duration-300 hover:after:w-full'

const mobileLinkClass =
  'block font-mattone text-xs font-bold tracking-widest uppercase text-white/70 hover:text-white transition-colors duration-200 py-4 border-b border-white/10'

function NavLink({ entry, mobile, onClick }: { entry: NavEntry; mobile?: boolean; onClick?: () => void }) {
  const cls = mobile ? mobileLinkClass : linkClass

  // Links a secciones de Home ("/#programa") solo navegan: el scroll lo hace
  // el efecto de hash de Home.tsx (scrollToSection), tanto si ya estabas en
  // Home como si venías de otra página. Antes este click también scrolleaba
  // por su cuenta, y los dos scrolls se pisaban.
  if (entry.to) {
    return <Link to={entry.to} className={cls} onClick={onClick}>{entry.label}</Link>
  }

  // Plain in-page anchor (the footer, present on every route) — smooth-
  // scrolls directly instead of navigating, since there's nowhere to
  // navigate to: the target element already exists on the current page.
  if (entry.href?.startsWith('#')) {
    const targetId = entry.href.slice(1)
    const handleClick = (e: MouseEvent) => {
      e.preventDefault()
      onClick?.()
      document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' })
    }
    return <a href={entry.href} className={cls} onClick={handleClick}>{entry.label}</a>
  }

  return <a href={entry.href ?? '#'} className={cls} onClick={onClick}>{entry.label}</a>
}

function AccountLabel({ displayName }: { displayName: string }) {
  const { t } = useTranslation()
  return (
    <div className="flex items-start gap-1.5">
      <span className="mt-0.5 w-2 h-2 rounded-full bg-green-400 shrink-0" />
      <div className="flex flex-col gap-0">
        <span className="text-[10px] tracking-widest uppercase text-white/50 leading-none" style={labelStyle}>
          {t('nav.miCuenta')}
        </span>
        <span className="text-xs text-white leading-tight" style={labelStyle}>
          {displayName}
        </span>
      </div>
    </div>
  )
}

export function Navbar() {
  const [open, setOpen] = useState(false)
  const { user, userRole, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const isDesktop = useIsDesktop()
  const { t } = useTranslation()

  const currentLocale = getLocaleFromPathname(location.pathname)
  const prefix = currentLocale === DEFAULT_LOCALE ? '' : `/${currentLocale}`
  const navLinks = getNavLinks(t, prefix)

  const displayName = user?.displayName ?? user?.email?.split('@')[0] ?? ''

  const openLogin = () => {
    setOpen(false)
    const loginPath = `${prefix}/login`
    if (isDesktop) {
      navigate(loginPath, { state: { background: location, redirectAfterLogin: true } })
    } else {
      navigate(loginPath, { state: { redirectAfterLogin: true } })
    }
  }

  return (
    <header
      // pt-[env(...)] pushes the actual bar down below a notch/status bar in
      // portrait on a phone that has one — the header's own background
      // still fills that padding, so there's no gap, just brand-red instead
      // of page content showing through up there.
      className="fixed top-0 left-0 right-0 z-[100] pt-[env(safe-area-inset-top,0px)]"
      style={{ backgroundImage: `linear-gradient(to bottom, ${NAVBAR_BG}, transparent)` }}
    >
      {/* Barra principal — `mx-auto max-w-7xl`: mismo rail de contenido que
          Footer.tsx, InscripcionSection.tsx y SedeSection.tsx, para que en
          pantallas muy anchas el logo y los links no queden separados por un
          vacío creciente. El `header` en sí sigue ocupando el 100% del ancho
          (fondo edge-to-edge, la convención estándar de un navbar). */}
      <div className="mx-auto flex max-w-7xl items-center pr-8 pl-10 sm:pr-12 sm:pl-16 lg:pr-16 lg:pl-20 h-20">

        {/* Logo */}
        <Link to={prefix || '/'} className="shrink-0">
          <img
            src={logoDiasporas}
            alt="Diásporas Patrimoniales"
            width={300}
            height={314}
            className="h-10 w-auto object-contain"
          />
        </Link>

        {/* Links — solo desktop */}
        <nav className="hidden lg:flex items-center gap-5 flex-1 ml-10">
          {navLinks.map(entry => (
            <NavLink key={entry.label} entry={entry} />
          ))}
        </nav>

        {/* Auth + idioma — solo desktop */}
        <div className="hidden lg:flex items-center gap-4">
          <LanguageSwitcher />
          {user ? (
            <>
              {userRole === 'admin' && (
                <Link to={`${prefix}/admin`} className={linkClass}>{t('nav.admin')}</Link>
              )}
              <Link to={`${prefix}/perfil`}>
                <AccountLabel displayName={displayName} />
              </Link>
              <button
                onClick={signOut}
                className={`${linkClass} cursor-pointer`}
              >
                {t('nav.salir')}
              </button>
            </>
          ) : (
            <button onClick={openLogin} className={`${linkClass} cursor-pointer`}>
              {t('nav.login')}
            </button>
          )}
        </div>

        {/* Burger — tablet y mobile */}
        <button
          className="lg:hidden flex flex-col justify-center items-center gap-1.25 w-8 h-8 ml-auto"
          onClick={() => setOpen(prev => !prev)}
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
        >
          <span className={`block h-px w-6 bg-white transition-all duration-300 origin-center ${open ? 'translate-y-1.5 rotate-45' : ''}`} />
          <span className={`block h-px w-6 bg-white transition-all duration-300 ${open ? 'opacity-0' : ''}`} />
          <span className={`block h-px w-6 bg-white transition-all duration-300 origin-center ${open ? '-translate-y-1.5 -rotate-45' : ''}`} />
        </button>
      </div>

      {/* Menú móvil */}
      <div
        className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${open ? 'max-h-[32rem]' : 'max-h-0'}`}
        style={{ backgroundColor: NAVBAR_BG }}
      >
        <nav className="flex flex-col px-8 sm:px-12 pb-4">
          {navLinks.map(entry => (
            <NavLink key={entry.label} entry={entry} mobile onClick={() => setOpen(false)} />
          ))}

          <LanguageSwitcher mobile onNavigate={() => setOpen(false)} />

          {user ? (
            <>
              {userRole === 'admin' && (
                <Link
                  to={`${prefix}/admin`}
                  className={mobileLinkClass}
                  onClick={() => setOpen(false)}
                >
                  {t('nav.admin')}
                </Link>
              )}
              <Link
                to={`${prefix}/perfil`}
                className="py-4 border-b border-white/10"
                onClick={() => setOpen(false)}
              >
                <AccountLabel displayName={displayName} />
              </Link>
              <button
                onClick={() => { setOpen(false); signOut() }}
                className={`${mobileLinkClass} text-left cursor-pointer`}
              >
                {t('nav.cerrarSesion')}
              </button>
            </>
          ) : (
            <button
              onClick={openLogin}
              className={`${mobileLinkClass} text-left cursor-pointer`}
            >
              {t('nav.login')}
            </button>
          )}
        </nav>
      </div>
    </header>
  )
}
