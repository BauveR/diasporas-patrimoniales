import { useLocation } from 'react-router-dom'

import { useAuth } from '../contexts/AuthContext'
import { PillNav, type PillNavItem } from './PillNav'
import logo from '../assets/diasporas patrimoniales-04.png'

const BASE_LINKS: PillNavItem[] = [
  { label: 'Inicio',                href: '/' },
  { label: 'Sedes',                 href: '/#sedes' },
  { label: 'Rutas y Eventos',       href: '/#actividades' },
  { label: 'Pasaporte Patrimonial', href: '/pasaporte' },
  { label: 'Contacto',              href: '/contacto' },
]

export function Navbar() {
  const { user, userRole } = useAuth()
  const location = useLocation()

  const items: PillNavItem[] = [
    ...BASE_LINKS,
    ...(userRole === 'admin' ? [{ label: 'Admin', href: '/admin' }] : []),
    user ? { label: 'Mi Cuenta', href: '/perfil' } : { label: 'Login / Mi Cuenta', href: '/login' },
  ]

  return (
    <div className="fixed inset-x-0 top-0 z-1000 flex justify-center">
      <PillNav
        logo={logo}
        logoAlt="Diásporas Patrimoniales"
        items={items}
        activeHref={location.pathname}
        baseColor="#f04f23"
        pillColor="#ffffff"
        hoveredPillTextColor="#ffffff"
        pillTextColor="#000000"
      />
    </div>
  )
}
