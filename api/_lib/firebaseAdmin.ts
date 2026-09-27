import { cert, getApps, initializeApp, type App } from 'firebase-admin/app'

type ServiceAccountJson = {
  project_id: string
  client_email: string
  private_key: string
}

// Vercel puede reusar la misma instancia de la función entre invocaciones
// ("warm start"): sin este guard, initializeApp() lanzaría "already exists".
export function getAdminApp(): App {
  const existing = getApps()[0]
  if (existing) return existing

  // Una sola variable en base64 con el JSON completo de la service account,
  // en vez de 3 variables separadas: la private_key es un PEM multilínea
  // con \n literales que se rompe fácil al copiar/pegar a mano en la UI de
  // Vercel (comillas de más, \n convertidos a salto real, espacios). Base64
  // es un único token sin caracteres especiales, así que no hay nada que
  // se pueda mangling al pegarlo.
  const encoded = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64
  if (!encoded) {
    throw new Error('Falta FIREBASE_SERVICE_ACCOUNT_BASE64 en las variables de entorno')
  }

  let serviceAccount: ServiceAccountJson
  try {
    serviceAccount = JSON.parse(Buffer.from(encoded, 'base64').toString('utf8')) as ServiceAccountJson
  } catch {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_BASE64 no es un base64 de JSON válido')
  }

  return initializeApp({
    credential: cert({
      projectId: serviceAccount.project_id,
      clientEmail: serviceAccount.client_email,
      privateKey: serviceAccount.private_key,
    }),
  })
}
