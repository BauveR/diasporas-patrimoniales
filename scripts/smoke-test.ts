import { initializeApp } from 'firebase/app'
import { getAuth, connectAuthEmulator, createUserWithEmailAndPassword } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator, doc, setDoc, runTransaction, serverTimestamp } from 'firebase/firestore'
import { initializeApp as initAdminApp } from 'firebase-admin/app'
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore'

process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080'
process.env.GCLOUD_PROJECT = 'demo-stress-test'

const adminApp = initAdminApp({ projectId: 'demo-stress-test' })
const adminDb = getAdminFirestore(adminApp)

async function main() {
  await adminDb.doc('actividades/999999').set({
    id: 999999, titulo: 'smoke', sedeId: 1, descripcion: 'x', fecha: '2099-01-01',
    hora: '10:00', duracion: '1h', dificultad: 'Fácil', plazas: 5, plazasDisponibles: 5,
    tematica: 'Arqueología', organizador: '', contacto: '', puntoEncuentro: '', cancelada: false,
  })

  const app = initializeApp({ projectId: 'demo-stress-test', apiKey: 'demo-key' }, 'smoke-1')
  const auth = getAuth(app)
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  const db = getFirestore(app)
  connectFirestoreEmulator(db, '127.0.0.1', 8080)
  const cred = await createUserWithEmailAndPassword(auth, 'smoke-1@test.local', 'Password123!')
  console.log('signed up', cred.user.uid, cred.user.email)
  console.log('idToken claims:', JSON.stringify(await cred.user.getIdTokenResult()))

  await setDoc(doc(db, 'users', cred.user.uid), { email: cred.user.email, displayName: null, role: 'user', createdAt: serverTimestamp() })
  console.log('user doc written')

  const actividadRef = doc(db, 'actividades', '999999')
  const inscritoRef = doc(db, 'actividades', '999999', 'inscritos', cred.user.uid)
  try {
    await runTransaction(db, async tx => {
      const [aSnap] = await Promise.all([tx.get(actividadRef), tx.get(inscritoRef)])
      const a = aSnap.data() as { plazasDisponibles: number }
      console.log('actividad snap', a)
      tx.set(inscritoRef, { uid: cred.user.uid, email: cred.user.email, displayName: 'Smoke', telefono: '600', inscritoEn: serverTimestamp(), aceptoTerminos: true, terminosVersion: 'v1' })
      tx.update(actividadRef, { plazasDisponibles: a.plazasDisponibles - 1 })
    })
    console.log('TRANSACTION SUCCEEDED')
  } catch (err) {
    console.error('TRANSACTION FAILED:', err)
  }

  await adminDb.doc('actividades/999999').delete()
}

main()
