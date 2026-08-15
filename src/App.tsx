import { lazy, Suspense } from 'react'
import { Routes, Route, useLocation, useNavigationType } from 'react-router-dom'
import type { Location } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Navbar } from './components/Navbar'
import { ErrorBoundary } from './components/ErrorBoundary'
import { CookieBanner } from './components/CookieBanner'
import { Home } from './pages/Home'
import { AuthPage } from './pages/AuthPage'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { DataProvider } from './contexts/DataContext'
import { MapUIProvider } from './contexts/MapUIContext'
import { AuthProvider } from './contexts/AuthContext'
import { pageVariants } from './utils/pageTransition'
import './App.css'

const ActividadPage  = lazy(() => import('./pages/ActividadPage').then(m  => ({ default: m.ActividadPage  })))
const ProfilePage    = lazy(() => import('./pages/ProfilePage').then(m    => ({ default: m.ProfilePage    })))
const AdminPage      = lazy(() => import('./pages/AdminPage').then(m      => ({ default: m.AdminPage      })))
const PasaportePage  = lazy(() => import('./pages/PasaportePage').then(m  => ({ default: m.PasaportePage  })))
const ContactoPage   = lazy(() => import('./pages/ContactoPage').then(m   => ({ default: m.ContactoPage   })))
const PrivacidadPage = lazy(() => import('./pages/PrivacidadPage').then(m => ({ default: m.PrivacidadPage })))
const ActividadModal = lazy(() => import('./components/map/ActividadModal').then(m => ({ default: m.ActividadModal })))
const AuthModal      = lazy(() => import('./components/auth/AuthModal').then(m     => ({ default: m.AuthModal     })))

export default function App() {
  const location = useLocation()
  const navType = useNavigationType()
  const isBack = navType === 'POP'
  const background = location.state?.background as Location | undefined

  return (
    <ErrorBoundary>
    <AuthProvider>
      <DataProvider>
      <MapUIProvider>
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
                <Route path="/" element={<Home />} />
                <Route path="/actividades/:id" element={<ActividadPage />} />
                <Route path="/login" element={<AuthPage />} />
                <Route path="/perfil" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminPage /></ProtectedRoute>} />
                <Route path="/pasaporte" element={<PasaportePage />} />
                <Route path="/contacto" element={<ContactoPage />} />
                <Route path="/privacidad" element={<PrivacidadPage />} />
              </Routes>
            </Suspense>
          </motion.div>
        </AnimatePresence>

        {/* Modal overlay — shown when navigated with background state */}
        <AnimatePresence>
          {background && (
            <Suspense fallback={null}>
              <Routes key="modal">
                <Route path="/actividades/:id" element={<ActividadModal />} />
                <Route path="/login" element={<AuthModal />} />
                <Route path="*" element={null} />
              </Routes>
            </Suspense>
          )}
        </AnimatePresence>
        <CookieBanner />
      </MapUIProvider>
      </DataProvider>
    </AuthProvider>
    </ErrorBoundary>
  )
}
