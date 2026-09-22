import { cert, getApps, initializeApp, type App } from 'firebase-admin/app'

// Vercel puede reusar la misma instancia de la función entre invocaciones
// ("warm start"): sin este guard, initializeApp() lanzaría "already exists".
export function getAdminApp(): App {
  const existing = getApps()[0]
  if (existing) return existing

  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  // El JSON de la service account trae \n literales dentro del string de la
  // clave; las variables de entorno de Vercel no preservan saltos de línea
  // reales, así que llegan escapadas y hay que desescaparlas a mano.
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Faltan credenciales de Firebase Admin en las variables de entorno')
  }

  return initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) })
}
