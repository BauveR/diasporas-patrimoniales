// Stress test del descuento/liberación de plazas — corre SOLO contra el
// Emulador de Firestore/Auth, nunca contra el proyecto real (ver
// FIRESTORE_EMULATOR_HOST/PROJECT_ID más abajo: un projectId "demo-" no
// existe en GCP, así que ni con credenciales reales tocaría datos de
// verdad). Ejecutar con:
//
//   npm run test:stress
//
// (arranca los emuladores con las reglas reales de firestore.rules, corre
// este script, los apaga — ver firebase.json).
//
// Reimplementa a propósito la misma lógica de transacción que
// src/lib/db.ts (inscribirse/inscribirseAmbosDias/liberarPlaza) en vez de
// importar ese archivo: db.ts importa src/lib/firebase.ts, que lee
// `import.meta.env.VITE_FIREBASE_*` — una variable que el pipeline de Vite
// inyecta en build time y que no existe bajo Node/tsx, así que ese import
// rompería al cargarse acá. Si la lógica real en db.ts cambia, esta copia
// hay que actualizarla a mano — cada función abajo dice a cuál espeja.

import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, connectAuthEmulator, createUserWithEmailAndPassword, type Auth } from 'firebase/auth'
import {
  getFirestore, connectFirestoreEmulator, doc, setDoc, updateDoc, runTransaction, serverTimestamp,
  type Firestore,
} from 'firebase/firestore'
// API modular (no el default export namespaced) — mismo patrón que ya usa
// api/_lib/firebaseAdmin.ts en este proyecto.
import { initializeApp as initAdminApp } from 'firebase-admin/app'
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore'

const PROJECT_ID = 'demo-stress-test'
const AUTH_EMULATOR_URL = 'http://127.0.0.1:9099'
const FIRESTORE_EMULATOR_HOST = '127.0.0.1'
const FIRESTORE_EMULATOR_PORT = 8080

process.env.FIRESTORE_EMULATOR_HOST = `${FIRESTORE_EMULATOR_HOST}:${FIRESTORE_EMULATOR_PORT}`
process.env.GCLOUD_PROJECT = PROJECT_ID

let pass = 0
let fail = 0
function check(label: string, ok: boolean, detail?: string) {
  if (ok) { pass++; console.log(`  ✓ ${label}`) }
  else { fail++; console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ''}`) }
}

// ── Admin SDK: seed/cleanup/lectura final, sin pasar por las reglas ───────

const adminApp = initAdminApp({ projectId: PROJECT_ID })
const adminDb = getAdminFirestore(adminApp)

async function seedActividad(id: number, plazas: number, extra: { plazasDisponibles?: number; cancelada?: boolean } = {}) {
  await adminDb.doc(`actividades/${id}`).set({
    id, titulo: `Stress ${id}`, sedeId: 1, descripcion: 'stress test',
    fecha: '2099-01-01', hora: '10:00', duracion: '1h', dificultad: 'Fácil',
    plazas, plazasDisponibles: plazas, tematica: 'Arqueología',
    organizador: '', contacto: '', puntoEncuentro: '', cancelada: false,
    ...extra,
  })
}

async function borrarActividad(id: number) {
  const inscritos = await adminDb.collection(`actividades/${id}/inscritos`).listDocuments()
  await Promise.all(inscritos.map(d => d.delete()))
  await adminDb.doc(`actividades/${id}`).delete()
}

async function leerActividad(id: number) {
  const snap = await adminDb.doc(`actividades/${id}`).get()
  return snap.data() as { plazas: number; plazasDisponibles: number }
}

async function contarInscritos(id: number): Promise<number> {
  const snap = await adminDb.collection(`actividades/${id}/inscritos`).get()
  return snap.size
}

// ── Espejo de src/lib/db.ts ────────────────────────────────────────────────

class SinPlazasError extends Error { constructor() { super('SIN_PLAZAS') } }
class YaLiberadaError extends Error { constructor() { super('YA_LIBERADA') } }

// Espeja assertInscribible() — solo la parte de plazas/cancelada, esta
// suite no ejercita fechaAperturaInscripciones.
function assertInscribible(actividad: { cancelada?: boolean; plazasDisponibles?: number }) {
  if (actividad.cancelada) throw new Error('EVENTO_CANCELADO')
  if ((actividad.plazasDisponibles ?? 0) <= 0) throw new SinPlazasError()
}

// Espeja inscribirse()
async function inscribirseTest(db: Firestore, actividadId: number, uid: string, email: string): Promise<void> {
  const actividadRef = doc(db, 'actividades', String(actividadId))
  const inscritoRef = doc(db, 'actividades', String(actividadId), 'inscritos', uid)
  await runTransaction(db, async tx => {
    const [actividadSnap, inscritoSnap] = await Promise.all([tx.get(actividadRef), tx.get(inscritoRef)])
    if (!actividadSnap.exists()) return
    if (inscritoSnap.exists()) return
    const actividad = actividadSnap.data() as { plazasDisponibles: number; cancelada?: boolean }
    assertInscribible(actividad)
    tx.set(inscritoRef, {
      uid, email, displayName: 'Stress Tester', telefono: '600000000',
      inscritoEn: serverTimestamp(), aceptoTerminos: true, terminosVersion: 'v1',
    })
    tx.update(actividadRef, { plazasDisponibles: actividad.plazasDisponibles - 1 })
  })
}

// Espeja inscribirseAmbosDias()
async function inscribirseAmbosDiasTest(db: Firestore, actividadIds: number[], uid: string, email: string): Promise<void> {
  const actividadRefs = actividadIds.map(id => doc(db, 'actividades', String(id)))
  const inscritoRefs = actividadIds.map(id => doc(db, 'actividades', String(id), 'inscritos', uid))
  await runTransaction(db, async tx => {
    const [actividadSnaps, inscritoSnaps] = await Promise.all([
      Promise.all(actividadRefs.map(r => tx.get(r))),
      Promise.all(inscritoRefs.map(r => tx.get(r))),
    ])
    if (actividadSnaps.some(s => !s.exists())) return
    if (inscritoSnaps.some(s => s.exists())) return
    const datas = actividadSnaps.map(s => s.data() as { plazasDisponibles: number; cancelada?: boolean })
    datas.forEach(a => assertInscribible(a))
    datas.forEach((a, i) => {
      tx.set(inscritoRefs[i], {
        uid, email, displayName: 'Stress Tester', telefono: '600000000',
        inscritoEn: serverTimestamp(), aceptoTerminos: true, terminosVersion: 'v1',
      })
      tx.update(actividadRefs[i], { plazasDisponibles: a.plazasDisponibles - 1 })
    })
  })
}

// Espeja liberarPlaza()
async function liberarPlazaTest(db: Firestore, actividadId: number, uid: string): Promise<void> {
  const actividadRef = doc(db, 'actividades', String(actividadId))
  const inscritoRef = doc(db, 'actividades', String(actividadId), 'inscritos', uid)
  await runTransaction(db, async tx => {
    const [actividadSnap, inscritoSnap] = await Promise.all([tx.get(actividadRef), tx.get(inscritoRef)])
    if (!inscritoSnap.exists()) throw new YaLiberadaError()
    tx.delete(inscritoRef)
    if (actividadSnap.exists()) {
      const a = actividadSnap.data() as { plazasDisponibles: number; plazas: number }
      tx.update(actividadRef, { plazasDisponibles: Math.min(a.plazasDisponibles + 1, a.plazas) })
    }
  })
}

// El emulador de Firestore, bajo contención real (varias transacciones
// compitiendo por el mismo documento a la vez), a veces evalúa el
// get()/existsAfter() de las reglas contra un estado ya obsoleto y devuelve
// PERMISSION_DENIED en vez de ABORTED — un bug conocido y sin resolver del
// EMULADOR (no de Cloud Firestore real, ni de firestore.rules/db.ts):
// https://github.com/firebase/firebase-tools/issues/10518. El SDK solo
// reintenta automáticamente ante ABORTED, así que acá reintentamos también
// ante ese código puntual — perder un intento legítimo por este bug no es
// lo mismo que perderlo porque ya no quedaban plazas.
async function conReintentoPorBugDelEmulador<T>(fn: () => Promise<T>): Promise<T> {
  const MAX_INTENTOS = 10
  for (let intento = 1; intento <= MAX_INTENTOS; intento++) {
    try {
      return await fn()
    } catch (err) {
      if ((err as { code?: string }).code !== 'permission-denied' || intento === MAX_INTENTOS) throw err
      await new Promise(r => setTimeout(r, 15 + Math.random() * 45))
    }
  }
  throw new Error('unreachable')
}

// ── N "usuarios" concurrentes de verdad ────────────────────────────────────
// Cada uno con su propia app/auth/firestore: las reglas de Firestore evalúan
// quién firmó el request, así que un solo cliente no puede simular N
// identidades a la vez — hacen falta N apps de Firebase distintas.

type UsuarioTest = { app: FirebaseApp; db: Firestore; auth: Auth; uid: string; email: string }

async function crearUsuario(nombre: string): Promise<UsuarioTest> {
  const app = initializeApp({ projectId: PROJECT_ID, apiKey: 'demo-key' }, nombre)
  const auth = getAuth(app)
  connectAuthEmulator(auth, AUTH_EMULATOR_URL, { disableWarnings: true })
  const db = getFirestore(app)
  connectFirestoreEmulator(db, FIRESTORE_EMULATOR_HOST, FIRESTORE_EMULATOR_PORT)
  const email = `${nombre}@test.local`
  const cred = await createUserWithEmailAndPassword(auth, email, 'Password123!')
  // Espeja ensureUserDoc() de src/lib/auth.ts — sin este doc, isAdmin() en
  // firestore.rules hace `get(users/{uid}).data.role`, y sobre un doc que no
  // existe eso es un error de "Null value" que tira abajo toda la regla de
  // `actividades/{id}` (isAdmin() || (...)), no solo la mitad del admin.
  await setDoc(doc(db, 'users', cred.user.uid), {
    email: cred.user.email, displayName: null, role: 'user', createdAt: serverTimestamp(),
  })
  return { app, db, auth, uid: cred.user.uid, email }
}

async function crearUsuarios(n: number, prefijo: string): Promise<UsuarioTest[]> {
  return Promise.all(Array.from({ length: n }, (_, i) => crearUsuario(`${prefijo}-${i}`)))
}

// ── Tests ──────────────────────────────────────────────────────────────────

async function testCarreraSimple() {
  console.log('\n1. Carrera por un solo día (10 plazas, 25 intentos concurrentes)')
  const ACTIVIDAD_ID = 910001
  const PLAZAS = 10
  const INTENTOS = 25
  await seedActividad(ACTIVIDAD_ID, PLAZAS)

  const usuarios = await crearUsuarios(INTENTOS, 'carrera')
  const resultados = await Promise.allSettled(
    usuarios.map(u => conReintentoPorBugDelEmulador(() => inscribirseTest(u.db, ACTIVIDAD_ID, u.uid, u.email))),
  )
  const exitosos = resultados.filter(r => r.status === 'fulfilled').length
  const fallidos = resultados.filter(r => r.status === 'rejected')
  if (fallidos.length > 0) {
    const motivos = new Set(fallidos.map(r => (r as PromiseRejectedResult).reason?.message ?? String((r as PromiseRejectedResult).reason)))
    console.log('    motivos de fallo vistos:', [...motivos])
  }

  const final = await leerActividad(ACTIVIDAD_ID)
  const inscritos = await contarInscritos(ACTIVIDAD_ID)

  check(`exactamente ${PLAZAS} de ${INTENTOS} intentos ganan la plaza`, exitosos === PLAZAS, `ganaron ${exitosos}`)
  check('los que pierden fallan con SinPlazasError (no con otro error)', fallidos.every(r => r.status === 'rejected' && (r.reason as Error).message === 'SIN_PLAZAS'))
  check('plazasDisponibles termina en 0, nunca negativo', final.plazasDisponibles === 0, `terminó en ${final.plazasDisponibles}`)
  check('la cantidad de documentos inscritos/ coincide con plazasDisponibles', inscritos === PLAZAS, `hay ${inscritos} documentos`)

  await borrarActividad(ACTIVIDAD_ID)
}

async function testAmbosDiasCapacidadDispareja() {
  console.log('\n2. "Ambos días" con capacidades distintas (Día A: 10, Día B: 6) — no debe sobrepasar el más chico')
  const DIA_A = 910002
  const DIA_B = 910003
  const INTENTOS = 20
  await seedActividad(DIA_A, 10)
  await seedActividad(DIA_B, 6)

  const usuarios = await crearUsuarios(INTENTOS, 'ambos')
  const resultados = await Promise.allSettled(
    usuarios.map(u => conReintentoPorBugDelEmulador(() => inscribirseAmbosDiasTest(u.db, [DIA_A, DIA_B], u.uid, u.email))),
  )
  const exitosos = resultados.filter(r => r.status === 'fulfilled').length

  const finalA = await leerActividad(DIA_A)
  const finalB = await leerActividad(DIA_B)
  const inscritosA = await contarInscritos(DIA_A)
  const inscritosB = await contarInscritos(DIA_B)

  check('exactamente 6 registros combinados se completan (el límite de la jornada más chica)', exitosos === 6, `se completaron ${exitosos}`)
  check('Día A (10 plazas) NO se vació de más — quedaron 4 libres, no 0', finalA.plazasDisponibles === 4, `quedaron ${finalA.plazasDisponibles}`)
  check('Día B (6 plazas) queda exactamente en 0', finalB.plazasDisponibles === 0, `quedó en ${finalB.plazasDisponibles}`)
  check('nadie quedó registrado en un solo día (todo o nada)', inscritosA === inscritosB && inscritosA === 6, `Día A: ${inscritosA}, Día B: ${inscritosB}`)

  await borrarActividad(DIA_A)
  await borrarActividad(DIA_B)
}

async function testLiberarConcurrente() {
  console.log('\n3. Liberar plazas concurrentemente (10 inscritos, 5 liberan a la vez)')
  const ACTIVIDAD_ID = 910004
  const TOTAL = 10
  await seedActividad(ACTIVIDAD_ID, TOTAL)

  const usuarios = await crearUsuarios(TOTAL, 'liberar')
  await Promise.all(usuarios.map(u => conReintentoPorBugDelEmulador(() => inscribirseTest(u.db, ACTIVIDAD_ID, u.uid, u.email))))

  const aLiberar = usuarios.slice(0, 5)
  await Promise.all(aLiberar.map(u => conReintentoPorBugDelEmulador(() => liberarPlazaTest(u.db, ACTIVIDAD_ID, u.uid))))

  const final = await leerActividad(ACTIVIDAD_ID)
  const inscritos = await contarInscritos(ACTIVIDAD_ID)
  check('plazasDisponibles sube exactamente a 5 tras liberar 5 de 10', final.plazasDisponibles === 5, `quedó en ${final.plazasDisponibles}`)
  check('quedan exactamente 5 documentos inscritos/', inscritos === 5, `hay ${inscritos}`)

  // Doble liberación del mismo usuario en paralelo — solo una debe ganar.
  const [otroUsuario] = usuarios.slice(5, 6)
  const dobles = await Promise.allSettled([
    conReintentoPorBugDelEmulador(() => liberarPlazaTest(otroUsuario.db, ACTIVIDAD_ID, otroUsuario.uid)),
    conReintentoPorBugDelEmulador(() => liberarPlazaTest(otroUsuario.db, ACTIVIDAD_ID, otroUsuario.uid)),
  ])
  const okDobles = dobles.filter(r => r.status === 'fulfilled').length
  const rechazadosDobles = dobles.filter(r => r.status === 'rejected')
  check('liberar la misma plaza 2 veces en paralelo: solo una gana', okDobles === 1, `ganaron ${okDobles}`)
  check('la otra falla con YaLiberadaError', rechazadosDobles.length === 1 && (rechazadosDobles[0] as PromiseRejectedResult).reason.message === 'YA_LIBERADA')

  await borrarActividad(ACTIVIDAD_ID)
}

async function testReglasRechazanTrampa() {
  console.log('\n4. Las reglas de Firestore rechazan mover plazasDisponibles sin registrarse de verdad')
  const ACTIVIDAD_ID = 910005
  await seedActividad(ACTIVIDAD_ID, 10)

  const [tramposo] = await crearUsuarios(1, 'trampa')
  const actividadRef = doc(tramposo.db, 'actividades', String(ACTIVIDAD_ID))

  let rechazado = false
  try {
    // Descuenta plazasDisponibles SIN crear el documento inscritos/{uid}
    // correspondiente — exactamente el ataque que el comentario de
    // firestore.rules dice haber cerrado.
    await updateDoc(actividadRef, { plazasDisponibles: 9 })
  } catch (err) {
    rechazado = (err as { code?: string }).code === 'permission-denied'
  }
  check('update de plazasDisponibles sin inscritos/ correspondiente es rechazado', rechazado)

  const final = await leerActividad(ACTIVIDAD_ID)
  check('plazasDisponibles no se movió', final.plazasDisponibles === 10, `quedó en ${final.plazasDisponibles}`)

  // La otra mitad del mismo ataque: en vez de restar sin haberse dado de
  // baja, INFLAR el contador sin haberse inscrito nunca — con solo
  // existsAfter()/!existsAfter() (sin el exists() previo) esta rama pasaba
  // igual, porque para alguien que nunca tuvo un inscritos/{uid} el
  // "después" es idéntico al "antes": ninguno de los dos existe.
  let rechazadoInflar = false
  try {
    await updateDoc(actividadRef, { plazasDisponibles: 11 })
  } catch (err) {
    rechazadoInflar = (err as { code?: string }).code === 'permission-denied'
  }
  check('update que INFLA plazasDisponibles sin haberse inscrito nunca es rechazado', rechazadoInflar)

  const finalInflado = await leerActividad(ACTIVIDAD_ID)
  check('plazasDisponibles sigue en 10, no se infló', finalInflado.plazasDisponibles === 10, `quedó en ${finalInflado.plazasDisponibles}`)

  await borrarActividad(ACTIVIDAD_ID)
}

async function testReglasRechazanInscritoSinDescontar() {
  console.log('\n5. Las reglas rechazan crear inscritos/{uid} sin descontar la plaza (sobrecupo)')
  const LLENA = 910006
  const ABIERTA = 910007
  const CANCELADA = 910008
  await seedActividad(LLENA, 10, { plazasDisponibles: 0 })
  await seedActividad(ABIERTA, 10)
  await seedActividad(CANCELADA, 10, { cancelada: true })

  const [tramposo] = await crearUsuarios(1, 'sobrecupo')
  const inscritoDirecto = (actividadId: number) => setDoc(doc(tramposo.db, 'actividades', String(actividadId), 'inscritos', tramposo.uid), {
    uid: tramposo.uid, email: tramposo.email, displayName: 'Tramposo', telefono: '600000000',
    inscritoEn: serverTimestamp(), aceptoTerminos: true, terminosVersion: 'v1',
  })
  const esRechazado = async (fn: () => Promise<unknown>) => {
    try { await fn(); return false } catch (err) { return (err as { code?: string }).code === 'permission-denied' }
  }

  check('crear inscritos/ directo en una actividad LLENA es rechazado', await esRechazado(() => inscritoDirecto(LLENA)))
  check('la actividad llena no ganó ningún inscrito', await contarInscritos(LLENA) === 0)

  check('crear inscritos/ directo (sin -1) en una actividad con plazas es rechazado', await esRechazado(() => inscritoDirecto(ABIERTA)))
  check('ni inscrito ni contador cambiaron', await contarInscritos(ABIERTA) === 0 && (await leerActividad(ABIERTA)).plazasDisponibles === 10)

  // Transacción "legítima" (inscrito + -1 juntos) pero saltándose el
  // assertInscribible del cliente — la regla tiene que frenarla igual.
  check('inscribirse a una actividad CANCELADA (inscrito + -1 juntos) es rechazado', await esRechazado(async () => {
    const actividadRef = doc(tramposo.db, 'actividades', String(CANCELADA))
    await runTransaction(tramposo.db, async tx => {
      await tx.get(actividadRef)
      tx.set(doc(tramposo.db, 'actividades', String(CANCELADA), 'inscritos', tramposo.uid), {
        uid: tramposo.uid, email: tramposo.email, displayName: 'Tramposo', telefono: '600000000',
        inscritoEn: serverTimestamp(), aceptoTerminos: true, terminosVersion: 'v1',
      })
      tx.update(actividadRef, { plazasDisponibles: 9 })
    })
  }))

  // Y el camino normal sigue funcionando después de todo esto.
  await conReintentoPorBugDelEmulador(() => inscribirseTest(tramposo.db, ABIERTA, tramposo.uid, tramposo.email))
  check('la inscripción normal (inscrito + -1) sigue funcionando', await contarInscritos(ABIERTA) === 1 && (await leerActividad(ABIERTA)).plazasDisponibles === 9)

  await borrarActividad(LLENA)
  await borrarActividad(ABIERTA)
  await borrarActividad(CANCELADA)
}

async function main() {
  console.log(`Stress test de inscripciones — proyecto emulado "${PROJECT_ID}" (Firestore ${process.env.FIRESTORE_EMULATOR_HOST}, Auth ${AUTH_EMULATOR_URL})`)
  await testCarreraSimple()
  await testAmbosDiasCapacidadDispareja()
  await testLiberarConcurrente()
  await testReglasRechazanTrampa()
  await testReglasRechazanInscritoSinDescontar()

  console.log(`\n${pass} pasaron, ${fail} fallaron.`)
  if (fail > 0) process.exit(1)
}

main().catch(err => {
  console.error('Error inesperado corriendo el stress test:', err)
  process.exit(1)
})
