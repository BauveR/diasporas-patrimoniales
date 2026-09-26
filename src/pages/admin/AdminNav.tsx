import { Link } from 'react-router-dom'
import { labelStyle } from '../../lib/styles'
import { type AdminSection, type NavItem, NAV_ITEMS } from './navConfig'

export function Sidebar({ section, setSection }: { section: AdminSection; setSection: (s: AdminSection) => void }) {
  return (
    <aside
      className="hidden sm:flex fixed top-navbar left-0 bottom-0 z-40 flex-col sm:w-14 lg:w-55 overflow-hidden bg-black"
      style={labelStyle}
    >
      {/* Logo row — lg only */}
      <div className="hidden lg:flex items-center gap-3 px-5 h-14 border-b border-white/10 shrink-0">
        <div className="w-5 h-5 rounded-md bg-brand-red flex items-center justify-center shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
            <path d="M3 21h18M6 21V7l6-4 6 4v14" />
          </svg>
        </div>
        <span className="font-mattone text-white/70 text-[10px] font-bold tracking-[0.2em] uppercase whitespace-nowrap">
          Administración
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 flex flex-col gap-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ key, label, sublabel, Icon }) => {
          const active = section === key
          return (
            <button
              key={key}
              onClick={() => setSection(key)}
              className={`flex items-center gap-3.5 py-3 px-4 lg:px-5 w-full transition-colors cursor-pointer
                sm:justify-center lg:justify-start
                ${active ? 'text-white bg-brand-red' : 'text-white/55 hover:text-white hover:bg-white/10'}`}
            >
              <span className="shrink-0"><Icon /></span>
              <span className="hidden lg:flex flex-col items-start min-w-0">
                <span className="text-[11px] tracking-widest uppercase whitespace-nowrap">{label}</span>
                <span className={`text-[9px] tracking-widest whitespace-nowrap ${active ? 'text-white/70' : 'text-white/30'}`}>
                  {sublabel}
                </span>
              </span>
            </button>
          )
        })}
      </nav>

      {/* Back to site */}
      <div className="shrink-0 py-3 border-t border-white/10">
        <Link
          to="/"
          className="flex items-center gap-3 py-2.5 px-4 lg:px-5 text-white/40 hover:text-white/80 transition-colors sm:justify-center lg:justify-start"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          <span className="hidden lg:block text-[10px] tracking-widest uppercase whitespace-nowrap">
            Volver al sitio
          </span>
        </Link>
      </div>
    </aside>
  )
}

export function MobileTabBar({ section, setSection }: { section: AdminSection; setSection: (s: AdminSection) => void }) {
  return (
    <nav
      className="sm:hidden fixed bottom-0 inset-x-0 z-40 border-t border-white/10 flex items-stretch pb-[env(safe-area-inset-bottom,0px)] bg-black"
      style={labelStyle}
    >
      {NAV_ITEMS.map(({ key, label, Icon }) => {
        const active = section === key
        return (
          <button
            key={key}
            onClick={() => setSection(key)}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 transition-colors cursor-pointer relative
              ${active ? 'text-white' : 'text-white/50'}`}
          >
            {active && (
              <span className="absolute top-0 inset-x-0 h-0.5 bg-brand-red" />
            )}
            <Icon />
            <span className="text-[8px] tracking-widest uppercase">{label}</span>
          </button>
        )
      })}
    </nav>
  )
}

export function ContentHeader({ item }: { item: NavItem }) {
  return (
    <div className="bg-black border-b border-white/10 px-6 sm:px-8 pt-8 pb-7">
      <p className="font-mattone text-[10px] font-bold tracking-widest text-brand-red uppercase mb-1.5">
        {item.sublabel}
      </p>
      <h1 className="font-mattone text-2xl font-bold text-white uppercase tracking-tight">
        {item.label}
      </h1>
    </div>
  )
}
