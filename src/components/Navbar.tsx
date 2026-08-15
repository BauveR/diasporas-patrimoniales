import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'

import { useAuth } from '../contexts/AuthContext'
import { useIsDesktop } from '../hooks/useIsDesktop'

const labelStyle = { fontFamily: "'Open Sans', sans-serif" }

type NavEntry = { label: string; to?: string; href?: string }

const NAV_LINKS: NavEntry[] = [
  { label: 'Inicio',                to: '/' },
  { label: 'Sedes',             to: '/#sedes' },
  { label: 'Rutas y Eventos',       to: '/#actividades' },
  { label: 'Pasaporte Patrimonial', to: '/pasaporte' },
  { label: 'Contacto',              to: '/contacto' },
]

const linkClass =
  'relative text-xs tracking-widest uppercase text-stone-500 hover:text-stone-900 transition-colors duration-200 whitespace-nowrap ' +
  'after:absolute after:-bottom-1 after:left-0 after:h-px after:w-0 after:bg-stone-900 after:transition-all after:duration-300 hover:after:w-full'

const mobileLinkClass =
  'block text-xs tracking-widest uppercase text-stone-500 hover:text-stone-900 transition-colors duration-200 py-4 border-b border-stone-100'

function NavLink({ entry, mobile, onClick }: { entry: NavEntry; mobile?: boolean; onClick?: () => void }) {
  const location = useLocation()
  const cls = mobile ? mobileLinkClass : linkClass

  if (entry.to?.startsWith('/#')) {
    const sectionId = entry.to.slice(2)
    const handleClick = () => {
      onClick?.()
      if (location.pathname === '/') {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' })
      }
    }
    return <Link to={entry.to} className={cls} style={labelStyle} onClick={handleClick}>{entry.label}</Link>
  }

  if (entry.to) {
    return <Link to={entry.to} className={cls} style={labelStyle} onClick={onClick}>{entry.label}</Link>
  }
  return <a href={entry.href ?? '#'} className={cls} style={labelStyle} onClick={onClick}>{entry.label}</a>
}

function AccountLabel({ displayName }: { displayName: string }) {
  return (
    <div className="flex items-start gap-1.5">
      <span className="mt-0.5 w-2 h-2 rounded-full bg-green-400 shrink-0" />
      <div className="flex flex-col gap-0">
        <span className="text-[10px] tracking-widest uppercase text-stone-400 leading-none" style={labelStyle}>
          Mi cuenta
        </span>
        <span className="text-xs text-stone-700 leading-tight" style={labelStyle}>
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

  const displayName = user?.displayName ?? user?.email?.split('@')[0] ?? ''

  const openLogin = () => {
    setOpen(false)
    if (isDesktop) {
      navigate('/login', { state: { background: location, redirectAfterLogin: true } })
    } else {
      navigate('/login', { state: { redirectAfterLogin: true } })
    }
  }

  return (
    <header
      className="fixed top-0 left-0 right-0 z-[100] bg-white border-b border-stone-100"
    >
      {/* Barra principal */}
      <div className="flex items-center px-6 sm:px-8 h-16">

        {/* Logo */}
        <Link
          to="/"
          className="text-[11px] sm:text-sm tracking-widest uppercase whitespace-nowrap"
          style={{ fontFamily: "'Google Sans Flex', sans-serif", fontVariationSettings: "'wght' 100", color: '#b19e7b' }}
        >
          Sedes Históricas de Canarias
        </Link>

        {/* Links — solo desktop */}
        <nav className="hidden lg:flex items-center gap-8 flex-1 ml-10">
          {NAV_LINKS.map(entry => (
            <NavLink key={entry.label} entry={entry} />
          ))}
        </nav>

        {/* Auth — solo desktop */}
        <div className="hidden lg:flex items-center gap-5">
          {user ? (
            <>
              {userRole === 'admin' && (
                <Link to="/admin" className={linkClass} style={labelStyle}>Admin</Link>
              )}
              <Link to="/perfil">
                <AccountLabel displayName={displayName} />
              </Link>
              <button
                onClick={signOut}
                className={`${linkClass} cursor-pointer`}
                style={labelStyle}
              >
                Salir
              </button>
            </>
          ) : (
            <button onClick={openLogin} className={`${linkClass} cursor-pointer`} style={labelStyle}>
              Login / Mi Cuenta
            </button>
          )}
        </div>

        {/* Burger — tablet y mobile */}
        <button
          className="lg:hidden flex flex-col justify-center items-center gap-1.25 w-8 h-8 ml-auto"
          onClick={() => setOpen(prev => !prev)}
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
        >
          <span className={`block h-px w-6 bg-stone-800 transition-all duration-300 origin-center ${open ? 'translate-y-1.5 rotate-45' : ''}`} />
          <span className={`block h-px w-6 bg-stone-800 transition-all duration-300 ${open ? 'opacity-0' : ''}`} />
          <span className={`block h-px w-6 bg-stone-800 transition-all duration-300 origin-center ${open ? '-translate-y-1.5 -rotate-45' : ''}`} />
        </button>
      </div>

      {/* Menú móvil */}
      <div className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out bg-white ${open ? 'max-h-[32rem]' : 'max-h-0'}`}>
        <nav className="flex flex-col px-6 sm:px-8 pb-4">
          {NAV_LINKS.map(entry => (
            <NavLink key={entry.label} entry={entry} mobile onClick={() => setOpen(false)} />
          ))}

          {user ? (
            <>
              {userRole === 'admin' && (
                <Link
                  to="/admin"
                  className={mobileLinkClass}
                  style={labelStyle}
                  onClick={() => setOpen(false)}
                >
                  Admin
                </Link>
              )}
              <Link
                to="/perfil"
                className="py-4 border-b border-stone-100"
                onClick={() => setOpen(false)}
              >
                <AccountLabel displayName={displayName} />
              </Link>
              <button
                onClick={() => { setOpen(false); signOut() }}
                className={`${mobileLinkClass} text-left cursor-pointer`}
                style={labelStyle}
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            <button
              onClick={openLogin}
              className={`${mobileLinkClass} text-left cursor-pointer`}
              style={labelStyle}
            >
              Login / Mi Cuenta
            </button>
          )}
        </nav>
      </div>
    </header>
  )
}
