import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route, useLocation, useNavigationType } from 'react-router-dom'
import type { Location } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Navbar } from './components/Navbar'
import { Footer } from './components/Footer'
import { ErrorBoundary } from './components/ErrorBoundary'
import { CookieBanner } from './components/CookieBanner'
import { Home } from './pages/Home'
import { AuthPage } from './pages/AuthPage'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { DataProvider } from './contexts/DataContext'
import { AuthProvider } from './contexts/AuthContext'
import { pageVariants } from './utils/pageTransition'
import { getLocaleFromPathname } from './i18n/routing'
import { LOCALE_TAGS } from './i18n/config'
import './App.css'

const ActividadPage  = lazy(() => import('./pages/ActividadPage').then(m  => ({ default: m.ActividadPage  })))
const ProfilePage    = lazy(() => import('./pages/ProfilePage').then(m    => ({ default: m.ProfilePage    })))
const AdminPage      = lazy(() => import('./pages/AdminPage').then(m      => ({ default: m.AdminPage      })))
const PrivacidadPage = lazy(() => import('./pages/PrivacidadPage').then(m => ({ default: m.PrivacidadPage })))
const ActividadModal = lazy(() => import('./components/map/ActividadModal').then(m => ({ default: m.ActividadModal })))
const AuthModal      = lazy(() => import('./components/auth/AuthModal').then(m     => ({ default: m.AuthModal     })))

// Same page set rendered twice below — once unprefixed (Spanish, the
// default) and once nested under "/:lang" (en/fr/pt) — so both trees stay
// in sync from a single list instead of two hand-maintained copies.
function pageRoutes() {
  return [
    <Route key="home" index element={<Home />} />,
    <Route key="actividad" path="actividades/:id" element={<ActividadPage />} />,
    <Route key="login" path="login" element={<AuthPage />} />,
    <Route key="perfil" path="perfil" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />,
    <Route key="admin" path="admin" element={<ProtectedRoute requiredRole="admin"><AdminPage /></ProtectedRoute>} />,
    <Route key="privacidad" path="privacidad" element={<PrivacidadPage />} />,
  ]
}

function modalRoutes() {
  return [
    <Route key="actividad-modal" path="actividades/:id" element={<ActividadModal />} />,
    <Route key="login-modal" path="login" element={<AuthModal />} />,
    <Route key="modal-catchall" path="*" element={null} />,
  ]
}

export default function App() {
  const location = useLocation()
  const navType = useNavigationType()
  const isBack = navType === 'POP'
  const background = location.state?.background as Location | undefined
  const { i18n } = useTranslation()

  // The URL is the single source of truth for the active language (no
  // prefix = Spanish, /en, /fr, /pt = the rest) — this keeps it in sync
  // whenever the pathname changes, including back/forward navigation.
  // <html lang> isn't part of the React tree React 19 can hoist tags into,
  // so it's set imperatively here alongside the i18next language switch.
  const urlLocale = getLocaleFromPathname(location.pathname)
  useEffect(() => {
    if (i18n.language !== urlLocale) i18n.changeLanguage(urlLocale)
    document.documentElement.lang = LOCALE_TAGS[urlLocale]
  }, [urlLocale, i18n])

  return (
    <ErrorBoundary>
    <AuthProvider>
      <DataProvider>
        <Navbar />

        {/* Main content — renders background location when modal is open */}
        <AnimatePresence>
          <motion.div
            key={(background ?? location).pathname}
            custom={isBack}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <Suspense fallback={null}>
              <Routes location={background ?? location}>
                <Route path="/">{pageRoutes()}</Route>
                <Route path="/:lang">{pageRoutes()}</Route>
              </Routes>
            </Suspense>
          </motion.div>
        </AnimatePresence>

        {/* Modal overlay — shown when navigated with background state */}
        <AnimatePresence>
          {background && (
            <Suspense fallback={null}>
              <Routes key="modal">
                <Route path="/">{modalRoutes()}</Route>
                <Route path="/:lang">{modalRoutes()}</Route>
              </Routes>
            </Suspense>
          )}
        </AnimatePresence>
        <Footer />
        <CookieBanner />
      </DataProvider>
    </AuthProvider>
    </ErrorBoundary>
  )
}
