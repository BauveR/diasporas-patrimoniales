import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import type { UserRole } from '../../contexts/AuthContext'
import { ConexionError } from '../ConexionError'
import { useTranslation } from 'react-i18next'
import { loginPath } from '../../i18n/routing'

type Props = {
  children: ReactNode
  requiredRole?: UserRole
}

export function ProtectedRoute({ children, requiredRole }: Props) {
  const { user, userRole, loading, authError } = useAuth()
  const location = useLocation()
  const { t } = useTranslation()

  if (authError) return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6 pt-navbar">
      <ConexionError />
    </div>
  )

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <p className="text-[10px] tracking-widest uppercase text-stone-500" style={{ fontFamily: "'Open Sans', sans-serif" }}>
        {t('conexion.cargando')}
      </p>
    </div>
  )

  if (!user) {
    // Página que está saliendo: App.tsx la mantiene montada durante la
    // animación de salida con su ubicación congelada. Al pulsar "Salir" en
    // Mi perfil, el Navbar ya navegó al inicio, pero esta copia veía la
    // sesión cerrada y redirigía al login por encima. Solo redirige la
    // página que de verdad está en la URL.
    if (window.location.pathname !== location.pathname) return null
    // Con el idioma actual: el enlace "Mi perfil" desde /en llevaba al login
    // en /login (sin prefijo).
    return <Navigate to={loginPath(location.pathname)} state={{ returnTo: location.pathname, redirectAfterLogin: true }} replace />
  }

  if (requiredRole === 'admin' && userRole !== 'admin') {
    return <Navigate to="/perfil" replace />
  }

  return <>{children}</>
}
