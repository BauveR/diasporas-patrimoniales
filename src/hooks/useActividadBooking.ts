import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { inscribirse, liberarPlaza, getTelefonoForUser, SinPlazasError, YaLiberadaError, EventoCanceladoError, InscripcionNoAbiertaError } from '../lib/db'
import { isValidTelefono } from '../utils/validators'
import type { Actividad } from '../data/actividades'

// Todo el estado y los handlers de inscripción/liberación de plaza, sacados
// de ActividadPage.tsx para que ActividadExpandido (el panel inline dentro
// de una sección) los comparta sin duplicar la lógica de transacción/email —
// dos copias de esto divergiendo con el tiempo sería el bug clásico.
export function useActividadBooking(actividad: Actividad | undefined) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, inscripcionIds } = useAuth()

  const inscrito = !!actividad && inscripcionIds.includes(actividad.id)
  const [inscribiendo, setInscribiendo] = useState(false)
  const [inscripcionError, setInscripcionError] = useState('')
  const [confirmando, setConfirmando] = useState(false)
  const [liberando, setLiberando] = useState(false)
  const [mostrandoTelefono, setMostrandoTelefono] = useState(false)
  const [telefono, setTelefono] = useState('')
  const [telefonoError, setTelefonoError] = useState('')
  const [aceptoTerminos, setAceptoTerminos] = useState(false)

  // Precarga el teléfono guardado en el perfil (si existe) para no pedirlo de cero cada vez.
  useEffect(() => {
    if (!user) return
    const uid = user.uid
    let cancelled = false
    getTelefonoForUser(uid).then(guardado => {
      if (!cancelled && guardado) setTelefono(guardado)
    })
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid])

  const handleLiberar = async () => {
    if (!user || !actividad) return
    setLiberando(true)
    try {
      await liberarPlaza(actividad.id, user.uid)
      setConfirmando(false)
    } catch (err) {
      if (!(err instanceof YaLiberadaError)) throw err
    } finally {
      setLiberando(false)
    }
  }

  const handleRequestLogin = () => {
    navigate('/login', { state: { background: location } })
  }

  const handleCancelarTelefono = () => {
    setMostrandoTelefono(false)
    setTelefonoError('')
    setAceptoTerminos(false)
  }

  const handleConfirmarInscripcion = async () => {
    if (!user || !actividad) return
    if (!isValidTelefono(telefono)) {
      setTelefonoError('Introduce un teléfono válido (España o formato internacional +XX...)')
      return
    }
    // Defensa además del botón deshabilitado en BookingWidget — por si algo
    // llega a llamar a este handler sin pasar por ese guard.
    if (!aceptoTerminos) return
    setInscribiendo(true)
    setInscripcionError('')
    setTelefonoError('')
    try {
      await inscribirse(actividad.id, user.uid, user.email ?? '', user.displayName ?? '', telefono)
      setMostrandoTelefono(false)
      // `inscrito` (arriba) viene de un listener de Firestore en tiempo real
      // (ver subscribeInscripcionIds en AuthContext) — apenas la escritura
      // de arriba se confirma, ese listener lo pone en `true` solo, y
      // BookingWidget cambia a su propia vista de "ya inscrito" (ticket
      // verde + ✓) sin que haga falta ningún popup aparte que el usuario
      // tenga que cerrar.
      // Fire-and-forget: enviar email de confirmación. El servidor recalcula
      // todo el contenido desde Firestore a partir de actividadId — no manda
      // texto libre, así el endpoint no puede usarse para emails con datos
      // arbitrarios (ver api/send-email.ts).
      user.getIdToken().then(idToken => {
        fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken, actividadIds: [actividad.id] }),
        }).catch(() => { /* silencioso — inscripción ya completada */ })
      }).catch(() => { /* silencioso */ })
    } catch (err) {
      if (err instanceof SinPlazasError) {
        setInscripcionError('Ya no quedan plazas disponibles.')
      } else if (err instanceof EventoCanceladoError) {
        setInscripcionError('Este evento ha sido cancelado.')
      } else if (err instanceof InscripcionNoAbiertaError) {
        setInscripcionError('Las inscripciones todavía no están abiertas para esta actividad.')
      } else {
        setInscripcionError('Error al procesar la inscripción. Inténtalo de nuevo.')
      }
    } finally {
      setInscribiendo(false)
    }
  }

  return {
    isLoggedIn: !!user,
    inscrito,
    inscribiendo, inscripcionError,
    confirmando, setConfirmando,
    liberando,
    mostrandoTelefono, setMostrandoTelefono,
    telefono,
    onTelefonoChange: (v: string) => { setTelefono(v); setTelefonoError('') },
    telefonoError,
    aceptoTerminos, setAceptoTerminos,
    handleLiberar,
    handleRequestLogin,
    handleConfirmarInscripcion,
    handleCancelarTelefono,
  }
}
