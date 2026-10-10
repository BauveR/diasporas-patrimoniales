import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { initializeFirestore } from 'firebase/firestore'
import { modoCompatibleActivo } from './conexion'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
// Por defecto el SDK detecta solo si tiene que caer a long polling. En el
// navegador donde eso ya falló (botón "Reintentar" de ConexionError) se
// fuerza — ver lib/conexion.ts.
export const db = initializeFirestore(app, modoCompatibleActivo() ? { experimentalForceLongPolling: true } : {})
