import { lazy, Suspense, useEffect, useRef } from 'react'
import { Routes, Route, useLocation, useMatch, useNavigationType } from 'react-router-dom'
import type { Location } from 'react-router-dom'
import { AnimatePresence, motion, MotionConfig } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Navbar } from './components/Navbar'
import { Footer } from './components/Footer'
import { ErrorBoundary } from './components/ErrorBoundary'
import { CookieBanner } from './components/CookieBanner'
import { Home } from './pages/Home'
import { UnderConstruction } from './pages/UnderConstruction'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { DataProvider } from './contexts/DataContext'
import { AuthProvider } from './contexts/AuthContext'
import { ActividadInlineProvider } from './contexts/ActividadInlineContext'
import { pageVariants } from './utils/pageTransition'
import { scrollToSection } from './lib/scrollToSection'
import { getLocaleFromPathname, localizePathname } from './i18n/routing'
import { DEFAULT_LOCALE, LOCALE_TAGS } from './i18n/config'
import './App.css'

// Candado de prelanzamiento — pensado para la rama `main` (producción),
// no para `deploy`: si VITE_SITE_LOCKED no está en 'true' (no seteada, o
// cualquier otro valor), este bloque es un no-op y el sitio se comporta
// exactamente igual que antes; así el mismo código sirve para ambas ramas,
// solo cambia la config de entorno en Vercel según el deploy. Con el
// candado activo, cualquier ruta muestra UnderConstruction salvo que el
// navegador ya se haya desbloqueado antes.
//
// Desbloqueo: un link con `?key=<VITE_PREVIEW_KEY>` (compartido a mano con
// quien deba ver el sitio antes del lanzamiento, no un login) guarda el
// desbloqueo en localStorage la primera vez que se abre — de ahí en más
// ese navegador navega todo el sitio con normalidad, sin repetir el
// parámetro. El día del lanzamiento, VITE_SITE_LOCKED pasa a 'false' (o se
// borra) y el candado desaparece para todos sin tocar código.
const SITE_LOCKED = import.meta.env.VITE_SITE_LOCKED === 'true'
const PREVIEW_KEY = import.meta.env.VITE_PREVIEW_KEY as string | undefined
const UNLOCK_STORAGE_KEY = 'site_unlocked'

function useSiteUnlocked(): boolean {
  const location = useLocation()

  // Derivado directo del render (no estado): así `unlocked` refleja el
  // `?key=` correcto en el mismo render en que llega, sin esperar a que un
  // efecto dispare un setState (el linter de hooks no deja hacer eso
  // síncronamente dentro de un efecto, con razón — dispara un render en
  // cascada evitable). El efecto de abajo solo hace el trabajo que sí le
  // corresponde a un efecto: el side effect de persistir y limpiar la URL.
  const keyMatches = SITE_LOCKED && !!PREVIEW_KEY && new URLSearchParams(location.search).get('key') === PREVIEW_KEY
  const storedUnlocked = SITE_LOCKED && localStorage.getItem(UNLOCK_STORAGE_KEY) === 'true'
  const unlocked = !SITE_LOCKED || keyMatches || storedUnlocked

  useEffect(() => {
    if (!keyMatches) return
    localStorage.setItem(UNLOCK_STORAGE_KEY, 'true')

    // Saca el `?key=...` de la URL visible una vez consumido, para que no
    // quede pegado en el historial ni en un screenshot/link reenviado.
    const params = new URLSearchParams(location.search)
    params.delete('key')
    const newSearch = params.toString()
    window.history.replaceState(null, '', location.pathname + (newSearch ? `?${newSearch}` : '') + location.hash)
  }, [keyMatches, location.pathname, location.search, location.hash])

  return unlocked
}

const Intro          = lazy(() => import('./pages/Intro').then(m          => ({ default: m.Intro          })))
const ActividadPage  = lazy(() => import('./pages/ActividadPage').then(m  => ({ default: m.ActividadPage  })))
const ProfilePage    = lazy(() => import('./pages/ProfilePage').then(m    => ({ default: m.ProfilePage    })))
const AdminPage      = lazy(() => import('./pages/AdminPage').then(m      => ({ default: m.AdminPage      })))
const PrivacidadPage = lazy(() => import('./pages/PrivacidadPage').then(m => ({ default: m.PrivacidadPage })))
const AvisoLegalPage = lazy(() => import('./pages/AvisoLegalPage').then(m => ({ default: m.AvisoLegalPage })))
const ActividadModal = lazy(() => import('./components/map/ActividadModal').then(m => ({ default: m.ActividadModal })))
const AuthPage       = lazy(() => import('./pages/AuthPage').then(m       => ({ default: m.AuthPage       })))
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
    <Route key="aviso-legal" path="aviso-legal" element={<AvisoLegalPage />} />,
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
  const unlocked = useSiteUnlocked()

  // El id de la actividad abierta inline (si la URL real apunta a
  // /actividades/:id mientras el contenido principal se queda "congelado"
  // en background) — InscripcionSection/ProfilePage lo leen vía
  // useOpenActividadId() para decidir si tienen que mostrar el panel
  // ActividadExpandido, sin necesitar acceso a la ubicación real ellos
  // mismos (ver el comentario en ActividadInlineContext.tsx). Solo importa
  // cuando hay background — sin él, la URL real y la visible ya coinciden,
  // así que ActividadPage se renderiza como página completa normal, sin
  // nada inline que resolver.
  const matchActividadRoot = useMatch('/actividades/:id')
  const matchActividadLang = useMatch('/:lang/actividades/:id')
  const openActividadId = background
    ? Number((matchActividadRoot ?? matchActividadLang)?.params.id) || null
    : null

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

  // Todo el scroll por navegación vive acá, no en las páginas: debajo de
  // <Routes location={...}> React Router reporta useNavigationType()
  // siempre como 'POP', así que solo este nivel sabe si fue un click
  // (PUSH/REPLACE) o un back/forward.
  //  - Link con hash ("/#programa", navbar/hero): scroll a esa sección de
  //    Home, venga de Home o de otra página (scrollToSection espera a que
  //    la sección lazy exista y corrige si la página crece mientras tanto).
  //  - Cambio de página (ej. Home → /perfil desde "Mi cuenta"): arrancar
  //    arriba — sin esto se heredaba el scroll de Home y, como /perfil es
  //    mucho más corta, se caía directo en el footer.
  //  - Misma URL otra vez (ej. "Inicio" o el logo estando ya en Home):
  //    subir en suave.
  // No aplica a back/forward (POP — Home restaura su propio scroll), a
  // modales con `background` (la página de fondo no cambia), ni a un cambio
  // de idioma solo (/perfil → /en/perfil es la misma página).
  const pathSinIdioma = localizePathname(location.pathname, DEFAULT_LOCALE)
  const prevRef = useRef({ pathSinIdioma, pathname: location.pathname, key: location.key })
  useEffect(() => {
    const prev = prevRef.current
    prevRef.current = { pathSinIdioma, pathname: location.pathname, key: location.key }
    if (navType === 'POP' || background) return
    if (location.hash) return scrollToSection(location.hash.slice(1))
    if (prev.pathSinIdioma !== pathSinIdioma) {
      window.scrollTo({ top: 0, behavior: 'instant' })
    } else if (prev.pathname === location.pathname && prev.key !== location.key) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [pathSinIdioma, location.pathname, location.key, navType, background, location.hash])

  // Todos los hooks de arriba tienen que correr siempre, en el mismo orden,
  // así que este return recién puede ir acá — antes de esto rompería las
  // Rules of Hooks apenas `unlocked` cambiara de valor entre renders.
  if (!unlocked) return <UnderConstruction />

  // /intro is a full-screen route that opts out of the site chrome entirely
  // (no Navbar, no page-transition wrapper, no Footer/CookieBanner). Branching
  // on the pathname here keeps the normal branch byte-identical to before, so
  // every other page renders exactly as it did.
  if (location.pathname === '/intro') {
    return (
      <ErrorBoundary>
      {/* reducedMotion="user" reads prefers-reduced-motion once, here, and
          applies it to every motion.* component in the tree below —
          transform/layout animations simplify or drop automatically
          instead of each of them needing its own check. */}
      <MotionConfig reducedMotion="user">
      <AuthProvider>
        <DataProvider>
          <Suspense fallback={null}>
            <Routes>
              <Route path="/intro" element={<Intro />} />
            </Routes>
          </Suspense>
        </DataProvider>
      </AuthProvider>
      </MotionConfig>
      </ErrorBoundary>
    )
  }

  return (
    <ErrorBoundary>
    <MotionConfig reducedMotion="user">
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
              <ActividadInlineProvider value={openActividadId}>
                <Routes location={background ?? location}>
                  <Route path="/">{pageRoutes()}</Route>
                  <Route path="/:lang">{pageRoutes()}</Route>
                </Routes>
              </ActividadInlineProvider>
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
    </MotionConfig>
    </ErrorBoundary>
  )
}
